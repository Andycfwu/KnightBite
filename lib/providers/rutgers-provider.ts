import { BoundedPromiseCache, readBoundedText, validateJsonBudget, MENU_RESPONSE_BYTES, WEEK_RESPONSE_BYTES, WEEK_JSON_NODES, MAX_MEAL_ITEMS, MAX_MENU_ENTRIES } from "@/lib/providers/ingestion-limits";
import { classifyDietaryLabels } from "@/lib/providers/dietary-labels";
import { assignUniqueItemIds } from "@/lib/menu-item-identity";
import { hasMeaningfulNutrition, unknownNutrition } from "@/lib/nutrition";
import { MenuProvider } from "@/lib/providers/menu-provider";
import { addError, addFailure, createIngestionAttempt, finishIngestionAttempt, IngestionAttempt, IngestionFailure, MealAttempt, trackMeal } from "@/lib/providers/menu-ingestion-log";
import { DailyMenu, DiningHallId, MealSection, MealType, MealLoadResult, MenuItem, Nutrition, Station } from "@/lib/types";

const NUTRISLICE_API_BASE = "https://rutgers.api.nutrislice.com/menu/api";
const CACHE_TTL_MS = 1000 * 60 * 15;
const FAILED_CACHE_TTL_MS = 30_000; // One demand-driven retry per hall/date/meal per cooldown.
const SCHOOL_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const FALLBACK_STATION_LABEL = "Menu Items";
const MIN_MEANINGFUL_ITEM_COUNT = 2;
const NUTRISLICE_TIMEOUT_MS = 4500;

const HALL_CONFIG: Record<
  DiningHallId,
  {
    hallName: string;
    schoolSlug?: string;
    fallbackSchoolId?: number;
  }
> = {
  busch: {
    hallName: "Busch Dining Hall",
    schoolSlug: "busch-dining-hall",
    fallbackSchoolId: 62286
  },
  livingston: {
    hallName: "Livingston Dining Commons",
    schoolSlug: "livingston-dining-commons",
    fallbackSchoolId: 68757
  },
  neilson: {
    hallName: "Neilson Dining Hall",
    schoolSlug: "neilson-dining-hall",
    fallbackSchoolId: 65291
  },
  atrium: {
    hallName: "The Atrium",
    schoolSlug: "the-atrium"
  }
};

const FALLBACK_MENU_TYPE_IDS: Record<MealType, number> = {
  breakfast: 32934,
  lunch: 33316,
  dinner: 33318
};

const CUSTOM_STATION_PATTERN =
  /\b(build your own|byo|omelet|omelette|stir ?fry|pasta|saute|saut[eé]|custom|made[- ]to[- ]order)\b/i;


type RutgersSchool = {
  id?: number;
  name?: string;
  slug?: string;
  active_menu_types?: RutgersMenuType[];
};

type RutgersMenuType = {
  id?: number;
  name?: string;
  slug?: string;
};

type RutgersWeekResponse = {
  menu_type_id?: number | string;
  days?: RutgersMenuDay[];
};

type RutgersMenuDay = {
  date?: string;
  menu_items?: RutgersMenuEntry[];
};

type RutgersMenuEntry = {
  station_id?: number | string | null;
  is_section_title?: boolean;
  is_station_header?: boolean;
  text?: string | null;
  food?: RutgersFood | null;
  serving_size_amount?: number | string | null;
  serving_size_unit?: string | null;
};

type RutgersFood = {
  id?: number | string;
  name?: string | null;
  description?: string | null;
  serving_size_info?: {
    serving_size_amount?: number | string | null;
    serving_size_unit?: string | null;
  } | null;
  rounded_nutrition_info?: Record<string, number | string | null> | null;
  food_sizes?: Array<{
    serving_size_amount?: number | string | null;
    serving_size_unit?: string | null;
    nutrition_info?: Record<string, number | string | null> | null;
  }> | null;
  ingredients?: string | string[] | null;
  synced_ingredients?: string | string[] | null;
  icons?: {
    food_icons?: Array<Record<string, unknown>>;
  } | null;
  image_url?: string | null;
  use_custom_sizes?: boolean | null;
  has_options_or_sides?: boolean | null;
};

type SchoolCacheEntry = {
  expiresAt: number;
  schools: RutgersSchool[];
};

type NutritionKey = keyof Nutrition;

type NutritionFieldRule = {
  max: number;
  allowDecimal?: boolean;
};

type NormalizationDiagnostics = {
  blankStationHeaders: number;
  blankItemNames: number;
  droppedItems: Array<{ mealType: MealType; reason: string; rawName?: string | null; stationName?: string }>;
  dedupedItems: Array<{ mealType: MealType; name: string; stationName: string }>;
  invalidNutritionFields: Array<{ mealType: MealType; itemName: string; field: NutritionKey; rawValue: unknown }>;
  emptyMeals: MealType[];
  fallbackStationLabels: number;
  totalItems: number;
  usableItems: number;
  itemsWithNutrition: number;
  itemsWithoutNutrition: number;
  parserWarnings: Array<{ mealType: MealType; message: string }>;
};

type HallSanitySnapshot = {
  hallId: DiningHallId;
  liveMenuAvailable: boolean;
  mealCount: number;
  stationCount: number;
  itemCount: number;
  liveData: boolean;
  lastUpdatedAt?: string;
};

const NUTRITION_RULES: Record<NutritionKey, NutritionFieldRule> = {
  calories: { max: 2500 },
  protein: { max: 200, allowDecimal: true },
  carbs: { max: 300, allowDecimal: true },
  fat: { max: 200, allowDecimal: true },
  sodium: { max: 10000, allowDecimal: true },
  sugar: { max: 300, allowDecimal: true }
};

let schoolCache: SchoolCacheEntry | null = null;
type CachedMeal = MealLoadResult & { detail: MealAttempt; diagnostics: NormalizationDiagnostics; expiresAt: number };
const mealCache = new BoundedPromiseCache<CachedMeal>(48, 16 * 1024 * 1024);
let schoolLoad: Promise<RutgersSchool[]> | null = null;
const menuCache = new BoundedPromiseCache<DailyMenu | null>(16, 16 * 1024 * 1024);

function isDevelopment() {
  return process.env.NODE_ENV !== "production";
}

function logDevError(message: string, details?: unknown) {
  if (!isDevelopment()) {
    return;
  }

  console.error(`[rutgers-provider] ${message}`, details);
}

function debugLog(message: string, details?: unknown) {
  if (!isDevelopment()) {
    return;
  }

  console.info(`[rutgers-provider] ${message}`, details);
}

function createDiagnostics(): NormalizationDiagnostics {
  return {
    blankStationHeaders: 0,
    blankItemNames: 0,
    droppedItems: [],
    dedupedItems: [],
    invalidNutritionFields: [],
    emptyMeals: [],
    fallbackStationLabels: 0,
    totalItems: 0,
    usableItems: 0,
    itemsWithNutrition: 0,
    itemsWithoutNutrition: 0,
    parserWarnings: []
  };
}

function logNormalizationDiagnostics(diagnostics: NormalizationDiagnostics) {
  if (!isDevelopment()) {
    return;
  }

  // Counts are in the structured attempt summary; retain detailed development-only examples.
  if (diagnostics.droppedItems.length > 0) {
    console.info("[rutgers-provider] Dropped live items", diagnostics.droppedItems.slice(0, 12));
  }

  if (diagnostics.dedupedItems.length > 0) {
    console.info("[rutgers-provider] Deduped live items", diagnostics.dedupedItems.slice(0, 12));
  }

  if (diagnostics.invalidNutritionFields.length > 0) {
    console.info(
      "[rutgers-provider] Invalid nutrition values",
      diagnostics.invalidNutritionFields.slice(0, 16)
    );
  }

  if (diagnostics.parserWarnings.length > 0) {
    console.info("[rutgers-provider] Parser warnings", diagnostics.parserWarnings.slice(0, 16));
  }
}

function normalizeWhitespace(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toMealLabel(mealType: MealType) {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    if (!/^[-+]?(?:\d+\.?\d*|\.\d+)\s*(?:g|mg|kcal)?$/i.test(value.trim())) return null;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeNutritionValue(
  field: NutritionKey,
  value: unknown,
  diagnostics: NormalizationDiagnostics,
  mealType: MealType,
  itemName: string
) {
  const parsed = toNumber(value);

  if (parsed === null || parsed < 0 || parsed > NUTRITION_RULES[field].max) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      diagnostics.invalidNutritionFields.push({ mealType, itemName, field, rawValue: value });
    }

    return null;
  }

  return NUTRITION_RULES[field].allowDecimal ? Number(parsed.toFixed(1)) : Math.round(parsed);
}

function normalizeNutrition(
  info: RutgersFood["rounded_nutrition_info"],
  diagnostics: NormalizationDiagnostics,
  mealType: MealType,
  itemName: string
): Nutrition {
  return {
    calories: normalizeNutritionValue("calories", info?.calories, diagnostics, mealType, itemName),
    protein: normalizeNutritionValue("protein", info?.g_protein, diagnostics, mealType, itemName),
    carbs: normalizeNutritionValue("carbs", info?.g_carbs, diagnostics, mealType, itemName),
    fat: normalizeNutritionValue("fat", info?.g_fat, diagnostics, mealType, itemName),
    sodium: normalizeNutritionValue("sodium", info?.mg_sodium, diagnostics, mealType, itemName),
    sugar: normalizeNutritionValue("sugar", info?.g_sugar, diagnostics, mealType, itemName)
  };
}


function normalizeServingSize(entry: RutgersMenuEntry, food: RutgersFood, preferEntry = false) {
  if (preferEntry) food = { ...food, serving_size_info: {
    serving_size_amount: entry.serving_size_amount ?? food.serving_size_info?.serving_size_amount,
    serving_size_unit: entry.serving_size_unit ?? food.serving_size_info?.serving_size_unit
  } };
  const amount = normalizeWhitespace(
    String(food.serving_size_info?.serving_size_amount ?? entry.serving_size_amount ?? "")
  );
  const unit = normalizeWhitespace(food.serving_size_info?.serving_size_unit ?? entry.serving_size_unit ?? "");
  const combined = `${amount} ${unit}`.trim();

  return combined || undefined;
}

// Atrium's published Nutrislice UI reads the selected custom-size record, which
// can disagree with rounded_nutrition_info (observed oatmeal protein/sugar).
// Select only an unambiguous exact portion; never fill its missing fields from
// another portion or the conflicting top-level aggregate. Other halls are unchanged.
function atriumPortionNutrition(entry: RutgersMenuEntry, food: RutgersFood) {
  if (food.food_sizes == null) return food.rounded_nutrition_info;
  if (!Array.isArray(food.food_sizes)) return null;
  const amount = entry.serving_size_amount ?? food.serving_size_info?.serving_size_amount;
  const unit = normalizeWhitespace(entry.serving_size_unit ?? food.serving_size_info?.serving_size_unit).toLowerCase();
  const canonicalAmount = (value: unknown) => {
    const text = normalizeWhitespace(String(value ?? ""));
    return /^\d+(?:\.\d+)?$/.test(text) ? String(Number(text)) : text;
  };
  if (!canonicalAmount(amount) || !unit) return null;
  const sizes = food.food_sizes.filter(size => size &&
    canonicalAmount(size.serving_size_amount) === canonicalAmount(amount) &&
    normalizeWhitespace(size.serving_size_unit).toLowerCase() === unit);
  return sizes.length === 1 ? sizes[0].nutrition_info : null;
}

function normalizeStringList(value: string | string[] | null | undefined) {
  const rawEntries = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/,\s*/)
      : [];

  const entries = rawEntries.map((entry) => normalizeWhitespace(String(entry))).filter(Boolean);
  return entries.length > 0 ? Array.from(new Set(entries)) : undefined;
}

function getIconLabel(icon: Record<string, unknown>) {
  const candidates = [icon.name, icon.label, icon.text, icon.synced_name, icon.slug];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && normalizeWhitespace(candidate)) {
      return normalizeWhitespace(candidate);
    }
  }

  return null;
}

function normalizeDietaryLabels(food: RutgersFood) {
  return classifyDietaryLabels((food.icons?.food_icons ?? []).map(getIconLabel).filter((label): label is string => Boolean(label)));
}

function isCustomizableName(value: string | null | undefined) {
  return CUSTOM_STATION_PATTERN.test(value ?? "");
}

function sanitizeStationName(value: string | null | undefined, diagnostics: NormalizationDiagnostics) {
  const normalized = normalizeWhitespace(value);

  if (!normalized || /^[-–—]+$/.test(normalized) || /^(station|section)$/i.test(normalized)) {
    diagnostics.fallbackStationLabels += 1;
    return FALLBACK_STATION_LABEL;
  }

  return normalized;
}

function sanitizeItemName(value: string | null | undefined) {
  const normalized = normalizeWhitespace(value);

  if (!normalized || /^[-–—]+$/.test(normalized) || /^n\/?a$/i.test(normalized)) {
    return null;
  }

  return normalized;
}

function buildItemId(hallId: DiningHallId, mealType: MealType, stationId: string, food: RutgersFood, itemName: string) {
  const explicitId = food.id !== undefined && food.id !== null ? String(food.id) : slugify(itemName);
  return `${hallId}-${mealType}-${stationId}-${explicitId}`;
}

function getDedupeKey(item: MenuItem) {
  const nutritionSignature = [
    item.nutrition.calories ?? "unknown",
    item.nutrition.protein ?? "unknown",
    item.nutrition.carbs ?? "unknown",
    item.nutrition.fat ?? "unknown",
    item.nutrition.sodium ?? "unknown",
    item.nutrition.sugar ?? "unknown"
  ].join(":");

  // Conservative dedupe: only collapse entries that match within the same station on
  // normalized name + serving size + nutrition + custom state. Similar names with
  // different sizes or nutrition still survive as distinct items.
  return [
    item.stationId,
    slugify(item.name),
    item.servingSize ?? "",
    item.isCustom ? "custom" : "standard",
    nutritionSignature
  ].join("|");
}

async function fetchJson<T>(url: string, byteLimit = MENU_RESPONSE_BYTES, nodeLimit?: number): Promise<T> {
  return fetchWithTimeout(url, {
    headers: {
      accept: "application/json"
    }
  }, NUTRISLICE_TIMEOUT_MS, async (response, signal) => {
    try {
      const value = JSON.parse(await readBoundedText(response, byteLimit, signal));
      validateJsonBudget(value, nodeLimit);
      return value as T;
    } catch (error) {
      if (error instanceof IngestionFailure) throw error;
      throw new IngestionFailure(error instanceof SyntaxError ? "malformed_json" : "request_error");
    }
  });
}

async function fetchWithTimeout<T>(url: string, init: RequestInit, timeoutMs: number, readResponse: (response: Response, signal: AbortSignal) => Promise<T>) {
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      reject(new IngestionFailure("timeout"));
      controller.abort();
    }, timeoutMs);
  });

  try {
    // Keep the deadline active through body consumption, and settle even if a
    // fetch implementation ignores abort. Promise.race observes later rejections.
    return await Promise.race([
      (async () => {
        const response = await fetch(url, { ...init, redirect: "manual", signal: controller.signal });
        if (response.redirected || (response.status >= 300 && response.status < 400)) {
          throw new IngestionFailure("destination_rejected");
        }
        if (!response.ok) throw new IngestionFailure("http_error", response.status);
        return readResponse(response, controller.signal);
      })(),
      deadline
    ]);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new IngestionFailure("timeout");
    }

    throw error instanceof IngestionFailure ? error : new IngestionFailure("request_error");
  } finally {
    clearTimeout(timeout);
  }
}

async function getSchools() {
  const now = Date.now();
  if (schoolCache && schoolCache.expiresAt > now) {
    return schoolCache.schools;
  }

  if (!schoolLoad) {
    schoolLoad = fetchJson<RutgersSchool[]>(`${NUTRISLICE_API_BASE}/schools/`).finally(() => { schoolLoad = null; });
  }
  const schools = await schoolLoad;
  schoolCache = {
    schools,
    expiresAt: now + SCHOOL_CACHE_TTL_MS
  };

  return schools;
}

async function resolveSchool(hallId: DiningHallId, attempt: IngestionAttempt) {
  const config = HALL_CONFIG[hallId];

  if (!config.schoolSlug && !config.fallbackSchoolId) {
    attempt.schoolResolution = "unavailable";
    addFailure(attempt, "school_mapping_missing", "schools");
    return null;
  }

  let discoveryIssue = false;
  try {
    const fromCache = Boolean(schoolCache && schoolCache.expiresAt > Date.now());
    const schools = await getSchools();
    if (!Array.isArray(schools)) {
      addFailure(attempt, "unexpected_shape", "schools");
      discoveryIssue = true;
    }
    const matchedSchool =
      schools.find((school) => school.slug === config.schoolSlug) ??
      schools.find((school) => school.id === config.fallbackSchoolId) ??
      schools.find((school) => school.name?.toLowerCase() === config.hallName.toLowerCase());

    if (matchedSchool) {
      // Atrium is resolved from Rutgers' index. Never borrow another location or
      // an unadvertised meal type when this new authoritative mapping is absent.
      if (hallId === "atrium" && (matchedSchool.slug !== config.schoolSlug ||
          matchedSchool.name !== config.hallName || !Number.isSafeInteger(matchedSchool.id) || matchedSchool.id! <= 0)) {
        attempt.schoolResolution = "unavailable";
        addFailure(attempt, "school_mapping_missing", "schools");
        return null;
      }
      attempt.schoolResolution = fromCache ? "cached" : "discovered";
      return matchedSchool;
    }
  } catch (error) {
    if (!discoveryIssue) addError(attempt, error, "schools", "parse_error");
    discoveryIssue = true;
    logDevError(`School discovery failed for ${hallId}.`, error);
  }

  if (!config.fallbackSchoolId) {
    attempt.schoolResolution = "unavailable";
    if (!discoveryIssue) addFailure(attempt, "school_mapping_missing", "schools");
    return null;
  }

  attempt.schoolResolution = "static_fallback";
  if (!discoveryIssue) addFailure(attempt, "school_mapping_missing", "schools");
  return {
    id: config.fallbackSchoolId,
    name: config.hallName,
    slug: config.schoolSlug
  } satisfies RutgersSchool;
}

function resolveMenuTypeId(school: RutgersSchool, mealType: MealType) {
  const byName = school.active_menu_types?.find((type) => {
    const haystack = `${type.name ?? ""} ${type.slug ?? ""}`.toLowerCase();
    return haystack.includes(mealType);
  });

  return byName?.id ?? FALLBACK_MENU_TYPE_IDS[mealType];
}

function createStation(stationId: string, stationName: string): Station {
  return {
    id: stationId,
    name: stationName,
    items: []
  };
}

function createCustomPlaceholderItem(
  hallId: DiningHallId,
  mealType: MealType,
  stationId: string,
  stationName: string
): MenuItem {
  return {
    id: `${hallId}-${mealType}-${stationId}-custom`,
    name: stationName,
    stationId,
    stationName,
    hallId,
    mealType,
    nutrition: unknownNutrition(),
    description: "Nutrition varies based on your selections",
    tags: ["custom", "build-your-own"],
    imageUrl: null,
    isCustom: true,
    available: true
  };
}

function normalizeMealSection(
  hallId: DiningHallId,
  mealType: MealType,
  day: RutgersMenuDay,
  diagnostics: NormalizationDiagnostics
): MealSection | null {
  const stationOrder: string[] = [];
  const stationMap = new Map<string, Station>();
  const customStations = new Set<string>();
  const dedupeKeys = new Set<string>();

  let currentStationId = slugify(FALLBACK_STATION_LABEL);
  let currentStationName = FALLBACK_STATION_LABEL;

  const ensureStation = (stationIdValue: string | null | undefined, stationNameValue: string | null | undefined) => {
    const normalizedStationName = sanitizeStationName(stationNameValue, diagnostics);
    const normalizedStationId = slugify(stationIdValue || normalizedStationName || FALLBACK_STATION_LABEL);

    if (!stationMap.has(normalizedStationId)) {
      stationMap.set(normalizedStationId, createStation(normalizedStationId, normalizedStationName));
      stationOrder.push(normalizedStationId);
    }

    return stationMap.get(normalizedStationId)!;
  };

  if (!Array.isArray(day.menu_items ?? [])) throw new IngestionFailure("unexpected_shape");
  if ((day.menu_items?.length ?? 0) > MAX_MENU_ENTRIES || (day.menu_items ?? []).filter(entry => entry?.food).length > MAX_MEAL_ITEMS) throw new IngestionFailure("resource_limit");
  for (const entry of day.menu_items ?? []) {
    if (!entry || typeof entry !== "object" || (entry.food != null && typeof entry.food !== "object")) throw new IngestionFailure("unexpected_shape");
    if (entry.food?.icons?.food_icons != null && (!Array.isArray(entry.food.icons.food_icons) || entry.food.icons.food_icons.some(icon => !icon || typeof icon !== "object"))) throw new IngestionFailure("unexpected_shape");
    if (entry.is_section_title || entry.is_station_header) {
      const rawStationName = normalizeWhitespace(entry.text);
      if (!rawStationName) {
        diagnostics.blankStationHeaders += 1;
      }

      const stationName = sanitizeStationName(rawStationName, diagnostics);
      const stationId = normalizeWhitespace(String(entry.station_id ?? stationName));

      currentStationId = slugify(stationId || stationName || FALLBACK_STATION_LABEL);
      currentStationName = stationName;
      ensureStation(currentStationId, currentStationName);

      if (isCustomizableName(stationName)) {
        customStations.add(currentStationId);
      }

      continue;
    }

    const food = entry.food;
    const itemName = sanitizeItemName(food?.name);

    if (!itemName || !food) {
      diagnostics.blankItemNames += 1;
      diagnostics.droppedItems.push({
        mealType,
        reason: "blank-name",
        rawName: food?.name ?? null,
        stationName: currentStationName
      });
      continue;
    }

    const station = ensureStation(String(entry.station_id ?? currentStationId), currentStationName);
    const stationId = station.id;
    const stationName = station.name;
    const nutrition = normalizeNutrition(hallId === "atrium" ? atriumPortionNutrition(entry, food) : food.rounded_nutrition_info, diagnostics, mealType, itemName);
    const itemLooksCustom =
      isCustomizableName(itemName) ||
      isCustomizableName(stationName) ||
      Boolean(food.use_custom_sizes) ||
      Boolean(food.has_options_or_sides);
    const shouldDeemphasizeNutrition =
      itemLooksCustom && (!hasMeaningfulNutrition(nutrition) || Boolean(food.has_options_or_sides));

    if (isCustomizableName(stationName)) {
      customStations.add(stationId);
    }

    const dietary = normalizeDietaryLabels(food);
    const tags = new Set(dietary.tags ?? []);
    if (itemLooksCustom) {
      tags.add("custom");
      tags.add("build-your-own");
    }

    const normalizedItem: MenuItem = {
      id: buildItemId(hallId, mealType, stationId, food, itemName),
      name: itemName,
      stationId,
      stationName,
      hallId,
      mealType,
      servingSize: normalizeServingSize(entry, food, hallId === "atrium"),
      nutrition: shouldDeemphasizeNutrition
        ? unknownNutrition()
        : nutrition,
      description: shouldDeemphasizeNutrition
        ? "Nutrition varies based on your selections"
        : normalizeWhitespace(food.description) || undefined,
      ingredients: normalizeStringList(food.synced_ingredients ?? food.ingredients),
      allergens: dietary.allergens,
      sourceLabels: dietary.sourceLabels,
      tags: tags.size > 0 ? Array.from(tags) : undefined,
      imageUrl: food.image_url ?? null,
      isCustom: shouldDeemphasizeNutrition || undefined,
      available: true
    };

    diagnostics.totalItems += 1;
    if (hasMeaningfulNutrition(normalizedItem.nutrition) || normalizedItem.isCustom) {
      diagnostics.usableItems += 1;
    }
    if (hasMeaningfulNutrition(normalizedItem.nutrition)) {
      diagnostics.itemsWithNutrition += 1;
    } else {
      diagnostics.itemsWithoutNutrition += 1;
    }

    const dedupeKey = getDedupeKey(normalizedItem);
    if (dedupeKeys.has(dedupeKey)) {
      diagnostics.dedupedItems.push({ mealType, name: normalizedItem.name, stationName });
      continue;
    }

    dedupeKeys.add(dedupeKey);
    station.items.push(normalizedItem);
  }

  for (const stationId of stationOrder) {
    const station = stationMap.get(stationId);
    if (!station || station.items.length > 0 || !customStations.has(stationId)) {
      continue;
    }

    station.items.push(createCustomPlaceholderItem(hallId, mealType, station.id, station.name));
    diagnostics.totalItems += 1;
    diagnostics.usableItems += 1;
    diagnostics.itemsWithoutNutrition += 1;
  }

  assignUniqueItemIds(Array.from(stationMap.values()).flatMap((station) => station.items));
  const stations = stationOrder
    .map((stationId) => stationMap.get(stationId))
    .filter((station): station is Station => Boolean(station))
    .map((station) => ({
      ...station,
      items: station.items.filter((item) => Boolean(item.name))
    }))
    .filter((station) => station.items.length > 0);

  if (stations.length === 0) {
    diagnostics.emptyMeals.push(mealType);
    return null;
  }

  return {
    id: `${hallId}-${mealType}`,
    type: mealType,
    label: toMealLabel(mealType),
    stations
  };
}

async function fetchMealSection(
  hallId: DiningHallId,
  date: string,
  school: RutgersSchool,
  mealType: MealType,
  diagnostics: NormalizationDiagnostics,
  detail: MealAttempt
) {
  if (!school.id) {
    detail.outcome = "failed";
    addFailure(detail, "school_mapping_missing", "schools");
    return null;
  }

  if (school.active_menu_types != null && !Array.isArray(school.active_menu_types)) {
    addFailure(detail, "unexpected_shape", "schools");
  }
  const menuTypeId = resolveMenuTypeId(school, mealType);
  if (hallId === "atrium" && (!Number.isSafeInteger(menuTypeId) || !school.active_menu_types?.some(type =>
      type.id === menuTypeId && `${type.name ?? ""} ${type.slug ?? ""}`.toLowerCase().includes(mealType)))) {
    detail.outcome = "failed";
    addFailure(detail, "school_mapping_missing", "schools");
    return null;
  }
  const [year, month, day] = date.split("-");
  const url = `${NUTRISLICE_API_BASE}/weeks/school/${school.id}/menu-type/${menuTypeId}/${year}/${month}/${day}/`;

  let shapeIssue = false;
  let readingPayload = true;
  try {
    const payload = await fetchJson<RutgersWeekResponse>(url, WEEK_RESPONSE_BYTES, WEEK_JSON_NODES);
    readingPayload = false;
    if (hallId === "atrium" && payload?.menu_type_id != null && String(payload.menu_type_id) !== String(menuTypeId)) {
      throw new IngestionFailure("unexpected_shape");
    }
    // Record malformed context; requested-day matching remains exact and normalization rejects invalid collections.
    if (!payload || !Array.isArray(payload.days) || payload.days.some((day) => !day || typeof day.date !== "string")) {
      shapeIssue = true;
      addFailure(detail, "unexpected_shape", "menu");
    }
    const requestedDay = payload.days?.find((menuDay) => menuDay.date === date);

    if (!requestedDay) {
      detail.outcome = "failed";
      if (!shapeIssue) addFailure(detail, "requested_date_missing", "menu");
      diagnostics.emptyMeals.push(mealType);
      debugLog(`No ${mealType} day matched ${date} for ${hallId}.`, { url });
      return null;
    }

    if (requestedDay.menu_items != null && !Array.isArray(requestedDay.menu_items)) {
      shapeIssue = true;
      addFailure(detail, "unexpected_shape", "menu");
    }
    detail.normalizationStarted = true;
    const section = normalizeMealSection(hallId, mealType, requestedDay, diagnostics);
    for (const station of section?.stations ?? []) for (const item of station.items) item.menuDate = date;
    detail.normalizationCompleted = true;
    if (!section) {
      detail.outcome = Array.isArray(requestedDay.menu_items) && requestedDay.menu_items.every(entry => entry && typeof entry === "object" &&
        (entry.is_section_title === true || entry.is_station_header === true)) && !shapeIssue ? "empty" : "failed";
      detail.parsed = { stations: 0, items: 0 };
      addFailure(detail, "no_items", "normalization");
    }
    return section;
  } catch (error) {
    detail.outcome = "failed";
    if (!shapeIssue) addError(detail, error, detail.normalizationStarted ? "normalization" : "menu",
      readingPayload ? "request_error" : "parse_error");
    diagnostics.emptyMeals.push(mealType);
    logDevError(`Failed to fetch ${mealType} menu for ${hallId}.`, error);
    return null;
  }
}

function isMeaningfullyUsableMenu(meals: MealSection[], diagnostics: NormalizationDiagnostics) {
  if (meals.length === 0) {
    return false;
  }

  const stationCount = meals.reduce((count, meal) => count + meal.stations.length, 0);
  const itemCount = meals.reduce(
    (count, meal) => count + meal.stations.reduce((stationCountTotal, station) => stationCountTotal + station.items.length, 0),
    0
  );
  const trustworthyItemCount = meals.reduce(
    (count, meal) =>
      count +
      meal.stations.reduce(
        (stationTotal, station) =>
          stationTotal + station.items.filter((item) => hasMeaningfulNutrition(item.nutrition) || item.isCustom).length,
        0
      ),
    0
  );

  if (stationCount === 0 || itemCount === 0) {
    return false;
  }

  if (diagnostics.usableItems === 0) {
    return false;
  }

  const parserWarningRatio = itemCount > 0 ? diagnostics.parserWarnings.length / itemCount : 1;
  const fallbackLabelRatio = stationCount > 0 ? diagnostics.fallbackStationLabels / stationCount : 1;
  const trustworthyCoverage = itemCount > 0 ? trustworthyItemCount / itemCount : 0;

  if (trustworthyCoverage < 0.2 && itemCount < 4) {
    return false;
  }

  if (parserWarningRatio > 0.9 && trustworthyItemCount < MIN_MEANINGFUL_ITEM_COUNT) {
    return false;
  }

  if (fallbackLabelRatio > 0.8 && trustworthyItemCount < MIN_MEANINGFUL_ITEM_COUNT) {
    return false;
  }

  // Conservative usability check: treat live data as unusable only when normalization leaves almost
  // nothing to show. A single well-formed meal or a couple of trustworthy/custom items still render.
  return trustworthyItemCount >= MIN_MEANINGFUL_ITEM_COUNT || meals.length >= 2;
}

// Cache each meal independently: an expired failure never evicts a successful sibling.
// No automatic retry loop. Daily requests and explicit retries share this same key/promise.
async function loadMeal(hallId: DiningHallId, date: string, school: RutgersSchool | null, type: MealType,
  attempt: IngestionAttempt, diagnostics: NormalizationDiagnostics): Promise<CachedMeal> {
  let fetched = false;
  attempt.meals[type].outcome = "pending";
  const result = await mealCache.load(`${hallId}:${date}:${type}`, async () => {
    fetched = true;
    const own = createIngestionAttempt(hallId, date);
    const counts = createDiagnostics();
    attempt.meals[type] = own.meals[type];
    const resolvedSchool = school ?? await resolveSchool(hallId, attempt);
    const section = resolvedSchool ? await trackMeal(own, type, () => fetchMealSection(hallId, date, resolvedSchool, type, counts, own.meals[type])) : null;
    const state = section ? "available" : own.meals[type].outcome === "empty" ? "empty" : "unavailable";
    const expiresAt = Date.now() + (state === "unavailable" ? FAILED_CACHE_TTL_MS : CACHE_TTL_MS);
    return { hallId, date, mealType: type, section, status: state === "unavailable"
      ? { state, retryAt: expiresAt } : { state, retrievedAt: new Date().toISOString() },
      detail: own.meals[type], diagnostics: counts, expiresAt };
  }, result => Math.max(0, result.expiresAt - Date.now()));
  attempt.meals[type] = { ...result.detail, cacheHit: !fetched };
  // Counts describe normalization of the returned sections; cacheHit identifies reused work.
  for (const key of Object.keys(diagnostics) as Array<keyof NormalizationDiagnostics>) {
    const value = result.diagnostics[key];
    if (Array.isArray(value)) (diagnostics[key] as unknown[]).push(...value);
    else (diagnostics[key] as number) += value;
  }
  return result;
}

async function loadDailyMenu(
  hallId: DiningHallId, date: string, diagnostics: NormalizationDiagnostics, attempt: IngestionAttempt
): Promise<DailyMenu | null> {
  const hallConfig = HALL_CONFIG[hallId];
  const school = await resolveSchool(hallId, attempt);

  if (!school) {
    debugLog(`No live school mapping available for ${hallId}; returning unavailable.`);
    return null;
  }

  const results = await Promise.all((["breakfast", "lunch", "dinner"] as MealType[]).map(type =>
    loadMeal(hallId, date, school, type, attempt, diagnostics)));
  const mealSections = results.map(result => result.section).filter((meal): meal is MealSection => Boolean(meal));

  logNormalizationDiagnostics(diagnostics);

  const confirmedEmptyOnly = mealSections.length === 0 && results.some(result => result.status.state === "empty");
  if (!confirmedEmptyOnly && !isMeaningfullyUsableMenu(mealSections, diagnostics)) {
    if (mealSections.length > 0) addFailure(attempt, "unusable_menu", "normalization");
    debugLog(`Live menu for ${hallId} on ${date} was not usable after normalization; returning unavailable.`, {
      mealCount: mealSections.length,
      usableItems: diagnostics.usableItems,
      totalItems: diagnostics.totalItems
    });
    return null;
  }

  return {
    date,
    hallId,
    hallName: school.name ?? hallConfig.hallName,
    meals: mealSections,
    mealStatus: Object.fromEntries(results.map(result => [result.mealType, result.status])),
    isLiveData: true,
    lastUpdatedAt: results.flatMap(result => result.status.retrievedAt ? [result.status.retrievedAt] : []).sort().at(-1)
  };
}

function diagnosticCounts(diagnostics: NormalizationDiagnostics) {
  return {
      processedItemsBeforeDedup: diagnostics.totalItems,
      droppedItems: diagnostics.droppedItems.length,
      deduplicatedItems: diagnostics.dedupedItems.length,
      itemsWithMeaningfulNutritionBeforeDedup: diagnostics.itemsWithNutrition,
      itemsWithoutMeaningfulNutritionBeforeDedup: diagnostics.itemsWithoutNutrition,
      meaningfulOrCustomItemsBeforeDedup: diagnostics.usableItems,
      blankStationHeaders: diagnostics.blankStationHeaders,
      blankItemNames: diagnostics.blankItemNames,
      fallbackStationLabels: diagnostics.fallbackStationLabels,
      invalidNutritionFields: diagnostics.invalidNutritionFields.length,
      parserWarnings: diagnostics.parserWarnings.length
    };
}

async function loadDailyMenuWithSummary(hallId: DiningHallId, date: string) {
  const attempt = createIngestionAttempt(hallId, date);
  const diagnostics = createDiagnostics();
  let menu: DailyMenu | null = null;
  let failed = false;
  try {
    menu = await loadDailyMenu(hallId, date, diagnostics, attempt);
    return menu;
  } catch (error) {
    failed = true;
    if (!Object.values(attempt.meals).some((meal) => meal.outcome === "failed" && meal.failures.length > 0)) {
      addError(attempt, error, "ingestion");
    }
    throw error;
  } finally {
    finishIngestionAttempt(attempt, menu, failed, () => diagnosticCounts(diagnostics));
  }
}

export const rutgersMenuProvider: MenuProvider = {
  async getDailyMenu(hallId, date) {
    return menuCache.load(`${hallId}:${date}`, () => loadDailyMenuWithSummary(hallId, date),
      menu => menu ? Math.max(0, Math.min(...Object.values(menu.mealStatus ?? {}).map(status =>
        status!.retryAt ?? Date.parse(status!.retrievedAt!) + CACHE_TTL_MS)) - Date.now()) : FAILED_CACHE_TTL_MS).catch((error) => {
        logDevError(`Live Rutgers provider failed for ${hallId} on ${date}.`, error);
        return null;
      });
  }
};

/** Explicit demand-driven single-meal recovery. Same bounds, source, cache and diagnostics as daily loading. */
export async function retryRutgersMeal(hallId: DiningHallId, date: string, mealType: MealType): Promise<MealLoadResult> {
  const attempt = createIngestionAttempt(hallId, date);
  attempt.requestedMeal = mealType;
  const diagnostics = createDiagnostics();
  let menu: DailyMenu | null = null;
  const unavailable = (): MealLoadResult => ({ hallId, date, mealType, section: null,
    status: { state: "unavailable", retryAt: Date.now() + FAILED_CACHE_TTL_MS } });
  try {
    const result = await loadMeal(hallId, date, null, mealType, attempt, diagnostics);
    if (result.section) menu = { hallId, date, hallName: HALL_CONFIG[hallId].hallName, meals: [result.section], isLiveData: true };
    menuCache.invalidate(`${hallId}:${date}`);
    return { hallId, date, mealType, section: result.section, status: result.status };
  } catch (error) {
    addError(attempt, error, "ingestion");
    return unavailable();
  } finally {
    // Non-requested siblings remain not_started; no synthetic success or measurements.
    if (!attempt.meals[mealType].cacheHit) finishIngestionAttempt(attempt, menu, false, () => diagnosticCounts(diagnostics));
  }
}

export async function debugRunLiveMenuSanityCheck(date: string): Promise<HallSanitySnapshot[] | null> {
  if (!isDevelopment()) {
    return null;
  }

  const hallIds: DiningHallId[] = ["busch", "livingston", "neilson", "atrium"];
  const results = await Promise.all(
    hallIds.map(async (hallId) => {
      const menu = await rutgersMenuProvider.getDailyMenu(hallId, date);

      return {
        hallId,
        liveMenuAvailable: Boolean(menu),
        mealCount: menu?.meals.length ?? 0,
        stationCount: menu?.meals.reduce((count, meal) => count + meal.stations.length, 0) ?? 0,
        itemCount:
          menu?.meals.reduce(
            (count, meal) => count + meal.stations.reduce((stationCount, station) => stationCount + station.items.length, 0),
            0
          ) ?? 0,
        liveData: Boolean(menu?.isLiveData),
        lastUpdatedAt: menu?.lastUpdatedAt
      } satisfies HallSanitySnapshot;
    })
  );

  console.table(results);
  return results;
}

export async function debugInspectRutgersDailyMenu(hallId: DiningHallId, date: string) {
  const menu = await rutgersMenuProvider.getDailyMenu(hallId, date);

  if (isDevelopment()) {
    console.dir(menu, { depth: null });
  }

  return menu;
}

// Nutrislice icon metadata and custom
// station detection should still be re-verified against more real menu examples before
// relying on them for user-facing allergen or nutrition claims.

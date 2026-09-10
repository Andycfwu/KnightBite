import { BoundedPromiseCache, readBoundedText, validateJsonBudget, MENU_RESPONSE_BYTES, WEEK_RESPONSE_BYTES, WEEK_JSON_NODES, LABEL_RESPONSE_BYTES, MAX_MEAL_ITEMS, MAX_MENU_ENTRIES } from "@/lib/providers/ingestion-limits";
import { classifyDietaryLabels } from "@/lib/providers/dietary-labels";
import { assignUniqueItemIds } from "@/lib/menu-item-identity";
import { hasMeaningfulNutrition, unknownNutrition } from "@/lib/nutrition";
import { MenuProvider } from "@/lib/providers/menu-provider";
import { foodProNetLabelUrl } from "@/lib/providers/foodpronet-url";
import { assertLabelIdentity } from "@/lib/providers/foodpronet-label-identity";
import { validateAtriumMenuContext } from "@/lib/providers/atrium-menu-context";
import { addError, addFailure, createIngestionAttempt, finishIngestionAttempt, IngestionAttempt, IngestionFailure, MealAttempt, trackMeal } from "@/lib/providers/menu-ingestion-log";
import { DailyMenu, DiningHallId, MealSection, MealType, MenuItem, Nutrition, Station } from "@/lib/types";

const NUTRISLICE_API_BASE = "https://rutgers.api.nutrislice.com/menu/api";
const FOODPRONET_BASE = "https://menuportal23.dining.rutgers.edu/FoodPronet";
const CACHE_TTL_MS = 1000 * 60 * 15;
const FAILED_CACHE_TTL_MS = 1000 * 60 * 2;
const SCHOOL_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const FALLBACK_STATION_LABEL = "Menu Items";
const MIN_MEANINGFUL_ITEM_COUNT = 2;
const ATRIUM_LOCATION_NUM = 13;
const NUTRISLICE_TIMEOUT_MS = 4500;
const FOODPRONET_MENU_TIMEOUT_MS = 5000;
const FOODPRONET_LABEL_TIMEOUT_MS = 2500;
// Limit successive label batches as well as individual requests. Keep the retrieved
// food when enrichment is slow; the existing UI marks missing nutrition honestly.
const FOODPRONET_ENRICHMENT_BUDGET_MS = 6000;

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
    hallName: "The Atrium"
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

type AtriumLabelDetails = {
  nutrition: Nutrition;
  servingSize?: string;
  ingredients?: string[];
  description?: string;
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
const menuCache = new BoundedPromiseCache<DailyMenu | null>(16, 16 * 1024 * 1024);
const atriumPageCache = new BoundedPromiseCache<string>(12, 8 * 1024 * 1024);
const atriumLabelCache = new BoundedPromiseCache<string>(128, 8 * 1024 * 1024);

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

function stripHtml(value: string) {
  return normalizeWhitespace(
    value
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/p>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
  );
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


function normalizeServingSize(entry: RutgersMenuEntry, food: RutgersFood) {
  const amount = normalizeWhitespace(
    String(food.serving_size_info?.serving_size_amount ?? entry.serving_size_amount ?? "")
  );
  const unit = normalizeWhitespace(food.serving_size_info?.serving_size_unit ?? entry.serving_size_unit ?? "");
  const combined = `${amount} ${unit}`.trim();

  return combined || undefined;
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

async function fetchText(url: string): Promise<string> {
  return fetchWithTimeout(
    url,
    {
      headers: {
        accept: "text/html,application/xhtml+xml"
      }
    },
    FOODPRONET_MENU_TIMEOUT_MS,
    readResponseText
  );
}

function readResponseText(response: Response, signal?: AbortSignal) {
  return readBoundedText(response, MENU_RESPONSE_BYTES, signal);
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

function formatAtriumDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${Number.parseInt(month, 10)}/${Number.parseInt(day, 10)}/${year}`;
}

function buildAtriumMenuUrl(date: string, mealType: MealType) {
  const activeMeal = toMealLabel(mealType);
  const params = new URLSearchParams({
    locationNum: String(ATRIUM_LOCATION_NUM),
    dtdate: formatAtriumDate(date),
    activeMeal,
    sName: ""
  });

  return `${FOODPRONET_BASE}/pickmenu.aspx?${params.toString()}`;
}

function getCachedText(cache: BoundedPromiseCache<string>, key: string, loader: () => Promise<string>) {
  return cache.load(key, loader, () => CACHE_TTL_MS);
}

async function fetchAtriumMenuPage(date: string, mealType: MealType) {
  const key = `${date}:${mealType}`;
  return getCachedText(atriumPageCache, key, () => fetchText(buildAtriumMenuUrl(date, mealType)));
}

async function fetchAtriumLabelPage(href: string, date: string) {
  const url = foodProNetLabelUrl(href, date);
  return getCachedText(atriumLabelCache, url, () =>
    fetchWithTimeout(
      url,
      {
        headers: {
          accept: "text/html,application/xhtml+xml"
        }
      },
      FOODPRONET_LABEL_TIMEOUT_MS,
      (response, signal) => readBoundedText(response, LABEL_RESPONSE_BYTES, signal)
    )
  );
}

function extractNutritionMetric(labelHtml: string, label: string) {
  // The observed label places &nbsp; on either side of </b>; sugars may be unbolded.
  const plain = labelHtml.replace(/&nbsp;/gi, " ");
  const regex = new RegExp(`(?:<b>\\s*${label}\\s*</b>|${label})\\s*([^<]+)`, "i");
  const match = plain.match(regex);
  return match ? stripHtml(match[1]) : undefined;
}

function parseAtriumLabelNutrition(
  html: string,
  mealType: MealType,
  itemName: string,
  diagnostics: NormalizationDiagnostics
): AtriumLabelDetails {
  // TODO: Atrium nutrition labels currently expose a stable nutrition-facts table, but some
  // items may eventually move fields or omit the ingredients block. Keep this parser tolerant.
  const servingSizeMatch = html.match(/<p>\s*Serving Size\s+([\s\S]*?)<\/p>/i);
  const caloriesMatch = html.match(/<p class="strong">Calories&nbsp;([^<]+)<\/p>/i);
  const ingredientsMatch = html.match(/<p><b>INGREDIENTS:&nbsp;&nbsp;<\/b>([\s\S]*?)<\/p>/i);

  const nutrition: Nutrition = {
    calories: normalizeNutritionValue("calories", caloriesMatch?.[1], diagnostics, mealType, itemName),
    protein: normalizeNutritionValue("protein", extractNutritionMetric(html, "Protein"), diagnostics, mealType, itemName),
    carbs: normalizeNutritionValue("carbs", extractNutritionMetric(html, "Tot\\. Carb\\."), diagnostics, mealType, itemName),
    fat: normalizeNutritionValue("fat", extractNutritionMetric(html, "Total Fat"), diagnostics, mealType, itemName),
    sodium: normalizeNutritionValue("sodium", extractNutritionMetric(html, "Sodium"), diagnostics, mealType, itemName),
    sugar: normalizeNutritionValue("sugar", extractNutritionMetric(html, "Sugars"), diagnostics, mealType, itemName)
  };

  return {
    nutrition,
    servingSize: servingSizeMatch ? stripHtml(servingSizeMatch[1]) : undefined,
    ingredients: ingredientsMatch ? normalizeStringList(stripHtml(ingredientsMatch[1])) : undefined,
    description: !hasMeaningfulNutrition(nutrition) ? "Nutrition may be incomplete" : undefined
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function getSchools() {
  const now = Date.now();
  if (schoolCache && schoolCache.expiresAt > now) {
    return schoolCache.schools;
  }

  const schools = await fetchJson<RutgersSchool[]>(`${NUTRISLICE_API_BASE}/schools/`);
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
      attempt.schoolResolution = fromCache ? "cached" : "discovered";
      return matchedSchool;
    }
  } catch (error) {
    if (!discoveryIssue) addError(attempt, error, "schools", "parse_error");
    discoveryIssue = true;
    logDevError(`Falling back to static school mapping for ${hallId}.`, error);
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

type AtriumParsedItem = {
  name: string;
  servingSize?: string;
  stationName: string;
  stationId: string;
  labelUrl?: string;
  allergens?: string[];
  sourceLabels?: string[];
  tags?: string[];
};

function parseAtriumMenuItems(
  html: string,
  mealType: MealType,
  diagnostics: NormalizationDiagnostics
): AtriumParsedItem[] {
  // TODO: FoodProNet is an HTML-only source, so this parser intentionally leans on repeated
  // content patterns instead of brittle absolute DOM positions. Re-verify these selectors if
  // Rutgers changes the menu row or station-header markup.
  const menuBoxMatch = html.match(/<div class="menuBox">([\s\S]*?)<\/form>/i);
  const menuHtml = menuBoxMatch?.[1] ?? html;
  const tokenRegex = /<h3>([\s\S]*?)<\/h3>|<fieldset>([\s\S]*?)<\/fieldset>/gi;
  const parsedItems: AtriumParsedItem[] = [];

  let currentStationName = FALLBACK_STATION_LABEL;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(menuHtml)) !== null) {
    if (match[1]) {
      const rawStationName = stripHtml(match[1]).replace(/^[-–—\s]+|[-–—\s]+$/g, "");
      currentStationName = sanitizeStationName(rawStationName, diagnostics);
      continue;
    }

    const fieldsetHtml = match[2];
    if (!fieldsetHtml) {
      continue;
    }

    const nameMatch =
      fieldsetHtml.match(/<label[^>]*style="font-weight:200"[^>]*>([\s\S]*?)<\/label>/i) ??
      fieldsetHtml.match(/<label[^>]*aria-label="[^"]*"[^>]*>([\s\S]*?)<\/label>/i);
    const servingMatch = fieldsetHtml.match(/<div class="col-2"[\s\S]*?<label[^>]*>([\s\S]*?)<\/label>/i);
    const labelHrefMatch = fieldsetHtml.match(/<a href=['"]([^'"]*label\.aspx[^'"]*)['"]/i);
    const iconAltMatches = Array.from(fieldsetHtml.matchAll(/<img[^>]+(?:alt|title)="([^"]+)"/gi)).map((entry) =>
      normalizeWhitespace(entry[1]).toLowerCase()
    );

    const itemName = sanitizeItemName(nameMatch ? stripHtml(nameMatch[1]) : null);

    if (!itemName) {
      diagnostics.blankItemNames += 1;
      diagnostics.droppedItems.push({
        mealType,
        reason: "blank-name",
        rawName: nameMatch?.[1] ?? null,
        stationName: currentStationName
      });
      continue;
    }

    if (parsedItems.length >= MAX_MEAL_ITEMS) throw new IngestionFailure("resource_limit");
    parsedItems.push({
      name: itemName,
      servingSize: servingMatch ? stripHtml(servingMatch[1]) : undefined,
      stationName: currentStationName,
      stationId: slugify(currentStationName),
      labelUrl: labelHrefMatch ? labelHrefMatch[1].replace(/&amp;/g, "&") : undefined,
      ...classifyDietaryLabels(iconAltMatches)
    });
  }

  if (parsedItems.length === 0) {
    diagnostics.parserWarnings.push({
      mealType,
      message: "Atrium menu page parsed without any items."
    });
  }

  return parsedItems;
}

async function fetchAtriumMealSection(
  date: string,
  mealType: MealType,
  diagnostics: NormalizationDiagnostics,
  detail: MealAttempt
): Promise<MealSection | null> {
  let html: string;

  try {
    html = await fetchAtriumMenuPage(date, mealType);
  } catch (error) {
    detail.outcome = "failed";
    addError(detail, error, "menu", "request_error");
    diagnostics.emptyMeals.push(mealType);
    logDevError(`Failed to fetch Atrium ${mealType} menu page.`, error);
    return null;
  }

  try {
    const context = validateAtriumMenuContext(html, date, mealType);
    if ("reason" in context) {
      detail.outcome = "rejected";
      addFailure(detail, "context_rejected", "menu", null, context.reason);
      diagnostics.emptyMeals.push(mealType);
      diagnostics.parserWarnings.push({ mealType, message: `Atrium menu context rejected: ${context.reason}.` });
      return null;
    }

    detail.normalizationStarted = true;
    const parsedItems = parseAtriumMenuItems(context.menuHtml, mealType, diagnostics);

    if (parsedItems.length === 0) {
      detail.normalizationCompleted = true;
      detail.outcome = "empty";
      detail.parsed = { stations: 0, items: 0 };
      addFailure(detail, "no_items", "normalization");
      diagnostics.emptyMeals.push(mealType);
      return null;
    }

    const enrichmentDeadline = Date.now() + FOODPRONET_ENRICHMENT_BUDGET_MS;
    const normalizedItems = await mapWithConcurrency(parsedItems, 6, async (parsedItem) => {
      let labelDetails: AtriumLabelDetails | null = null;

      if (parsedItem.labelUrl && Date.now() >= enrichmentDeadline) {
        detail.enrichment.skippedItems += 1;
      } else if (parsedItem.labelUrl) {
        detail.enrichment.attemptedItems += 1;
        let parsingLabel = false;
        try {
          const labelHtml = await fetchAtriumLabelPage(parsedItem.labelUrl, date);
          parsingLabel = true;
          assertLabelIdentity(labelHtml, parsedItem.labelUrl, date);
          labelDetails = parseAtriumLabelNutrition(labelHtml, mealType, parsedItem.name, diagnostics);
        } catch (error) {
          detail.enrichment.failedItems += 1;
          addError(detail.enrichment, error, "nutrition_label", parsingLabel ? "parse_error" : "request_error");
          diagnostics.parserWarnings.push({
            mealType,
            message: `Could not load Atrium nutrition label for ${parsedItem.name}.`
          });
          // The bounded development diagnostics and ingestion summary aggregate
          // these failures; logging every label can flood the dev server console.
        }
      }

      const stationName = sanitizeStationName(parsedItem.stationName, diagnostics);
      const itemLooksCustom =
        isCustomizableName(parsedItem.name) ||
        isCustomizableName(stationName) ||
        /\b(toppings|bases|sides)\b/i.test(stationName);
      const nutrition = labelDetails?.nutrition ?? unknownNutrition();
      const shouldDeemphasizeNutrition = itemLooksCustom && !hasMeaningfulNutrition(nutrition);

      return {
        id: `atrium-${mealType}-${parsedItem.stationId}-${slugify(parsedItem.name)}`,
        name: parsedItem.name,
        stationId: parsedItem.stationId,
        stationName,
        hallId: "atrium" as const,
        mealType,
        menuDate: date,
        servingSize: labelDetails?.servingSize ?? parsedItem.servingSize,
        nutrition: shouldDeemphasizeNutrition
          ? unknownNutrition()
          : nutrition,
        description: shouldDeemphasizeNutrition ? "Nutrition varies based on your selections" : labelDetails?.description,
        ingredients: labelDetails?.ingredients,
        tags: itemLooksCustom
          ? Array.from(new Set([...(parsedItem.tags ?? []), "custom", "build-your-own"]))
          : parsedItem.tags,
        allergens: parsedItem.allergens,
        sourceLabels: parsedItem.sourceLabels,
        imageUrl: null,
        isCustom: shouldDeemphasizeNutrition || undefined,
        available: true
      } satisfies MenuItem;
    });

    const stationMap = new Map<string, Station>();
    const stationOrder: string[] = [];
    const dedupeKeys = new Set<string>();

    for (const item of normalizedItems) {
      diagnostics.totalItems += 1;
      if (hasMeaningfulNutrition(item.nutrition)) {
        diagnostics.itemsWithNutrition += 1;
      } else {
        diagnostics.itemsWithoutNutrition += 1;
      }

      if (hasMeaningfulNutrition(item.nutrition) || item.isCustom) {
        diagnostics.usableItems += 1;
      }

      const dedupeKey = getDedupeKey(item);
      if (dedupeKeys.has(dedupeKey)) {
        diagnostics.dedupedItems.push({ mealType, name: item.name, stationName: item.stationName });
        continue;
      }
      dedupeKeys.add(dedupeKey);


      if (!stationMap.has(item.stationId)) {
        stationMap.set(item.stationId, {
          id: item.stationId,
          name: item.stationName,
          items: []
        });
        stationOrder.push(item.stationId);
      }

      stationMap.get(item.stationId)!.items.push(item);
    }

    assignUniqueItemIds(Array.from(stationMap.values()).flatMap((station) => station.items));
    const stations = stationOrder
      .map((stationId) => stationMap.get(stationId))
      .filter((station): station is Station => Boolean(station))
      .filter((station) => station.items.length > 0);

    detail.normalizationCompleted = true;
    if (stations.length === 0) {
      detail.outcome = "empty";
      detail.parsed = { stations: 0, items: 0 };
      addFailure(detail, "no_items", "normalization");
      diagnostics.emptyMeals.push(mealType);
      return null;
    }

    return {
      id: `atrium-${mealType}`,
      type: mealType,
      label: toMealLabel(mealType),
      stations
    };
  } catch (error) {
    addError(detail, error, detail.normalizationStarted ? "normalization" : "menu",
      detail.normalizationStarted ? "parse_error" : "internal_error");
    throw error;
  }
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
    const nutrition = normalizeNutrition(food.rounded_nutrition_info, diagnostics, mealType, itemName);
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
      servingSize: normalizeServingSize(entry, food),
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
  const [year, month, day] = date.split("-");
  const url = `${NUTRISLICE_API_BASE}/weeks/school/${school.id}/menu-type/${menuTypeId}/${year}/${month}/${day}/`;

  let shapeIssue = false;
  let readingPayload = true;
  try {
    const payload = await fetchJson<RutgersWeekResponse>(url, WEEK_RESPONSE_BYTES, WEEK_JSON_NODES);
    readingPayload = false;
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
      detail.outcome = "empty";
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

async function loadDailyMenu(
  hallId: DiningHallId, date: string, diagnostics: NormalizationDiagnostics, attempt: IngestionAttempt
): Promise<DailyMenu | null> {
  if (hallId === "atrium") {
    const mealSections = (
      await Promise.all([
        trackMeal(attempt, "breakfast", () => fetchAtriumMealSection(date, "breakfast", diagnostics, attempt.meals.breakfast)),
        trackMeal(attempt, "lunch", () => fetchAtriumMealSection(date, "lunch", diagnostics, attempt.meals.lunch)),
        trackMeal(attempt, "dinner", () => fetchAtriumMealSection(date, "dinner", diagnostics, attempt.meals.dinner))
      ])
    ).filter((meal): meal is MealSection => Boolean(meal));

    logNormalizationDiagnostics(diagnostics);

    if (!isMeaningfullyUsableMenu(mealSections, diagnostics)) {
      if (mealSections.length > 0) addFailure(attempt, "unusable_menu", "normalization");
      debugLog(`Atrium live menu for ${date} was not usable after parsing; returning unavailable.`, {
        mealCount: mealSections.length,
        usableItems: diagnostics.usableItems,
        totalItems: diagnostics.totalItems
      });
      return null;
    }

    return {
      date,
      hallId,
      hallName: HALL_CONFIG.atrium.hallName,
      meals: mealSections,
      isLiveData: true,
      lastUpdatedAt: new Date().toISOString()
    };
  }

  const hallConfig = HALL_CONFIG[hallId];
  const school = await resolveSchool(hallId, attempt);

  if (!school) {
    debugLog(`No live school mapping available for ${hallId}; returning unavailable.`);
    return null;
  }

  const mealSections = (
    await Promise.all([
      trackMeal(attempt, "breakfast", () => fetchMealSection(hallId, date, school, "breakfast", diagnostics, attempt.meals.breakfast)),
      trackMeal(attempt, "lunch", () => fetchMealSection(hallId, date, school, "lunch", diagnostics, attempt.meals.lunch)),
      trackMeal(attempt, "dinner", () => fetchMealSection(hallId, date, school, "dinner", diagnostics, attempt.meals.dinner))
    ])
  ).filter((meal): meal is MealSection => Boolean(meal));

  logNormalizationDiagnostics(diagnostics);

  if (!isMeaningfullyUsableMenu(mealSections, diagnostics)) {
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
    isLiveData: true,
    lastUpdatedAt: new Date().toISOString()
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
    finishIngestionAttempt(attempt, menu, failed, () => ({
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
      parserWarnings: diagnostics.parserWarnings.length - Object.values(attempt.meals).reduce((sum, meal) => sum + meal.enrichment.failedItems, 0)
    }));
  }
}

export const rutgersMenuProvider: MenuProvider = {
  async getDailyMenu(hallId, date) {
    return menuCache.load(`${hallId}:${date}`, () => loadDailyMenuWithSummary(hallId, date),
      menu => menu ? CACHE_TTL_MS : FAILED_CACHE_TTL_MS).catch((error) => {
        logDevError(`Live Rutgers provider failed for ${hallId} on ${date}.`, error);
        return null;
      });
  }
};

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

// TODO: Nutrislice and FoodProNet request budgets are intentionally short so the app can
// return unavailable quickly instead of hanging. Revisit timeout values if Rutgers publishes a more
// reliable, lower-latency source or if deploy telemetry shows systematic false timeouts.

// TODO: Atrium does not currently appear in Rutgers' public Nutrislice school index.
// If Rutgers publishes a stable source for Atrium later, add a dedicated resolver here
// instead of pushing that source-specific logic into UI components.
// TODO: Nutrislice's API is stable enough for a first pass, but icon metadata and custom
// station detection should still be re-verified against more real menu examples before
// relying on them for user-facing allergen or nutrition claims.

import { MenuProvider } from "@/lib/providers/menu-provider";
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

const ALLERGEN_PATTERN =
  /\b(milk|dairy|egg|soy|wheat|gluten|peanut|tree nut|nuts|sesame|shellfish|fish)\b/i;

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

type CacheEntry = {
  expiresAt: number;
  promise: Promise<DailyMenu | null>;
};

type TextCacheEntry = {
  expiresAt: number;
  promise: Promise<string>;
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
const menuCache = new Map<string, CacheEntry>();
const atriumPageCache = new Map<string, TextCacheEntry>();
const atriumLabelCache = new Map<string, TextCacheEntry>();

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

function logNormalizationDiagnostics(hallId: DiningHallId, date: string, diagnostics: NormalizationDiagnostics) {
  if (!isDevelopment()) {
    return;
  }

  const summary = {
    hallId,
    date,
    blankStationHeaders: diagnostics.blankStationHeaders,
    blankItemNames: diagnostics.blankItemNames,
    droppedItems: diagnostics.droppedItems.length,
    dedupedItems: diagnostics.dedupedItems.length,
    invalidNutritionFields: diagnostics.invalidNutritionFields.length,
    emptyMeals: diagnostics.emptyMeals,
    fallbackStationLabels: diagnostics.fallbackStationLabels,
    totalItems: diagnostics.totalItems,
    usableItems: diagnostics.usableItems,
    itemsWithNutrition: diagnostics.itemsWithNutrition,
    itemsWithoutNutrition: diagnostics.itemsWithoutNutrition,
    parserWarnings: diagnostics.parserWarnings.length
  };

  console.info("[rutgers-provider] Normalization summary", summary);

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
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
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

    return 0;
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

function hasMeaningfulNutrition(nutrition: Nutrition) {
  return (
    nutrition.calories > 0 ||
    nutrition.protein > 0 ||
    nutrition.carbs > 0 ||
    nutrition.fat > 0 ||
    (nutrition.sodium ?? 0) > 0 ||
    (nutrition.sugar ?? 0) > 0
  );
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

function normalizeTags(food: RutgersFood) {
  const iconLabels = (food.icons?.food_icons ?? [])
    .map((icon) => getIconLabel(icon))
    .filter((label): label is string => Boolean(label));

  const tags = iconLabels
    .filter((label) => !ALLERGEN_PATTERN.test(label))
    .map((label) => label.toLowerCase())
    .filter(Boolean);

  return tags.length > 0 ? Array.from(new Set(tags)) : undefined;
}

function normalizeAllergens(food: RutgersFood) {
  const iconLabels = (food.icons?.food_icons ?? [])
    .map((icon) => getIconLabel(icon))
    .filter((label): label is string => Boolean(label));

  const allergens = iconLabels
    .filter((label) => ALLERGEN_PATTERN.test(label))
    .map((label) => label.toLowerCase())
    .filter(Boolean);

  return allergens.length > 0 ? Array.from(new Set(allergens)) : undefined;
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
    item.nutrition.calories,
    item.nutrition.protein,
    item.nutrition.carbs,
    item.nutrition.fat,
    item.nutrition.sodium ?? 0,
    item.nutrition.sugar ?? 0
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

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetchWithTimeout(url, {
    headers: {
      accept: "application/json"
    }
  }, NUTRISLICE_TIMEOUT_MS);

  return (await response.json()) as T;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        accept: "text/html,application/xhtml+xml"
      }
    },
    FOODPRONET_MENU_TIMEOUT_MS
  );

  return await response.text();
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status} for ${url}`);
    }

    return response;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Request timed out after ${timeoutMs}ms for ${url}`);
    }

    throw error;
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

function buildAtriumLabelUrl(href: string) {
  return href.startsWith("http") ? href : `${FOODPRONET_BASE}/${href.replace(/^\//, "")}`;
}

function getCachedText(cache: Map<string, TextCacheEntry>, key: string, loader: () => Promise<string>) {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.promise;
  }

  const promise = loader().catch((error) => {
    cache.delete(key);
    throw error;
  });

  cache.set(key, {
    expiresAt: now + CACHE_TTL_MS,
    promise
  });

  return promise;
}

async function fetchAtriumMenuPage(date: string, mealType: MealType) {
  const key = `${date}:${mealType}`;
  return getCachedText(atriumPageCache, key, () => fetchText(buildAtriumMenuUrl(date, mealType)));
}

async function fetchAtriumLabelPage(url: string) {
  return getCachedText(atriumLabelCache, url, async () => {
    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          accept: "text/html,application/xhtml+xml"
        }
      },
      FOODPRONET_LABEL_TIMEOUT_MS
    );

    return await response.text();
  });
}

function extractNutritionMetric(labelHtml: string, label: string) {
  const regex = new RegExp(`<b>${label}[\\s\\S]*?<\\/b>&nbsp;([^<]+)`, "i");
  const match = labelHtml.match(regex);
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

async function resolveSchool(hallId: DiningHallId) {
  const config = HALL_CONFIG[hallId];

  if (!config.schoolSlug && !config.fallbackSchoolId) {
    return null;
  }

  try {
    const schools = await getSchools();
    const matchedSchool =
      schools.find((school) => school.slug === config.schoolSlug) ??
      schools.find((school) => school.id === config.fallbackSchoolId) ??
      schools.find((school) => school.name?.toLowerCase() === config.hallName.toLowerCase());

    if (matchedSchool) {
      return matchedSchool;
    }
  } catch (error) {
    logDevError(`Falling back to static school mapping for ${hallId}.`, error);
  }

  if (!config.fallbackSchoolId) {
    return null;
  }

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
    nutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      sodium: 0,
      sugar: 0
    },
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

    parsedItems.push({
      name: itemName,
      servingSize: servingMatch ? stripHtml(servingMatch[1]) : undefined,
      stationName: currentStationName,
      stationId: slugify(currentStationName),
      labelUrl: labelHrefMatch ? buildAtriumLabelUrl(labelHrefMatch[1].replace(/&amp;/g, "&")) : undefined,
      tags: iconAltMatches.length > 0 ? Array.from(new Set(iconAltMatches)) : undefined
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
  diagnostics: NormalizationDiagnostics
): Promise<MealSection | null> {
  let html: string;

  try {
    html = await fetchAtriumMenuPage(date, mealType);
  } catch (error) {
    diagnostics.emptyMeals.push(mealType);
    logDevError(`Failed to fetch Atrium ${mealType} menu page.`, error);
    return null;
  }

  const parsedItems = parseAtriumMenuItems(html, mealType, diagnostics);

  if (parsedItems.length === 0) {
    diagnostics.emptyMeals.push(mealType);
    return null;
  }

  const normalizedItems = await mapWithConcurrency(parsedItems, 6, async (parsedItem) => {
    let labelDetails: AtriumLabelDetails | null = null;

    if (parsedItem.labelUrl) {
      try {
        const labelHtml = await fetchAtriumLabelPage(parsedItem.labelUrl);
        labelDetails = parseAtriumLabelNutrition(labelHtml, mealType, parsedItem.name, diagnostics);
      } catch (error) {
        diagnostics.parserWarnings.push({
          mealType,
          message: `Could not load Atrium nutrition label for ${parsedItem.name}.`
        });
        logDevError(`Failed to fetch Atrium label for ${parsedItem.name}.`, error);
      }
    }

    const stationName = sanitizeStationName(parsedItem.stationName, diagnostics);
    const itemLooksCustom =
      isCustomizableName(parsedItem.name) ||
      isCustomizableName(stationName) ||
      /\b(toppings|bases|sides)\b/i.test(stationName);
    const nutrition = labelDetails?.nutrition ?? {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      sodium: 0,
      sugar: 0
    };
    const shouldDeemphasizeNutrition = itemLooksCustom && !hasMeaningfulNutrition(nutrition);

    return {
      id: `atrium-${mealType}-${parsedItem.stationId}-${slugify(parsedItem.name)}`,
      name: parsedItem.name,
      stationId: parsedItem.stationId,
      stationName,
      hallId: "atrium" as const,
      mealType,
      servingSize: labelDetails?.servingSize ?? parsedItem.servingSize,
      nutrition: shouldDeemphasizeNutrition
        ? {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            sodium: 0,
            sugar: 0
          }
        : nutrition,
      description: shouldDeemphasizeNutrition ? "Nutrition varies based on your selections" : labelDetails?.description,
      ingredients: labelDetails?.ingredients,
      tags: itemLooksCustom
        ? Array.from(new Set([...(parsedItem.tags ?? []), "custom", "build-your-own"]))
        : parsedItem.tags,
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

  const stations = stationOrder
    .map((stationId) => stationMap.get(stationId))
    .filter((station): station is Station => Boolean(station))
    .filter((station) => station.items.length > 0);

  if (stations.length === 0) {
    diagnostics.emptyMeals.push(mealType);
    return null;
  }

  return {
    id: `atrium-${mealType}`,
    type: mealType,
    label: toMealLabel(mealType),
    stations
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

  for (const entry of day.menu_items ?? []) {
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

    const tags = new Set(normalizeTags(food) ?? []);
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
        ? {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            sodium: 0,
            sugar: 0
          }
        : nutrition,
      description: shouldDeemphasizeNutrition
        ? "Nutrition varies based on your selections"
        : normalizeWhitespace(food.description) || undefined,
      ingredients: normalizeStringList(food.synced_ingredients ?? food.ingredients),
      allergens: normalizeAllergens(food),
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
  diagnostics: NormalizationDiagnostics
) {
  if (!school.id) {
    return null;
  }

  const menuTypeId = resolveMenuTypeId(school, mealType);
  const [year, month, day] = date.split("-");
  const url = `${NUTRISLICE_API_BASE}/weeks/school/${school.id}/menu-type/${menuTypeId}/${year}/${month}/${day}/`;

  try {
    const payload = await fetchJson<RutgersWeekResponse>(url);
    const requestedDay = payload.days?.find((menuDay) => menuDay.date === date);

    if (!requestedDay) {
      diagnostics.emptyMeals.push(mealType);
      debugLog(`No ${mealType} day matched ${date} for ${hallId}.`, { url });
      return null;
    }

    return normalizeMealSection(hallId, mealType, requestedDay, diagnostics);
  } catch (error) {
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

  // Conservative fallback: treat live data as unusable only when normalization leaves almost
  // nothing to show. A single well-formed meal or a couple of trustworthy/custom items still render.
  return trustworthyItemCount >= MIN_MEANINGFUL_ITEM_COUNT || meals.length >= 2;
}

async function loadDailyMenu(hallId: DiningHallId, date: string): Promise<DailyMenu | null> {
  if (hallId === "atrium") {
    const diagnostics = createDiagnostics();
    const mealSections = (
      await Promise.all([
        fetchAtriumMealSection(date, "breakfast", diagnostics),
        fetchAtriumMealSection(date, "lunch", diagnostics),
        fetchAtriumMealSection(date, "dinner", diagnostics)
      ])
    ).filter((meal): meal is MealSection => Boolean(meal));

    logNormalizationDiagnostics(hallId, date, diagnostics);

    if (!isMeaningfullyUsableMenu(mealSections, diagnostics)) {
      debugLog(`Atrium live menu for ${date} was not usable after parsing; falling back to mock data.`, {
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
  const school = await resolveSchool(hallId);

  if (!school) {
    debugLog(`No live school mapping available for ${hallId}; returning null so mock fallback can take over.`);
    return null;
  }

  const diagnostics = createDiagnostics();
  const mealSections = (
    await Promise.all([
      fetchMealSection(hallId, date, school, "breakfast", diagnostics),
      fetchMealSection(hallId, date, school, "lunch", diagnostics),
      fetchMealSection(hallId, date, school, "dinner", diagnostics)
    ])
  ).filter((meal): meal is MealSection => Boolean(meal));

  logNormalizationDiagnostics(hallId, date, diagnostics);

  if (!isMeaningfullyUsableMenu(mealSections, diagnostics)) {
    debugLog(`Live menu for ${hallId} on ${date} was not usable after normalization; falling back to mock data.`, {
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

export const rutgersMenuProvider: MenuProvider = {
  async getDailyMenu(hallId, date) {
    const cacheKey = `${hallId}:${date}`;
    const cached = menuCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.promise;
    }

    const cacheEntry: CacheEntry = {
      expiresAt: now + CACHE_TTL_MS,
      promise: Promise.resolve(null)
    };

    const promise = loadDailyMenu(hallId, date)
      .then((menu) => {
        cacheEntry.expiresAt = Date.now() + (menu ? CACHE_TTL_MS : FAILED_CACHE_TTL_MS);
        return menu;
      })
      .catch((error) => {
        logDevError(`Live Rutgers provider failed for ${hallId} on ${date}.`, error);
        menuCache.delete(cacheKey);
        return null;
      });

    cacheEntry.promise = promise;
    menuCache.set(cacheKey, cacheEntry);

    return promise;
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
// fall back quickly instead of hanging. Revisit timeout values if Rutgers publishes a more
// reliable, lower-latency source or if deploy telemetry shows systematic false timeouts.

// TODO: Atrium does not currently appear in Rutgers' public Nutrislice school index.
// If Rutgers publishes a stable source for Atrium later, add a dedicated resolver here
// instead of pushing that source-specific logic into UI components.
// TODO: Nutrislice's API is stable enough for a first pass, but icon metadata and custom
// station detection should still be re-verified against more real menu examples before
// relying on them for user-facing allergen or nutrition claims.

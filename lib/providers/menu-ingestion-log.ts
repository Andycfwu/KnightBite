import { DailyMenu, DiningHallId, MealSection, MealType } from "@/lib/types";

export type FailureCategory = "timeout" | "http_error" | "request_error" | "malformed_json" |
  "unexpected_shape" | "parse_error" | "requested_date_missing" | "context_rejected" |
  "no_items" | "unusable_menu" | "school_mapping_missing" | "internal_error" |
  "destination_rejected" | "response_too_large" | "resource_limit";
export type Endpoint = "schools" | "menu" | "nutrition_label" | "normalization" | "ingestion";
type Failure = { category: FailureCategory; endpoint: Endpoint; statusCode: number | null; reason: string | null };
type Failures = { failures: Array<Failure & { count: number }>; omittedFailureCount: number };

export class IngestionFailure extends Error {
  constructor(readonly category: FailureCategory, readonly statusCode: number | null = null) {
    // Never carry upstream messages, URLs, bodies, headers, or causes into production summaries.
    super(category);
  }
}

const MEALS: MealType[] = ["breakfast", "lunch", "dinner"];
const MAX_FAILURE_GROUPS = 16;
const emptyFailures = (): Failures => ({ failures: [], omittedFailureCount: 0 });

export type MealAttempt = Failures & {
  cacheHit?: boolean;
  outcome: "not_started" | "pending" | "parsed" | "empty" | "rejected" | "failed";
  parsed: { stations: number; items: number } | null;
  normalizationStarted: boolean;
  normalizationCompleted: boolean;
  // Retained zero-valued fields for compatibility with existing log consumers.
  // Nutrislice supplies nutrition inline; no label enrichment requests are made.
  enrichment: Failures & { attemptedItems: number; failedItems: number; skippedItems: number };
};

export type IngestionAttempt = Failures & {
  hallId: DiningHallId;
  requestedMeal?: MealType;
  requestedDate: string;
  startedAtMs: number;
  schoolResolution: "not_started" | "discovered" | "cached" | "static_fallback" | "unavailable";
  meals: Record<MealType, MealAttempt>;
};

export function createIngestionAttempt(hallId: DiningHallId, requestedDate: string): IngestionAttempt {
  return {
    ...emptyFailures(), hallId, requestedDate, startedAtMs: Date.now(),
    schoolResolution: "not_started",
    meals: Object.fromEntries(MEALS.map((meal) => [meal, {
      ...emptyFailures(), outcome: "not_started", parsed: null,
      normalizationStarted: false, normalizationCompleted: false,
      enrichment: { ...emptyFailures(), attemptedItems: 0, failedItems: 0, skippedItems: 0 }
    }])) as Record<MealType, MealAttempt>
  };
}

export function addFailure(
  target: Failures,
  category: FailureCategory,
  endpoint: Endpoint,
  statusCode: number | null = null
) {
  const reason = null;
  const status = Number.isInteger(statusCode) && statusCode! >= 100 && statusCode! <= 599 ? statusCode : null;
  const previous = target.failures.find((entry) => entry.category === category && entry.endpoint === endpoint && entry.statusCode === status && entry.reason === reason);
  if (previous) previous.count += 1;
  else if (target.failures.length < MAX_FAILURE_GROUPS) target.failures.push({ category, endpoint, statusCode: status, reason, count: 1 });
  else target.omittedFailureCount += 1;
}

export function addError(target: Failures, error: unknown, endpoint: Endpoint, fallback: FailureCategory = "internal_error") {
  addFailure(target, error instanceof IngestionFailure ? error.category : fallback, endpoint,
    error instanceof IngestionFailure ? error.statusCode : null);
}

export function trackMeal(attempt: IngestionAttempt, meal: MealType, loader: () => Promise<MealSection | null>) {
  const detail = attempt.meals[meal];
  detail.outcome = "pending";
  // The daily loader's Promise.all handles rejections even after another meal fails.
  return loader().then((section) => {
    if (section) {
      detail.outcome = "parsed";
      detail.parsed = { stations: section.stations.length, items: section.stations.reduce((sum, station) => sum + station.items.length, 0) };
    }
    return section;
  }).catch((error) => {
    detail.outcome = "failed";
    if (detail.failures.length === 0) addError(detail, error, "ingestion");
    throw error;
  });
}

export type DiagnosticCounts = {
  processedItemsBeforeDedup: number;
  droppedItems: number;
  deduplicatedItems: number;
  itemsWithMeaningfulNutritionBeforeDedup: number;
  itemsWithoutMeaningfulNutritionBeforeDedup: number;
  meaningfulOrCustomItemsBeforeDedup: number;
  blankStationHeaders: number;
  blankItemNames: number;
  fallbackStationLabels: number;
  invalidNutritionFields: number;
  parserWarnings: number;
};

export function finishIngestionAttempt(
  attempt: IngestionAttempt,
  menu: DailyMenu | null,
  failed: boolean,
  readDiagnostics: () => DiagnosticCounts
) {
  // Snapshot at the daily loader's exit, even when sibling meals are still pending.
  // Serialize now so later sibling work cannot mutate or delay the emitted record.
  try {
    const details = MEALS.map((meal) => attempt.meals[meal]);
    const relevant = attempt.requestedMeal ? [attempt.meals[attempt.requestedMeal]] : details;
    const hasIssues = attempt.failures.length > 0 || relevant.some((meal) =>
      meal.outcome !== "parsed" || meal.failures.length > 0 || meal.enrichment.failedItems > 0 || meal.enrichment.skippedItems > 0);
    const outcome = failed ? "error" : !menu ? "unavailable" : hasIssues ? "partial" : "success";
    const counts = readDiagnostics();
    const { parserWarnings, ...normalization } = counts;
    const summary = {
      event: "knightbite.menu_ingestion",
      source: "nutrislice",
      scope: attempt.requestedMeal ? "meal_retry" : "daily",
      ...(attempt.requestedMeal ? { requestedMeal: attempt.requestedMeal } : {}),
      hallId: ["busch", "livingston", "neilson", "atrium"].includes(attempt.hallId) ? attempt.hallId : "unknown",
      requestedDate: /^\d{4}-\d{2}-\d{2}$/.test(attempt.requestedDate) ? attempt.requestedDate : null,
      startedAt: new Date(attempt.startedAtMs).toISOString(),
      durationMs: Math.max(0, Date.now() - attempt.startedAtMs),
      outcome,
      schoolResolution: attempt.schoolResolution,
      returned: {
        meals: menu?.meals.length ?? 0,
        stations: menu?.meals.reduce((sum, meal) => sum + meal.stations.length, 0) ?? 0,
        items: menu?.meals.reduce((sum, meal) => sum + meal.stations.reduce((n, station) => n + station.items.length, 0), 0) ?? 0
      },
      meals: Object.fromEntries(MEALS.map((meal) => {
        const { normalizationStarted, normalizationCompleted, ...detail } = attempt.meals[meal];
        return [meal, { ...detail, normalizationStarted, normalizationCompleted }];
      })),
      diagnostics: {
        normalization: details.some((meal) => meal.normalizationStarted) ? normalization : null,
        normalizationComplete: details.some((meal) => meal.normalizationStarted)
          ? details.every((meal) => !meal.normalizationStarted || meal.normalizationCompleted) : null,
        parserWarnings
      },
      failures: attempt.failures,
      omittedFailureCount: attempt.omittedFailureCount
    };
    const output = JSON.stringify(summary);
    if (outcome === "error") console.error(output);
    else if (outcome === "success") console.info(output);
    else console.warn(output);
  } catch {
    // Logging must never change a menu result or cause an unhandled rejection.
  }
}

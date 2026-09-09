import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { beforeEach, test, type TestContext } from "node:test";

import { getHallMenuForDate } from "@/lib/menu";
import { createIngestionAttempt, finishIngestionAttempt, type DiagnosticCounts, type IngestionAttempt, type MealAttempt } from "@/lib/providers/menu-ingestion-log";
import { rutgersMenuProvider } from "@/lib/providers/rutgers-provider";
import type { MealType } from "@/lib/types";

const date = "2026-09-08";
const meals: MealType[] = ["breakfast", "lunch", "dinner"];
const school = { id: 62286, name: "Busch Dining Hall", slug: "busch-dining-hall" };
const secret = "SECRET_CANARY cookie=session-token https://private.example/menu?credential=secret ".repeat(100);
const fixture = (name: string) => readFileSync(`tests/fixtures/foodpronet/${name}.html`, "utf8");
const lunch = fixture("observed-lunch");
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

type Summary = {
  event: string; source: string; hallId: string; requestedDate: string;
  startedAt: string; durationMs: number; outcome: string; schoolResolution: string;
  returned: { meals: number; stations: number; items: number };
  meals: Record<MealType, MealAttempt>;
  diagnostics: {
    normalization: Omit<DiagnosticCounts, "parserWarnings"> | null;
    normalizationComplete: boolean | null; parserWarnings: number;
  };
  failures: IngestionAttempt["failures"]; omittedFailureCount: number;
};

let logs: Array<{ level: string; summary: Summary; raw: string }>;
let testNumber = 0;
beforeEach((t) => {
  // Expire even the 12-hour school cache without adding production reset hooks or changing TTLs.
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: Date.UTC(2026, 8, 8, 12) + ++testNumber * 13 * 60 * 60 * 1000 });
  const previousEnvironment = process.env.NODE_ENV;
  Object.assign(process.env, { NODE_ENV: "production" });
  t.after(() => {
    if (previousEnvironment === undefined) delete process.env.NODE_ENV;
    else Object.assign(process.env, { NODE_ENV: previousEnvironment });
  });
  const network = t.mock.method(globalThis, "fetch", async () => { throw new Error("No live network allowed"); });
  t.after(() => assert.equal(network.mock.callCount(), 0, "Every request must use a local response stub"));
  logs = [];
  for (const level of ["info", "warn", "error", "log", "dir", "table"] as const) {
    t.mock.method(console, level, (...args: unknown[]) => {
      // Save before parsing/asserting outside the provider, which deliberately isolates logging errors.
      logs.push({ level, raw: JSON.stringify(args), summary: undefined! });
    });
  }
  t.after(() => {
    for (const log of logs) {
      const args = JSON.parse(log.raw);
      assert.equal(args.length, 1);
      assert.equal(typeof args[0], "string");
      assert.equal(JSON.parse(args[0]).event, "knightbite.menu_ingestion");
      assert.doesNotMatch(log.raw, /SECRET_CANARY|cookie=|credential=|https?:|<html|<form|<fieldset|rounded_nutrition_info|ingredient_canary|ATRIUM HOUSE SALAD DRESSING|BABY SPINACH/);
      assert.ok(log.raw.length < 30_000, "Production summary is bounded and contains no raw data");
    }
  });
});

function summary(level = "warn") {
  assert.equal(logs.length, 1, "One actual attempt must emit exactly one production log");
  assert.equal(logs[0].level, level);
  const record = JSON.parse(JSON.parse(logs[0].raw)[0]) as Summary;
  assert.equal(record.event, "knightbite.menu_ingestion");
  return record;
}

function food(id = 1, calories = 120) {
  return { food: { id, name: `Fixture entrée ${id}`, ingredients: ["ingredient_canary"],
    serving_size_info: { serving_size_amount: 4, serving_size_unit: "oz" },
    rounded_nutrition_info: { calories, g_protein: calories ? 10 : 0, g_carbs: 0, g_fat: 0, mg_sodium: 0, g_sugar: 0 }
  } };
}
function week(menuDate = date, items: unknown[] = [food(1), food(2)]) {
  return { days: [{ date: menuDate, menu_items: [{ is_station_header: true, text: "Fixture Station", station_id: "fixture" }, ...items] }] };
}
function pageForMeal(meal: MealType) {
  const label = meal[0].toUpperCase() + meal.slice(1);
  return lunch.replace(/(<div class="tab active" aria-label=")Lunch(">\s*)Lunch/, `$1${label}$2${label}`)
    .replace("mealName=Lunch", `mealName=${label}`);
}

type Reply = Response | Promise<Response>;
function stubNutrislice(t: TestContext, reply: (meal: MealType, init: RequestInit, url: URL) => Reply = () => Response.json(week()), schools: () => Reply = () => Response.json([school])) {
  const calls: string[] = [];
  const unexpected: string[] = [];
  t.mock.method(globalThis, "fetch", async (input, init) => {
    const url = new URL(String(input));
    calls.push(url.pathname);
    if (url.origin === "https://rutgers.api.nutrislice.com") {
      if (url.pathname === "/menu/api/schools/") return schools();
      const match = url.pathname.match(/^\/menu\/api\/weeks\/school\/62286\/menu-type\/(32934|33316|33318)\/\d{4}\/\d{2}\/\d{2}\/$/);
      if (match) return reply(({ "32934": "breakfast", "33316": "lunch", "33318": "dinner" } as const)[match[1] as "32934" | "33316" | "33318"], init!, url);
    }
    unexpected.push(url.href);
    throw new Error(secret);
  });
  t.after(() => assert.deepEqual(unexpected, []));
  return calls;
}
function stubFoodProNet(t: TestContext, reply: (meal: MealType, init: RequestInit) => Reply = (meal) => new Response(pageForMeal(meal)), label: (url: URL, init: RequestInit) => Reply = (url) => new Response(fixture(url.searchParams.get("RecNumAndPort") === "150157*1" ? "observed-dressing-label" : "observed-spinach-label"))) {
  const calls: string[] = [];
  const unexpected: string[] = [];
  t.mock.method(globalThis, "fetch", async (input, init) => {
    const url = new URL(String(input));
    calls.push(url.pathname);
    if (url.origin === "https://menuportal23.dining.rutgers.edu") {
      if (url.pathname === "/FoodPronet/pickmenu.aspx") return reply(url.searchParams.get("activeMeal")!.toLowerCase() as MealType, init!);
      if (url.pathname === "/FoodPronet/label.aspx") return label(url, init!);
    }
    unexpected.push(url.href);
    throw new Error(secret);
  });
  t.after(() => assert.deepEqual(unexpected, []));
  return calls;
}
function abortable(init: RequestInit) {
  return new Promise<Response>((_resolve, reject) => init.signal!.addEventListener("abort", () => reject(new Error(secret)), { once: true }));
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((r, fail) => { resolve = r; reject = fail; });
  return { promise, resolve, reject };
}

test("production success logs actual counts and preserves normalized Nutrislice results", async (t) => {
  stubNutrislice(t);
  const menu = await getHallMenuForDate("busch", date);
  assert.ok(menu);
  assert.deepEqual(menu, {
    hallId: "busch", hallName: school.name, date, isLiveData: true, lastUpdatedAt: new Date().toISOString(),
    meals: meals.map((meal) => ({ id: `busch-${meal}`, type: meal, label: meal[0].toUpperCase() + meal.slice(1),
      stations: [{ id: "fixture", name: "Fixture Station", items: [1, 2].map((id) => ({
        id: `busch-${meal}-fixture-${id}`, name: `Fixture entrée ${id}`, hallId: "busch", mealType: meal,
        stationId: "fixture", stationName: "Fixture Station", servingSize: "4 oz",
        nutrition: { calories: 120, protein: 10, carbs: 0, fat: 0, sodium: 0, sugar: 0 },
        ingredients: ["ingredient_canary"], allergens: undefined, tags: undefined, description: undefined,
        imageUrl: null, isCustom: undefined, available: true
      })) }]
    }))
  });
  const log = await summary("info");
  assert.equal(log.source, "nutrislice");
  assert.equal(log.hallId, "busch");
  assert.equal(log.requestedDate, date);
  assert.equal(log.startedAt, new Date().toISOString());
  assert.equal(log.durationMs, 0);
  assert.equal(log.outcome, "success");
  assert.equal(log.schoolResolution, "discovered");
  assert.deepEqual(log.returned, { meals: 3, stations: 3, items: 6 });
  assert.equal(log.diagnostics.normalization?.itemsWithMeaningfulNutritionBeforeDedup, 6);
  assert.equal(log.diagnostics.normalizationComplete, true);
  for (const meal of meals) {
    assert.equal(log.meals[meal].outcome, "parsed");
    assert.deepEqual(log.meals[meal].parsed, { stations: 1, items: 2 });
    assert.deepEqual(log.meals[meal].failures, []);
  }
});

for (const hall of ["busch", "atrium"] as const) {
  test(`${hall} distinguishes HTTP and request failures while retaining a surviving meal`, async (t) => {
    const reply = (meal: MealType) => {
      if (meal === "breakfast") return new Response(secret, { status: 503 });
      if (meal === "lunch") throw new Error(secret);
      return hall === "atrium" ? new Response(pageForMeal(meal)) : Response.json(week());
    };
    if (hall === "atrium") stubFoodProNet(t, reply);
    else stubNutrislice(t, reply);
    const menu = await getHallMenuForDate(hall, date);
    assert.ok(menu);
    assert.deepEqual(menu.meals.map((meal) => meal.type), ["dinner"]);
    const log = await summary();
    assert.equal(log.outcome, "partial");
    assert.deepEqual(log.returned, { meals: 1, stations: 1, items: 2 });
    assert.deepEqual(log.meals.breakfast.failures, [{ category: "http_error", endpoint: "menu", statusCode: 503, reason: null, count: 1 }]);
    assert.equal(log.meals.lunch.failures[0].category, "request_error");
    assert.equal(log.meals.breakfast.parsed, null);
    assert.equal(log.meals.lunch.outcome, "failed");
  });

  test(`${hall} logs upstream timeout only after its existing deadline, not after 1.1 seconds`, async (t) => {
    if (hall === "atrium") stubFoodProNet(t, (_meal, init) => abortable(init));
    else stubNutrislice(t, (_meal, init) => abortable(init));
    const pending = getHallMenuForDate(hall, date);
    await flush();
    t.mock.timers.tick(1100);
    await flush();
    assert.equal(logs.length, 0);
    const timeout = hall === "atrium" ? 5000 : 4500;
    t.mock.timers.tick(timeout - 1100);
    assert.equal(await pending, null);
    const log = await summary();
    assert.equal(log.outcome, "unavailable");
    assert.equal(log.durationMs, timeout);
    assert.equal(log.diagnostics.normalization, null);
    assert.equal(log.diagnostics.normalizationComplete, null);
    for (const meal of meals) {
      assert.equal(log.meals[meal].failures[0].category, "timeout");
      assert.equal(log.meals[meal].parsed, null);
    }
  });
}

for (const [name, reply, category, started] of [
  ["malformed JSON", () => new Response(`{${secret}`), "malformed_json", false],
  ["failed body read", () => Object.assign(new Response(), { json: async () => { throw new TypeError(secret); } }), "request_error", false],
  ["missing days shape", () => Response.json({ secret }), "unexpected_shape", false],
  ["non-array days shape", () => Response.json({ days: {} }), "unexpected_shape", false],
  ["null payload", () => Response.json(null), "unexpected_shape", false],
  ["malformed menu_items shape", () => Response.json({ days: [{ date, menu_items: {} }] }), "unexpected_shape", true],
  ["nested normalization exception", () => Response.json(week(date, [{ food: { ...food().food, icons: { food_icons: {} } } }])), "parse_error", true],
  ["missing requested date", () => Response.json(week("2026-09-09")), "requested_date_missing", false]
] as const) {
  test(`Nutrislice reports ${name} without raw content`, async (t) => {
    stubNutrislice(t, reply);
    assert.equal(await getHallMenuForDate("busch", date), null);
    const log = await summary();
    assert.equal(log.outcome, "unavailable");
    for (const meal of meals) {
      assert.equal(log.meals[meal].outcome, "failed");
      assert.equal(log.meals[meal].failures[0].category, category);
      assert.equal(log.meals[meal].parsed, null);
    }
    assert.equal(log.diagnostics.normalizationComplete, started ? false : null);
  });
}

test("unexpected optional shape is observed without rejecting data previously accepted", async (t) => {
  // A string was iterable in the existing normalizer, but contains no named items.
  stubNutrislice(t, (meal) => Response.json(meal === "breakfast" ? { days: [{ date, menu_items: "abc" }] } : week()));
  const menu = await getHallMenuForDate("busch", date);
  assert.deepEqual(menu?.meals.map((meal) => meal.type), ["lunch", "dinner"]);
  const log = await summary();
  assert.equal(log.meals.breakfast.outcome, "empty");
  assert.deepEqual(log.meals.breakfast.failures.map((failure) => failure.category), ["unexpected_shape", "no_items"]);
  assert.equal(log.diagnostics.normalization?.droppedItems, 3);
});

for (const [name, reply, category] of [
  ["HTTP failure", () => new Response(secret, { status: 502 }), "http_error"],
  ["malformed JSON", () => new Response(`{${secret}`), "malformed_json"],
  ["unexpected shape", () => Response.json({ secret }), "unexpected_shape"],
  ["missing mapping", () => Response.json([]), "school_mapping_missing"]
] as const) {
  test(`school discovery ${name} remains visible after successful static mapping`, async (t) => {
    stubNutrislice(t, undefined, reply);
    const menu = await getHallMenuForDate("busch", date);
    assert.ok(menu);
    const log = await summary();
    assert.equal(log.outcome, "partial");
    assert.equal(log.schoolResolution, "static_fallback");
    assert.equal(log.failures[0].category, category);
    assert.equal(log.failures[0].endpoint, "schools");
    assert.ok(meals.every((meal) => log.meals[meal].outcome === "parsed"));
  });
}

test("Atrium validator rejection remains separate from request failure and retains other meals", async (t) => {
  stubFoodProNet(t, (meal) => new Response(meal === "breakfast" ? pageForMeal(meal).replace("  selected", "") : pageForMeal(meal)));
  const menu = await getHallMenuForDate("atrium", date);
  assert.deepEqual(menu?.meals.map((meal) => meal.type), ["lunch", "dinner"]);
  const log = await summary();
  assert.equal(log.source, "foodpronet");
  assert.equal(log.schoolResolution, "not_applicable");
  assert.equal(log.outcome, "partial");
  assert.equal(log.meals.breakfast.outcome, "rejected");
  assert.equal(log.meals.breakfast.enrichment.attemptedItems, 0);
  assert.deepEqual(log.meals.breakfast.failures, [{ category: "context_rejected", endpoint: "menu", statusCode: null, reason: "missing or ambiguous selected date", count: 1 }]);
  assert.equal(log.diagnostics.parserWarnings, 1);
});

test("Atrium enrichment failures are aggregated per affected item without losing menu items", async (t) => {
  const calls = stubFoodProNet(t, (meal) => new Response(pageForMeal(meal).replace("</fieldset>", "</fieldset>" + pageForMeal(meal).match(/<fieldset>[\s\S]*?<\/fieldset>/)![0])),
    (url) => url.searchParams.get("RecNumAndPort") === "150157*1" ? new Response(secret, { status: 503 }) : new Response(fixture("observed-spinach-label")));
  const menu = await getHallMenuForDate("atrium", date);
  assert.ok(menu);
  assert.equal(menu.meals.length, 3);
  assert.ok(menu.meals.every((meal) => meal.stations[0].items.length === 2));
  assert.ok(menu.meals.every((meal) => meal.stations[0].items[0].nutrition.calories === 0));
  const log = await summary();
  assert.equal(log.outcome, "partial");
  assert.equal(log.diagnostics.parserWarnings, 0, "Enrichment failures are not double-counted as parser warnings in logs");
  assert.equal(log.diagnostics.normalization?.deduplicatedItems, 3);
  for (const meal of meals) {
    assert.equal(log.meals[meal].outcome, "parsed");
    assert.deepEqual(log.meals[meal].failures, []);
    assert.equal(log.meals[meal].enrichment.attemptedItems, 3);
    assert.equal(log.meals[meal].enrichment.failedItems, 2);
    assert.deepEqual(log.meals[meal].enrichment.failures, [{ category: "http_error", endpoint: "nutrition_label", statusCode: 503, reason: null, count: 2 }]);
  }
  assert.equal(calls.filter((path) => path.endsWith("label.aspx")).length, 2, "Shared labels retain existing request deduplication");
});

test("nutrition-label timeout keeps its endpoint and existing 2.5-second budget", async (t) => {
  stubFoodProNet(t, undefined, (url, init) => url.searchParams.get("RecNumAndPort") === "150157*1" ? abortable(init) : new Response(fixture("observed-spinach-label")));
  const pending = getHallMenuForDate("atrium", date);
  await flush();
  t.mock.timers.tick(2500);
  assert.ok(await pending);
  const log = await summary();
  assert.equal(log.outcome, "partial");
  for (const meal of meals) {
    assert.equal(log.meals[meal].enrichment.failures[0].category, "timeout");
    assert.equal(log.meals[meal].enrichment.failures[0].endpoint, "nutrition_label");
    assert.deepEqual(log.meals[meal].failures, []);
  }
});

for (const hall of ["busch", "atrium"] as const) {
  for (const empty of [true, false]) {
    test(`${hall} distinguishes ${empty ? "empty parsing" : "parsed data rejected by usability"}`, async (t) => {
      if (hall === "busch") stubNutrislice(t, () => Response.json(week(date, empty ? [] : [food(1, 0), food(2, 0)])));
      else stubFoodProNet(t, (meal) => new Response(empty ? pageForMeal(meal).replace(/<fieldset>[\s\S]*?<\/fieldset>/g, "") : pageForMeal(meal).replace(/<a href='label\.aspx[\s\S]*?<\/a>/g, "")));
      assert.equal(await getHallMenuForDate(hall, date), null);
      const log = await summary();
      assert.equal(log.outcome, "unavailable");
      assert.deepEqual(log.returned, { meals: 0, stations: 0, items: 0 });
      assert.equal(log.diagnostics.normalization?.processedItemsBeforeDedup, empty ? 0 : 6);
      assert.equal(log.diagnostics.normalizationComplete, true);
      for (const meal of meals) {
        assert.equal(log.meals[meal].outcome, empty ? "empty" : "parsed");
        assert.equal(log.meals[meal].parsed?.items, empty ? 0 : 2);
        if (empty) assert.equal(log.meals[meal].failures[0].category, "no_items");
      }
      if (!empty) assert.equal(log.failures[0].category, "unusable_menu");
    });
  }
}

test("normalization counts distinguish dropped, deduped, returned, and heuristic items", async (t) => {
  stubNutrislice(t, () => Response.json(week(date, [food(1), food(1), food(2), { food: { name: "" } }, { food: { name: "Custom entrée", has_options_or_sides: true } }])));
  const menu = await getHallMenuForDate("busch", date);
  assert.ok(menu);
  const log = await summary("info");
  assert.deepEqual(log.returned, { meals: 3, stations: 3, items: 9 });
  assert.equal(log.diagnostics.normalization?.processedItemsBeforeDedup, 12);
  assert.equal(log.diagnostics.normalization?.droppedItems, 3);
  assert.equal(log.diagnostics.normalization?.deduplicatedItems, 3);
  assert.equal(log.diagnostics.normalization?.itemsWithMeaningfulNutritionBeforeDedup, 9);
  assert.equal(log.diagnostics.normalization?.itemsWithoutMeaningfulNutritionBeforeDedup, 3);
  assert.equal(log.diagnostics.normalization?.meaningfulOrCustomItemsBeforeDedup, 12);
});

for (const available of [true, false]) {
  test(`cached ${available ? "success" : "unavailable result"} and concurrent callers emit one summary`, async (t) => {
    const ready = deferred<void>();
    const calls = stubNutrislice(t, async () => { await ready.promise; return Response.json(available ? week() : { days: [] }); });
    const first = getHallMenuForDate("busch", date);
    const second = rutgersMenuProvider.getDailyMenu("busch", date);
    await flush();
    assert.equal(calls.length, 4);
    assert.equal(logs.length, 0);
    ready.resolve();
    const [a, b] = await Promise.all([first, second]);
    assert.equal(a, b);
    assert.equal(Boolean(a), available);
    await summary(available ? "info" : "warn");
    assert.equal(await getHallMenuForDate("busch", date), a);
    await flush();
    assert.equal(logs.length, 1);
    assert.equal(calls.length, 4);
    // Preserve both existing daily TTLs; the still-valid school cache is observed on the next load.
    t.mock.timers.tick((available ? 15 : 2) * 60 * 1000 + 1);
    await getHallMenuForDate("busch", date);
    await flush();
    assert.equal(logs.length, 2);
    assert.equal(calls.length, 7);
    assert.equal((JSON.parse(JSON.parse(logs[1].raw)[0]) as Summary).schoolResolution, "cached");
  });
}

for (const later of ["never settles", "resolves", "rejects"] as const) {
  test(`immediate failure emits one error before sibling work that ${later}`, async (t) => {
    const ready = deferred<void>();
    let resolutions = 0;
    const brokenSchool = { ...school, get active_menu_types() {
      // An injected internal exception before the existing per-meal fetch catch.
      if (++resolutions === 1) throw new Error(secret);
      return undefined;
    } };
    const calls = stubNutrislice(t, async () => { await ready.promise; return Response.json(week()); },
      () => Object.assign(new Response(), { json: async () => [brokenSchool] }));
    assert.equal(await getHallMenuForDate("busch", date), null, "Preserve the existing fail-fast unavailable result");
    const log = summary("error");
    const emitted = logs[0].raw;
    assert.equal(calls.length, 3, "Both sibling requests started");
    assert.equal(log.outcome, "error");
    assert.equal(log.durationMs, 0);
    assert.deepEqual(log.returned, { meals: 0, stations: 0, items: 0 });
    assert.equal(log.meals.breakfast.failures[0].category, "internal_error");
    assert.equal(log.meals.breakfast.parsed, null);
    assert.equal(log.diagnostics.normalization, null);
    assert.equal(log.diagnostics.normalizationComplete, null);
    for (const meal of ["lunch", "dinner"] as const) {
      assert.equal(log.meals[meal].outcome, "pending");
      assert.equal(log.meals[meal].parsed, null);
      assert.equal(log.meals[meal].normalizationStarted, false);
      assert.equal(log.meals[meal].normalizationCompleted, false);
      assert.deepEqual(log.meals[meal].failures, []);
    }

    t.mock.timers.tick(100);
    if (later === "resolves") ready.resolve();
    else if (later === "rejects") ready.reject(new Error(secret));
    await flush();
    assert.equal(logs.length, 1);
    assert.equal(logs[0].raw, emitted, "Sibling work cannot update or replace the emitted record");
    assert.deepEqual(summary("error"), log, "Duration ends at the daily loader's exit");
  });
}

test("early Atrium error snapshots unfinished normalization before sibling resolution and rejection", async (t) => {
  const labelsReady = deferred<void>();
  const dinnerBody = deferred<string>();
  const unhandled: unknown[] = [];
  const onUnhandled = (reason: unknown) => { unhandled.push(reason); };
  process.on("unhandledRejection", onUnhandled);
  t.after(() => process.off("unhandledRejection", onUnhandled));
  let labelReads = 0;
  let lateParserCalls = 0;
  // Inject exceptions outside the per-meal fetch catch, so whole meal promises reject.
  const invalidHtml = { replace() { throw new Error(secret); } } as unknown as string;
  stubFoodProNet(t, (meal) => Object.assign(new Response(), { text: async () => {
    if (meal === "breakfast") return invalidHtml;
    if (meal === "dinner") return dinnerBody.promise;
    return pageForMeal(meal);
  } }), async (url) => {
    await labelsReady.promise;
    return Object.assign(new Response(), { text: async () => {
      labelReads += 1;
      return fixture(url.searchParams.get("RecNumAndPort") === "150157*1" ? "observed-dressing-label" : "observed-spinach-label");
    } });
  });

  assert.equal(await getHallMenuForDate("atrium", date), null);
  const log = summary("error");
  const emitted = logs[0].raw;
  assert.equal(log.outcome, "error");
  assert.equal(log.durationMs, 0);
  assert.deepEqual(log.returned, { meals: 0, stations: 0, items: 0 });
  assert.equal(log.meals.breakfast.failures[0].category, "internal_error");
  assert.equal(log.meals.lunch.outcome, "pending");
  assert.equal(log.meals.lunch.parsed, null);
  assert.equal(log.meals.lunch.normalizationStarted, true);
  assert.equal(log.meals.lunch.normalizationCompleted, false);
  assert.equal(log.meals.lunch.enrichment.attemptedItems, 2);
  assert.equal(log.meals.dinner.outcome, "pending");
  assert.equal(log.meals.dinner.parsed, null);
  assert.equal(log.meals.dinner.normalizationCompleted, false);
  assert.equal(log.diagnostics.normalization?.processedItemsBeforeDedup, 0);
  assert.equal(log.diagnostics.normalizationComplete, false);

  t.mock.timers.tick(100);
  labelsReady.resolve();
  dinnerBody.resolve({ replace() { lateParserCalls += 1; throw new Error(secret); } } as unknown as string);
  await flush();
  assert.equal(labelReads, 2, "The pending lunch continued through enrichment");
  assert.equal(lateParserCalls, 1, "The pending dinner reached its rejecting parser path");
  assert.deepEqual(unhandled, [], "Promise.all still observes later meal rejections");
  assert.equal(logs.length, 1);
  assert.equal(logs[0].raw, emitted);
  assert.deepEqual(summary("error"), log);
});

test("finishIngestionAttempt builds, serializes, and emits before returning", (t) => {
  const attempt = createIngestionAttempt("atrium", date);
  attempt.meals.breakfast.outcome = "failed";
  attempt.meals.lunch.outcome = "pending";
  attempt.meals.lunch.normalizationStarted = true;
  const diagnostics: DiagnosticCounts = {
    processedItemsBeforeDedup: 0, droppedItems: 0, deduplicatedItems: 0,
    itemsWithMeaningfulNutritionBeforeDedup: 0, itemsWithoutMeaningfulNutritionBeforeDedup: 0,
    meaningfulOrCustomItemsBeforeDedup: 0, blankStationHeaders: 0, blankItemNames: 0,
    fallbackStationLabels: 0, invalidNutritionFields: 0, parserWarnings: 0
  };
  const readDiagnostics = t.mock.fn(() => diagnostics);
  t.mock.timers.tick(25);
  finishIngestionAttempt(attempt, null, true, readDiagnostics);
  const log = summary("error");
  assert.equal(readDiagnostics.mock.callCount(), 1);
  assert.equal(log.durationMs, 25);
  assert.equal(log.meals.lunch.parsed, null);
  assert.equal(log.diagnostics.normalizationComplete, false);

  attempt.meals.lunch.outcome = "parsed";
  attempt.meals.lunch.parsed = { stations: 1, items: 2 };
  attempt.meals.lunch.normalizationCompleted = true;
  diagnostics.processedItemsBeforeDedup = 2;
  assert.deepEqual(summary("error"), log, "Logging passes a serialized snapshot, not mutable diagnostic state");
});

test("many distinct enrichment errors remain bounded and report omitted occurrences", async (t) => {
  const manyItems = Array.from({ length: 25 }, (_, index) => `<fieldset><label style="font-weight:200">Fixture ${index}</label><a href='label.aspx?fixture=${index}'>Nutrition</a></fieldset>`).join("");
  stubFoodProNet(t, (meal) => new Response(pageForMeal(meal).replace(/<fieldset>[\s\S]*?<\/fieldset>/g, "").replace("</form>", manyItems + "</form>")),
    (url) => new Response(secret, { status: 400 + Number(url.searchParams.get("fixture")) }));
  assert.equal(await getHallMenuForDate("atrium", date), null);
  const log = await summary();
  for (const meal of meals) {
    assert.equal(log.meals[meal].enrichment.failedItems, 25);
    assert.equal(log.meals[meal].enrichment.failures.length, 16);
    assert.equal(log.meals[meal].enrichment.omittedFailureCount, 9);
  }
});

test("a console sink failure cannot change the returned real menu", async (t) => {
  stubNutrislice(t);
  const sink = t.mock.method(console, "info", () => { throw new Error(secret); });
  assert.ok(await getHallMenuForDate("busch", date));
  await flush();
  assert.equal(sink.mock.callCount(), 1);
});

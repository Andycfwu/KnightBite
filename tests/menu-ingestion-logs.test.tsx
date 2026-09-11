import assert from "node:assert/strict";
import { beforeEach, test, type TestContext } from "node:test";

import { getHallMenuForDate } from "@/lib/menu";
import { createIngestionAttempt, finishIngestionAttempt, type DiagnosticCounts, type IngestionAttempt, type MealAttempt } from "@/lib/providers/menu-ingestion-log";
import { rutgersMenuProvider } from "@/lib/providers/rutgers-provider";
import type { MealType } from "@/lib/types";

const date = "2026-09-08";
const meals: MealType[] = ["breakfast", "lunch", "dinner"];
const school = { id: 62286, name: "Busch Dining Hall", slug: "busch-dining-hall" };
const secret = "SECRET_CANARY cookie=session-token https://private.example/menu?credential=secret ".repeat(100);
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
beforeEach((context) => {
  const t = context as TestContext;
  // Expire even the 12-hour school cache without adding production reset hooks or changing TTLs.
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: Date.UTC(2026, 8, 8, 12) + ++testNumber * 13 * 60 * 60 * 1000 });
  const previousEnvironment = process.env.NODE_ENV;
  Object.assign(process.env, { NODE_ENV: "production" });
  t.after(() => {
    if (previousEnvironment === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
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
type Reply = Response | Promise<Response>;
function stubNutrislice(t: TestContext, reply: (meal: MealType, init: RequestInit, url: URL) => Reply = () => Response.json(week()), schools: () => Reply = () => Response.json([school, {id:71385,name:"The Atrium",slug:"the-atrium",active_menu_types:meals.map((name,i)=>({name,id:[32934,33316,33318][i]}))}])) {
  const calls: string[] = [];
  const unexpected: string[] = [];
  t.mock.method(globalThis, "fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    calls.push(url.pathname);
    if (url.origin === "https://rutgers.api.nutrislice.com") {
      if (url.pathname === "/menu/api/schools/") return schools();
      const match = url.pathname.match(/^\/menu\/api\/weeks\/school\/(?:62286|71385)\/menu-type\/(32934|33316|33318)\/\d{4}\/\d{2}\/\d{2}\/$/);
      if (match) return reply(({ "32934": "breakfast", "33316": "lunch", "33318": "dinner" } as const)[match[1] as "32934" | "33316" | "33318"], init!, url);
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
    mealStatus: Object.fromEntries(meals.map(meal => [meal, { state: "available", retrievedAt: new Date().toISOString() }])),
    meals: meals.map((meal) => ({ id: `busch-${meal}`, type: meal, label: meal[0].toUpperCase() + meal.slice(1),
      stations: [{ id: "fixture", name: "Fixture Station", items: [1, 2].map((id) => ({
        id: `busch-${meal}-fixture-${id}`, name: `Fixture entrée ${id}`, hallId: "busch", mealType: meal,
        stationId: "fixture", stationName: "Fixture Station", servingSize: "4 oz", menuDate: date,
        nutrition: { calories: 120, protein: 10, carbs: 0, fat: 0, sodium: 0, sugar: 0 },
        ingredients: ["ingredient_canary"], allergens: undefined, sourceLabels: undefined, tags: undefined, description: undefined,
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
      return Response.json(week());
    };
    stubNutrislice(t, reply);
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
    stubNutrislice(t, (_meal, init) => abortable(init));
    const pending = getHallMenuForDate(hall, date);
    await flush();
    t.mock.timers.tick(1100);
    await flush();
    assert.equal(logs.length, 0);
    const timeout = 4500;
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
  ["failed body read", () => new Response(new ReadableStream({ start(controller) { controller.error(new TypeError(secret)); } })), "request_error", false],
  ["missing days shape", () => Response.json({ secret }), "unexpected_shape", false],
  ["non-array days shape", () => Response.json({ days: {} }), "unexpected_shape", false],
  ["null payload", () => Response.json(null), "unexpected_shape", false],
  ["malformed menu_items shape", () => Response.json({ days: [{ date, menu_items: {} }] }), "unexpected_shape", true],
  ["nested normalization exception", () => Response.json(week(date, [{ food: { ...food().food, icons: { food_icons: {} } } }])), "unexpected_shape", true],
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

test("malformed optional meal shape is rejected while other meals survive", async (t) => {
  // Reject malformed collections before iterating or reporting measured item counts.
  stubNutrislice(t, (meal) => Response.json(meal === "breakfast" ? { days: [{ date, menu_items: "abc" }] } : week()));
  const menu = await getHallMenuForDate("busch", date);
  assert.deepEqual(menu?.meals.map((meal) => meal.type), ["lunch", "dinner"]);
  const log = await summary();
  assert.equal(log.meals.breakfast.outcome, "failed");
  assert.deepEqual(log.meals.breakfast.failures.map((failure) => failure.category), ["unexpected_shape"]);
  assert.equal(log.meals.breakfast.parsed, null);
  assert.equal(log.diagnostics.normalization?.droppedItems, 0);
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

for (const hall of ["busch", "atrium"] as const) {
  test(`${hall} settles when fetch never responds and ignores abort`, async (t) => {
    const signals: AbortSignal[] = [];
    const reply = (_meal: MealType, init: RequestInit) => {
      signals.push(init.signal!);
      return new Promise<Response>(() => {});
    };
    stubNutrislice(t, reply);
    const pending = getHallMenuForDate(hall, date);
    await flush();
    t.mock.timers.tick(4500);
    assert.equal(await pending, null);
    assert.ok(signals.length === 3 && signals.every((signal) => signal.aborted));
    const log = summary();
    for (const meal of meals) assert.equal(log.meals[meal].failures[0].category, "timeout");
  });
}

for (const source of ["nutrislice"] as const) {
  for (const later of ["resolve", "reject"] as const) {
    test(`${source} body consumption shares the request deadline and handles a late ${later}`, async (t) => {
      const headers = deferred<void>();
      const body = deferred<string>();
      const signals: AbortSignal[] = [];
      const reply = async (_meal: MealType | URL, init: RequestInit) => {
        signals.push(init.signal!);
        await headers.promise;
        return new Response(new ReadableStream<Uint8Array>({
          start(controller) {
            void body.promise.then(value => { if (!init.signal?.aborted) { controller.enqueue(new TextEncoder().encode(value)); controller.close(); } },
              error => { if (!init.signal?.aborted) controller.error(error); });
          }
        }));
      };
      stubNutrislice(t, reply);
      const pending = getHallMenuForDate("busch", date);
      await flush();
      const timeout = 4500;
      t.mock.timers.tick(500);
      headers.resolve();
      await flush();
      t.mock.timers.tick(timeout - 500);
      assert.equal(await pending, null);
      const log = summary();
      assert.equal(log.durationMs, timeout, "Receiving headers must not restart or clear the deadline");
      assert.ok(signals.every((signal) => signal.aborted));
      for (const meal of meals) {
        const failures = log.meals[meal].failures;
        assert.equal(failures[0].category, "timeout");
        assert.equal(failures[0].endpoint, "menu");
      }
      const emitted = logs[0].raw;
      if (later === "resolve") body.resolve("");
      else body.reject(new Error(secret));
      await flush();
      assert.equal(logs.length, 1);
      assert.equal(logs[0].raw, emitted);
    });
  }
}

for (const hall of ["busch", "atrium"] as const) {
  for (const empty of [true, false]) {
    test(`${hall} distinguishes ${empty ? "empty parsing" : "parsed data rejected by usability"}`, async (t) => {
      stubNutrislice(t, () => Response.json(week(date, empty ? [] : [{ food: { ...food(1).food, rounded_nutrition_info: null } }, { food: { ...food(2).food, rounded_nutrition_info: null } }])));
      const menu = await getHallMenuForDate(hall, date);
      if (empty) { assert.ok(menu); assert.equal(menu.meals.length, 0); assert.ok(Object.values(menu.mealStatus!).every(status => status.state === "empty")); }
      else assert.equal(menu, null);
      const log = await summary();
      assert.equal(log.outcome, empty ? "partial" : "unavailable");
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
    // Successful meals keep fifteen minutes; failures become eligible after thirty seconds.
    t.mock.timers.tick((available ? 15 * 60_000 : 30_000) + 1);
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
      if (++resolutions === 2) throw new Error(secret);
      return undefined;
    } };
    const parse = JSON.parse;
    const schoolBody = JSON.stringify([school]);
    t.mock.method(JSON, "parse", (text: string) => text === schoolBody ? [brokenSchool] : parse(text));
    const calls = stubNutrislice(t, async () => { await ready.promise; return Response.json(week()); },
      () => new Response(schoolBody));
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
    // Per-meal sharing retains siblings until their real deadline. Settle that deadline
    // before restoring fake timers, without permitting any second summary.
    t.mock.timers.tick(4500);
    await flush();
    assert.equal(logs.length, 1);
  });
}

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

test("a console sink failure cannot change the returned real menu", async (t) => {
  stubNutrislice(t);
  const sink = t.mock.method(console, "info", () => { throw new Error(secret); });
  assert.ok(await getHallMenuForDate("busch", date));
  await flush();
  assert.equal(sink.mock.callCount(), 1);
});

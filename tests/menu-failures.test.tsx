import assert from "node:assert/strict";
import { beforeEach, test, type TestContext } from "node:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import HomePage from "@/app/page";
import HallPage from "@/app/hall/[hallId]/page";
import { HallMenuView } from "@/components/menu/HallMenuView";
import { PlateProvider } from "@/hooks/usePlate";
import { UserPreferencesProvider } from "@/hooks/useUserPreferences";
import { diningHalls } from "@/lib/dining-halls";
import { getHallMenuForDate } from "@/lib/menu";
import { dailyMenus } from "@/lib/mock-data";
import { mockMenuProvider } from "@/lib/providers/mock-provider";
import { rutgersMenuProvider } from "@/lib/providers/rutgers-provider";
import type { DailyMenu, DiningHallId } from "@/lib/types";
import { formatDateLabel, formatUpdatedTime, getTodayIsoDate } from "@/lib/utils";

const requestedDate = "2026-09-08";
const lunchtime = new Date("2026-09-08T16:00:00Z");
const hall = diningHalls.find((entry) => entry.id === "busch")!;

function renderMenuView(view: ReactNode) {
  return renderToStaticMarkup(
    <UserPreferencesProvider><PlateProvider>{view}</PlateProvider></UserPreferencesProvider>
  );
}

function realMenu(hallId: DiningHallId = "busch"): DailyMenu {
  return {
    hallId,
    hallName: diningHalls.find((entry) => entry.id === hallId)!.name,
    date: requestedDate,
    isLiveData: true,
    lastUpdatedAt: "2026-09-08T15:42:00Z",
    meals: [{
      id: `${hallId}-lunch`,
      type: "lunch",
      label: "Lunch",
      stations: [{
        id: "test-station",
        name: "SALAD BAR",
        items: [{
          id: `${hallId}-test-item`,
          name: "Rutgers test entrée",
          hallId,
          mealType: "lunch",
          stationId: "test-station",
          stationName: "SALAD BAR",
          servingSize: "4 oz",
          nutrition: { calories: 210, protein: 31, carbs: 1, fat: 8, sodium: 390 },
          ingredients: ["Test ingredient"],
          allergens: ["soy"],
          tags: ["high-protein"],
          available: true
        }]
      }]
    }]
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function forbidMockFallback(t: TestContext) {
  // Return food if called, so an accidental fallback cannot look like a valid null result.
  const mockProvider = t.mock.method(mockMenuProvider, "getDailyMenu", async () => ({
    ...dailyMenus[0],
    isLiveData: false,
    lastUpdatedAt: lunchtime.toISOString()
  }));
  t.after(() => assert.equal(mockProvider.mock.callCount(), 0, "Application paths must never invoke the mock provider"));
}

function assertUnavailableHome(html: string) {
  assert.match(html, /Menu status could not be confirmed/);
  assert.equal(html.match(/Menu status unavailable/g)?.length, diningHalls.length);
  assert.doesNotMatch(html, /Backup menu|Sample menu|Updated|0 live menus|0 menus confirmed|Live today/);
}

function assertUnavailableHall(html: string, date: string) {
  assert.ok(html.includes(formatDateLabel(date)));
  assert.match(html, /Menu unavailable right now/);
  assert.match(html, /We couldn’t load a menu for this hall for today\. Try another hall or check back later\./);
  assert.doesNotMatch(html, /Backup menu|Sample menu|Updated|Live today|closed|Rutgers test entrée/i);
  assert.doesNotMatch(html, /aria-label="Add |Retrieved|Listed on today/);
  for (const menu of dailyMenus) {
    for (const meal of menu.meals) {
      for (const station of meal.stations) {
        for (const item of station.items) {
          assert.ok(!html.includes(item.name), `Unavailable hall must not show ${item.name}`);
        }
      }
    }
  }
}

beforeEach((t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Network requests are forbidden in menu regression tests");
  });
  t.after(() => assert.equal(fetchMock.mock.callCount(), 0, "Tests must not attempt upstream requests"));
  t.mock.method(console, "error", () => {});
});

for (const environment of ["development", "production"] as const) {
  for (const outcome of ["null", "throw"] as const) {
    test(`loader returns unavailable without mock food when Rutgers ${outcome}s in ${environment}`, async (t) => {
      const previousEnvironment = process.env.NODE_ENV;
      Object.assign(process.env, { NODE_ENV: environment });
      t.after(() => {
        if (previousEnvironment === undefined) delete process.env.NODE_ENV;
        else Object.assign(process.env, { NODE_ENV: previousEnvironment });
      });
      forbidMockFallback(t);
      const provider = t.mock.method(rutgersMenuProvider, "getDailyMenu", async () => {
        if (outcome === "throw") throw new Error("Rutgers unavailable");
        return null;
      });

      assert.equal(await getHallMenuForDate(hall.id, requestedDate), null);
      assert.deepEqual(provider.mock.calls[0].arguments, [hall.id, requestedDate]);
      assert.equal(provider.mock.callCount(), 1);
    });
  }
}

test("loader preserves the successful Rutgers menu, including contents and timestamp", async (t) => {
  forbidMockFallback(t);
  const menu = realMenu();
  const original = structuredClone(menu);
  t.mock.method(rutgersMenuProvider, "getDailyMenu", async () => menu);

  const result = await getHallMenuForDate(hall.id, requestedDate);
  assert.strictEqual(result, menu);
  assert.deepEqual(result, original);
});

for (const outcome of ["null", "throw"] as const) {
  test(`homepage reports unconfirmed status when Rutgers ${outcome}s`, async (t) => {
    forbidMockFallback(t);
    t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: lunchtime });
    t.mock.method(rutgersMenuProvider, "getDailyMenu", async () => {
      if (outcome === "throw") throw new Error("Rutgers unavailable");
      return null;
    });

    const html = renderToStaticMarkup(await HomePage());
    assertUnavailableHome(html);
    assert.equal(html.match(/>OPEN</g)?.length, diningHalls.length, "Menu failure must not change operating-hours status");
  });
}

for (const lateOutcome of ["resolve", "reject"] as const) {
  test(`homepage stays unconfirmed after its timeout even if Rutgers later ${lateOutcome}s`, async (t) => {
    forbidMockFallback(t);
    t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: lunchtime });
    const pending = deferred<DailyMenu | null>();
    t.mock.method(rutgersMenuProvider, "getDailyMenu", () => pending.promise);

    let finished = false;
    const page = HomePage().then((result) => { finished = true; return result; });
    t.mock.timers.tick(1099);
    await Promise.resolve();
    assert.equal(finished, false);
    t.mock.timers.tick(1);
    const result = await page;
    assertUnavailableHome(renderToStaticMarkup(result));

    if (lateOutcome === "resolve") pending.resolve(realMenu());
    else pending.reject(new Error("Late Rutgers failure"));
    await pending.promise.catch(() => {});
    assertUnavailableHome(renderToStaticMarkup(result));
  });
}

test("homepage mixed results count only confirmed real menus and use only real update times", async (t) => {
  forbidMockFallback(t);
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: lunchtime });
  const pending = deferred<DailyMenu | null>();
  const provider = t.mock.method(rutgersMenuProvider, "getDailyMenu", async (hallId) => {
    if (hallId === "busch") return realMenu(hallId);
    if (hallId === "livingston") return { ...realMenu(hallId), lastUpdatedAt: undefined };
    if (hallId === "neilson") return { ...realMenu(hallId), isLiveData: false };
    return pending.promise;
  });

  const page = HomePage();
  // Let already-resolved menus win their races before advancing the deadline.
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  t.mock.timers.tick(1100);
  const html = renderToStaticMarkup(await page);
  assert.match(html, /2 menus confirmed for today/);
  assert.equal(html.match(/Live today/g)?.length, 2);
  assert.equal(html.match(/Menu status unavailable/g)?.length, 2);
  assert.equal(html.match(/Updated /g)?.length, 1);
  assert.ok(html.includes(`Updated ${formatUpdatedTime(realMenu().lastUpdatedAt!)}`));
  assert.doesNotMatch(html, /Backup menu|Sample menu|Updated recently|live menus today/);
  assert.deepEqual(provider.mock.calls.map((call) => call.arguments), diningHalls.map((entry) => [entry.id, requestedDate]));
  pending.resolve(null);
});

test("homepage uses singular wording for one confirmed menu without inventing its missing timestamp", async (t) => {
  forbidMockFallback(t);
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: lunchtime });
  t.mock.method(rutgersMenuProvider, "getDailyMenu", async (hallId) => (
    hallId === "busch" ? { ...realMenu(), lastUpdatedAt: undefined } : null
  ));

  const html = renderToStaticMarkup(await HomePage());
  assert.match(html, /1 menu confirmed for today/);
  assert.equal(html.match(/Menu status unavailable/g)?.length, 3);
  assert.doesNotMatch(html, /Updated|Backup menu/);
});

test("closed hall cards still show that menu status is unavailable", async (t) => {
  forbidMockFallback(t);
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: new Date("2026-09-09T02:00:00Z") });
  t.mock.method(rutgersMenuProvider, "getDailyMenu", async () => null);

  const html = renderToStaticMarkup(await HomePage());
  assertUnavailableHome(html);
  assert.equal(html.match(/>CLOSED</g)?.length, diningHalls.length);
});

for (const now of [lunchtime, new Date("2026-09-09T01:00:00Z")]) {
  for (const outcome of ["null", "throw"] as const) {
    test(`hall failure (${outcome}) uses the requested Rutgers date at ${now.toISOString()}`, async (t) => {
      forbidMockFallback(t);
      t.mock.timers.enable({ apis: ["Date"], now });
      const provider = t.mock.method(rutgersMenuProvider, "getDailyMenu", async () => {
        if (outcome === "throw") throw new Error("Rutgers unavailable");
        return null;
      });

      assert.equal(getTodayIsoDate(), requestedDate);
      const result = await HallPage({ params: Promise.resolve({ hallId: hall.id }) });
      assert.deepEqual(provider.mock.calls[0].arguments, [hall.id, requestedDate]);
      const html = renderMenuView(result);
      assertUnavailableHall(html, requestedDate);
      if (now.toISOString().slice(0, 10) !== requestedDate) {
        assert.ok(!html.includes(formatDateLabel(now.toISOString().slice(0, 10))));
      }
    });
  }
}

test("unavailable view retains the supplied request date after the calendar advances", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-10T16:00:00Z") });
  const html = renderMenuView(<HallMenuView hall={hall} menu={null} requestedDate={requestedDate} />);
  assertUnavailableHall(html, requestedDate);
});

test("a successful hall page retains real menu items, meal controls, plate access, and source time", async (t) => {
  forbidMockFallback(t);
  t.mock.timers.enable({ apis: ["Date"], now: lunchtime });
  const menu = realMenu();
  t.mock.method(rutgersMenuProvider, "getDailyMenu", async () => menu);

  const result = await HallPage({ params: Promise.resolve({ hallId: hall.id }) });
  assert.strictEqual(result.props.menu, menu);
  const html = renderMenuView(result);
  assert.match(html, /Rutgers test entrée/);
  assert.match(html, /Lunch/);
  assert.match(html, /Open plate/);
  assert.match(html, /Listed on today’s menu/);
  assert.ok(html.includes(`Retrieved ${formatUpdatedTime(menu.lastUpdatedAt!)}`));
  assert.doesNotMatch(html, /Backup menu|Sample menu|Menu unavailable/);
});

test("mock fixtures remain accessible only by deliberate use and are labeled as samples", async () => {
  const fixture = dailyMenus.find((entry) => entry.hallId === hall.id)!;
  const menu = await mockMenuProvider.getDailyMenu(fixture.hallId, fixture.date);
  assert.ok(menu);
  assert.equal(menu.isLiveData, false);
  assert.deepEqual(menu.meals, fixture.meals);

  const html = renderMenuView(<HallMenuView hall={hall} menu={menu} requestedDate={fixture.date} />);
  assert.match(html, /Sample menu/);
  assert.doesNotMatch(html, /Backup menu|Updated|Live today/);
});

test("halls without maps retain the plain unavailable state and requested date", () => {
  const neilson = diningHalls.find((entry) => entry.id === "neilson")!;
  const html = renderToStaticMarkup(<HallMenuView hall={neilson} menu={null} requestedDate={requestedDate} />);
  assertUnavailableHall(html, requestedDate);
  assert.doesNotMatch(html, /type="search"|Open plate/);
});

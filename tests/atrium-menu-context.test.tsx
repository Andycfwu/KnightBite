import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { beforeEach, test, type TestContext } from "node:test";

import { getHallMenuForDate } from "@/lib/menu";
import { validateAtriumMenuContext } from "@/lib/providers/atrium-menu-context";
import { mockMenuProvider } from "@/lib/providers/mock-provider";
import { rutgersMenuProvider } from "@/lib/providers/rutgers-provider";
import type { MealType } from "@/lib/types";

const fixture = (name: string) => readFileSync(`tests/fixtures/foodpronet/${name}.html`, "utf8");
const lunch = fixture("observed-lunch");
const date = "2026-09-08";
const meals: MealType[] = ["breakfast", "lunch", "dinner"];
const label = (meal: MealType) => meal[0].toUpperCase() + meal.slice(1);

// Synthetic meal variants retain the observed lunch items; they are not observed breakfast/dinner menus.
function pageForMeal(meal: MealType) {
  return lunch.replace(/(<div class="tab active" aria-label=")Lunch(">\s*)Lunch/, `$1${label(meal)}$2${label(meal)}`)
    .replace("mealName=Lunch", `mealName=${label(meal)}`);
}

function replaceActive(page: string, body: string, ariaLabel = body) {
  return page.replace(/<div class="tab active"[^>]*>[\s\S]*?<\/div>/, `<div class="tab active" aria-label="${ariaLabel}">${body}</div>`);
}

const rejections: Array<{ name: string; change: (page: string, meal: MealType) => string; reason: RegExp }> = [
  { name: "different displayed date", change: (page) => page.replace("Tuesday, September 8, 2026", "Wednesday, September 9, 2026"), reason: /menu date/ },
  { name: "different returned location", change: (page) => page.replaceAll("locationNum=13", "locationNum=12").replace("THE ATRIUM IS", "ANOTHER HALL IS"), reason: /footer/ },
  { name: "different returned meal", change: (page, meal) => replaceActive(page, meal === "dinner" ? "Lunch" : "Dinner"), reason: /menu meal/ },
  { name: "missing date selector", change: (page) => page.replace(/<select\b[\s\S]*?<\/select>/, ""), reason: /date selector/ },
  { name: "requested date only in unselected options and navigation", change: (page) => page.replace("  selected", ""), reason: /selected date/ },
  { name: "malformed selected date", change: (page) => page.replace("Tuesday, September 8, 2026", "September someday"), reason: /malformed selected date/ },
  { name: "impossible calendar date", change: (page) => page.replace("Tuesday, September 8, 2026", "Tuesday, February 30, 2026"), reason: /malformed selected date/ },
  { name: "incorrect weekday", change: (page) => page.replace("Tuesday, September 8, 2026", "Monday, September 8, 2026"), reason: /malformed selected date/ },
  { name: "multiple selected dates", change: (page) => page.replace('>Wednesday, September 9, 2026', ' selected>Wednesday, September 9, 2026'), reason: /ambiguous selected date/ },
  { name: "duplicate date selector", change: (page) => page + page.match(/<select\b[\s\S]*?<\/select>/)![0], reason: /ambiguous date selector/ },
  { name: "missing active meal with navigation still present", change: (page) => page.replace('class="tab active"', 'class="tab"'), reason: /active meal/ },
  { name: "multiple active meals", change: (page) => page.replace('<div class="tabs">', '<div class="tabs"><div class="tab active" aria-label="Lunch">Lunch</div>'), reason: /ambiguous active meal/ },
  { name: "active meal only in a link", change: (page, meal) => replaceActive(page, `<a href="?activeMeal=${label(meal)}">${label(meal)}</a>`, label(meal)), reason: /menu meal/ },
  { name: "conflicting active-meal accessible label", change: (page, meal) => replaceActive(page, label(meal), "Late NIght"), reason: /menu meal/ },
  { name: "missing location footer despite Atrium item text", change: (page) => page.replace(/<div class="shortmenufooter">[\s\S]*?<\/div>/, '<a href="?locationNum=13">The Atrium</a>'), reason: /footer/ },
  { name: "ambiguous location footers", change: (page) => page + '<div class="shortmenufooter">Another hall</div>', reason: /footer/ },
  { name: "missing report-form context", change: (page) => page.replace(/ action="[^"]*"/, ""), reason: /menu form context/ },
  { name: "report form points to another endpoint", change: (page) => page.replace("nutRpt.aspx?", "pickmenu.aspx?"), reason: /menu form context/ },
  { name: "report date conflicts with selected date", change: (page) => page.replace("dtdate=9%2f8%2f2026&mealName", "dtdate=9%2f9%2f2026&mealName"), reason: /menu date/ },
  { name: "selected option URL conflicts with displayed date", change: (page) => page.replace("dtdate=9/8/2026&locationNum", "dtdate=9/9/2026&locationNum"), reason: /menu date/ },
  { name: "malformed report date", change: (page) => page.replace("dtdate=9%2f8%2f2026&mealName", "dtdate=invalid&mealName"), reason: /menu date/ },
  { name: "conflicting duplicate date parameters", change: (page) => page.replace("nutRpt.aspx?", "nutRpt.aspx?dtdate=9%2f9%2f2026&"), reason: /menu date/ },
  { name: "report location conflicts with footer", change: (page) => page.replace("nutRpt.aspx?locationNum=13", "nutRpt.aspx?locationNum=12"), reason: /menu location/ },
  { name: "missing report location", change: (page) => page.replace("nutRpt.aspx?locationNum=13&", "nutRpt.aspx?"), reason: /menu location/ },
  { name: "duplicate report locations", change: (page) => page.replace("nutRpt.aspx?", "nutRpt.aspx?locationNum=12&"), reason: /menu location/ },
  { name: "report meal conflicts with active tab", change: (page) => page.replace(/mealName=(Breakfast|Lunch|Dinner)/, "mealName=Late+NIght"), reason: /menu meal/ },
  { name: "conflicting nonempty location heading", change: (page) => page.replace("Menus - </h1>", "Menus - Another Hall</h1>"), reason: /location heading/ },
  { name: "conflicting location name on report form", change: (page) => page.replace(/(nutRpt.aspx\?[^" ]*)locationName=/, "$1locationName=Another+Hall"), reason: /location name/ },
  { name: "missing menu box", change: (page) => page.replace('class="menuBox"', 'class="other"'), reason: /menu form/ },
  { name: "multiple menu boxes", change: (page) => page + '<div class="menuBox"></div>', reason: /menu form/ },
  { name: "nested conflicting forms", change: (page) => page.replace('<div class="menuBox">', '<form action="nutRpt.aspx?locationNum=12"><div class="menuBox"></form>'), reason: /menu form/ },
  { name: "context only in comments", change: (page) => `<!--${page}-->`, reason: /menu form/ },
  { name: "context only in script text", change: (page) => `<script type="text/plain">${page}</script>`, reason: /menu form/ }
];

let testNumber = 0;
beforeEach((t) => {
  // Expire all existing daily/page/label entries between cases without changing production caches.
  t.mock.timers.enable({ apis: ["Date"], now: new Date(Date.UTC(2026, 8, 8, 12) + ++testNumber * 16 * 60 * 1000) });
  const network = t.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected upstream request"); });
  t.after(() => assert.equal(network.mock.callCount(), 0, "No real network path may run"));
  t.mock.method(console, "info", () => {});
  t.mock.method(console, "warn", () => {});
  t.mock.method(console, "error", () => {});
  const mocks = t.mock.method(mockMenuProvider, "getDailyMenu", async () => { throw new Error("Mock fallback is forbidden"); });
  t.after(() => assert.equal(mocks.mock.callCount(), 0));
});

function stubFoodProNet(t: TestContext, responseForMeal: (meal: MealType) => string) {
  const menuUrls: URL[] = [];
  const labelUrls: URL[] = [];
  const unexpected: string[] = [];
  t.mock.method(globalThis, "fetch", async (input) => {
    const url = new URL(String(input));
    if (url.origin === "https://menuportal23.dining.rutgers.edu" && url.pathname === "/FoodPronet/pickmenu.aspx") {
      menuUrls.push(url);
      const meal = url.searchParams.get("activeMeal")!.toLowerCase() as MealType;
      return new Response(responseForMeal(meal));
    }
    if (url.origin === "https://menuportal23.dining.rutgers.edu" && url.pathname === "/FoodPronet/label.aspx") {
      labelUrls.push(url);
      const recipe = url.searchParams.get("RecNumAndPort");
      if (recipe === "150157*1") return new Response(fixture("observed-dressing-label"));
      if (recipe === "130019*4") return new Response(fixture("observed-spinach-label"));
    }
    unexpected.push(url.href);
    throw new Error(`Unexpected fixture request: ${url.href}`);
  });
  t.after(() => {
    // Assert outside fetch: the provider intentionally catches fetch exceptions.
    assert.deepEqual(unexpected, []);
    for (const url of menuUrls) {
      assert.equal(url.searchParams.get("dtdate"), "9/8/2026");
      assert.equal(url.searchParams.get("locationNum"), "13");
    }
    assert.deepEqual(menuUrls.map((url) => url.searchParams.get("activeMeal")).sort(), ["Breakfast", "Dinner", "Lunch"]);
  });
  return { menuUrls, labelUrls };
}

for (const [name, requestedDate, meal] of [
  ["observed-lunch", "2026-09-08", "lunch"],
  ["observed-dinner", "2026-09-09", "dinner"],
  ["observed-breakfast", "2026-09-08", "breakfast"]
] as const) {
  test(`context helper accepts ${name} with its observed display formatting`, () => {
    const result = validateAtriumMenuContext(fixture(name), requestedDate, meal);
    assert.ok("menuHtml" in result, JSON.stringify(result));
    assert.match(result.menuHtml, /<fieldset>/);
  });
}

test("observed food response outside date options is unconfirmed", () => {
  const result = validateAtriumMenuContext(fixture("observed-unselected-date"), "2026-09-07", "dinner");
  assert.deepEqual(result, { reason: "missing or ambiguous selected date" });
});

test("an observed echoed location heading cannot override the menu context", () => {
  const result = validateAtriumMenuContext(fixture("observed-echoed-location"), date, "lunch");
  assert.deepEqual(result, { reason: "missing or conflicting menu location heading" });
});

for (const variant of rejections) {
  test(`context helper rejects ${variant.name}`, () => {
    const result = validateAtriumMenuContext(variant.change(lunch, "lunch"), date, "lunch");
    assert.ok("reason" in result, variant.name);
    assert.match(result.reason, variant.reason);
  });

  test(`provider rejects ${variant.name} before labels and returns unavailable without mocks`, async (t) => {
    const calls = stubFoodProNet(t, (meal) => variant.change(pageForMeal(meal), meal));
    assert.equal(await getHallMenuForDate("atrium", date), null);
    assert.equal(calls.menuUrls.length, 3, "Every test must exercise fresh menu responses");
    assert.equal(calls.labelUrls.length, 0);
  });
}

test("matching context preserves normalized content, nutrition, identifiers, date, and timestamp", async (t) => {
  const calls = stubFoodProNet(t, (meal) => meal === "lunch" ? lunch : "<html>No menu context</html>");
  const now = new Date().toISOString();
  const menu = await rutgersMenuProvider.getDailyMenu("atrium", date);
  assert.ok(menu);
  assert.equal(menu.date, date);
  assert.equal(menu.hallId, "atrium");
  assert.equal(menu.hallName, "The Atrium");
  assert.equal(menu.isLiveData, true);
  assert.equal(menu.lastUpdatedAt, now);
  assert.equal(menu.meals.length, 1);
  assert.deepEqual(menu.meals[0], {
    id: "atrium-lunch", type: "lunch", label: "Lunch",
    stations: [{ id: "salad-bar", name: "SALAD BAR", items: [
      {
        id: "atrium-lunch-salad-bar-atrium-house-salad-dressing", name: "ATRIUM HOUSE SALAD DRESSING",
        stationId: "salad-bar", stationName: "SALAD BAR", hallId: "atrium", mealType: "lunch", servingSize: "1 OZL",
        // Preserve the existing parser's output, including fields it cannot extract from this label markup.
        nutrition: { calories: 152, protein: 0, carbs: 2.7, fat: 16.2, sodium: 0, sugar: 0 },
        description: undefined, ingredients: menu.meals[0].stations[0].items[0].ingredients,
        tags: ["low carbon footprint"], imageUrl: null, isCustom: undefined, available: true
      },
      {
        id: "atrium-lunch-salad-bar-baby-spinach", name: "BABY SPINACH",
        stationId: "salad-bar", stationName: "SALAD BAR", hallId: "atrium", mealType: "lunch", servingSize: "4 OZ",
        nutrition: { calories: 26, protein: 0, carbs: 4.1, fat: 0.4, sodium: 0, sugar: 0 },
        description: undefined, ingredients: ["BABY SPINACH"], tags: ["low carbon footprint"],
        imageUrl: null, isCustom: undefined, available: true
      }
    ] }]
  });
  assert.ok(menu.meals[0].stations[0].items[0].ingredients?.includes("KOSHER SALT"));
  assert.equal(calls.menuUrls.length, 3);
  assert.equal(calls.labelUrls.length, 2);
});

test("other validated meals survive a rejected meal that contains usable food", async (t) => {
  const calls = stubFoodProNet(t, (meal) => meal === "breakfast" ? pageForMeal(meal).replace("  selected", "") : pageForMeal(meal));
  const menu = await getHallMenuForDate("atrium", date);
  assert.ok(menu);
  assert.deepEqual(menu.meals.map((meal) => meal.type), ["lunch", "dinner"]);
  assert.ok(menu.meals.every((meal) => meal.stations[0].items.length === 2));
  assert.equal(calls.menuUrls.length, 3);
  assert.equal(calls.labelUrls.length, 2, "The existing shared nutrition-label cache is preserved");
});

test("valid context with no menu items retains unavailable behavior", async (t) => {
  const calls = stubFoodProNet(t, (meal) => pageForMeal(meal).replace(/<fieldset>[\s\S]*?<\/fieldset>/g, ""));
  assert.equal(await getHallMenuForDate("atrium", date), null);
  assert.equal(calls.menuUrls.length, 3);
  assert.equal(calls.labelUrls.length, 0);
});

test("valid context with no meaningful nutrition retains existing usability rules", async (t) => {
  const calls = stubFoodProNet(t, (meal) => pageForMeal(meal).replace(/<a href='label\.aspx[\s\S]*?<\/a>/g, ""));
  assert.equal(await getHallMenuForDate("atrium", date), null);
  assert.equal(calls.labelUrls.length, 0);
});

test("context rejection diagnostics are concise and contain no upstream HTML", async (t) => {
  const info = t.mock.method(console, "info", () => {});
  stubFoodProNet(t, () => lunch.replace("  selected", ""));
  assert.equal(await getHallMenuForDate("atrium", date), null);
  const output = JSON.stringify(info.mock.calls.map((call) => call.arguments));
  assert.match(output, /Atrium menu context rejected: missing or ambiguous selected date/);
  assert.doesNotMatch(output, /<html|<form|<select|<fieldset|ATRIUM HOUSE SALAD DRESSING/);
});

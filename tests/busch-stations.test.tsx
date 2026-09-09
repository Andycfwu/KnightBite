import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HallMenuView } from "@/components/menu/HallMenuView";
import { PlateProvider } from "@/hooks/usePlate";
import { BUSCH_MAP, BUSCH_STATIONS, groupBuschStations } from "@/lib/busch-stations";
import type { DailyMenu, Station } from "@/lib/types";

const hall = { id: "busch" as const, name: "Busch Dining Hall", shortName: "Busch" };
function station(name: string): Station {
  return { id: name, name, items: [{ id: `${name}-item`, name: `${name} test dish`, hallId: "busch", mealType: "lunch", stationId: name,
    stationName: name, nutrition: { calories: 120, protein: 4, carbs: 15, fat: 3 }, available: true }] };
}
const menu: DailyMenu = { hallId: "busch", hallName: hall.name, date: "2026-09-08", isLiveData: true,
  lastUpdatedAt: "2026-09-08T16:00:00Z", meals: [{ id: "lunch", type: "lunch", label: "Lunch", stations: [station("SOUPS"), station("SALAD BAR"), station("CTO MASTER")] }] };

test("Busch groups observed section names without losing or duplicating upstream objects", () => {
  const input = ["ROTISSERIE", "CANTINA", "CANTINA SIDES", "DELI BAR ENTREE", "ASIAN INSPIRED CUISINE", "COOK TO ORDER BAR", "PIZZA & PASTA", "PASTA STATION", "SOUPS", "SALAD BAR", "SALAD DRESSING", "ENTREES", "CTO MASTER", "SUSHI", "SUSHI SIDES", "NOODLE BAR", "FRESH FRUIT", "BREADS", "FUTURE STATION"].map(station);
  const original = structuredClone(input);
  const groups = groupBuschStations(input);
  const retained = groups.flatMap((group) => group.stations);
  assert.equal(retained.length, input.length);
  assert.deepEqual(new Set(retained), new Set(input));
  assert.deepEqual(input, original);
  assert.equal(groups.reduce((sum, group) => sum + group.itemCount, 0), input.length);
  assert.equal(groups.find((group) => group.id === "cantina")?.itemCount, 2);
  assert.equal(groups.find((group) => group.id === "pizza")?.itemCount, 1);
  assert.equal(groups.find((group) => group.id === "pasta")?.itemCount, 1);
  assert.equal(groups.find((group) => group.id === "salad")?.itemCount, 2);
  assert.equal(groups.find((group) => group.id === "sushi")?.itemCount, 2);
  assert.equal(groups.find((group) => group.id === "noodle")?.itemCount, 1);
  assert.equal(groups.find((group) => group.id === "fruit")?.itemCount, 1);
  assert.deepEqual(groups.find((group) => group.id === "other")?.stations.map((entry) => entry.name), ["ROTISSERIE", "DELI BAR ENTREE", "SOUPS", "CTO MASTER", "BREADS", "FUTURE STATION"]);
  for (const entry of input) assert.strictEqual(retained.find((value) => value.id === entry.id)?.items[0], entry.items[0]);
});

test("Busch requires exact labels; similar words and vegetarian foods never establish a location", () => {
  const vegetarian = station("UNCONFIRMED");
  vegetarian.items[0].name = "Vegetarian salad and grilled vegetables";
  vegetarian.items[0].tags = ["vegetarian"];
  const groups = groupBuschStations([station("  cantina   sides  "), station("CANTINA SPECIAL EVENT"), station("PREPARED SALADS"), vegetarian]);
  assert.equal(groups.find((group) => group.id === "cantina")?.itemCount, 1);
  assert.equal(groups.find((group) => group.id === "salad")?.itemCount, 0);
  assert.equal(groups.find((group) => group.id === "other")?.itemCount, 3);
});

test("Busch distinguishes the two entree lines without inferring cuisine from food names", () => {
  const asian = station("ASIAN INSPIRED CUISINE");
  const entrees = station("ENTREES");
  entrees.items[0].name = "Asian vegetables";
  const groups = groupBuschStations([asian, entrees]);
  assert.deepEqual(groups.find((group) => group.id === "asian")?.stations, [asian]);
  assert.deepEqual(groups.find((group) => group.id === "entrees")?.stations, [entrees]);
  assert.match(groups.find((group) => group.id === "asian")?.note ?? "", /Usually Asian-inspired/);
  const aliases = BUSCH_STATIONS.flatMap((zone) => [...zone.aliases]);
  assert.equal(new Set(aliases).size, aliases.length, "One alias must never target multiple physical counters");
});

test("Busch meal regrouping cannot retain previous meal items", () => {
  const lunch = groupBuschStations([station("SALAD BAR")]);
  const dinner = groupBuschStations([station("SUSHI")]);
  assert.equal(lunch.find((group) => group.id === "salad")?.itemCount, 1);
  assert.equal(dinner.find((group) => group.id === "salad")?.itemCount, 0);
  assert.equal(dinner.find((group) => group.id === "sushi")?.itemCount, 1);
});

function render(value: DailyMenu | null) {
  return renderToStaticMarkup(<PlateProvider><HallMenuView hall={hall} menu={value} requestedDate="2026-09-08" /></PlateProvider>);
}

test("Busch unavailable state preserves the guide, disables search, and invents no food or retrieval time", () => {
  const html = render(null);
  assert.match(html, /September 8/);
  assert.match(html, /Menu unavailable right now/);
  assert.match(html, /Approximate station layout/);
  assert.match(html, /type="search"[^>]*disabled=""/);
  assert.equal((html.match(/aria-label="Explore /g) ?? []).length, 18);
  assert.match(html, /Entrance/);
  assert.doesNotMatch(html, /Explore Coffee|Explore Bread|Explore Toast/);
  assert.doesNotMatch(html, /aria-label="Add |test dish|Retrieved|Listed on today|Sample menu|Backup menu/);
});

test("Busch real menu renders station food, accessible controls and the existing plate entry", () => {
  const html = render(menu);
  assert.doesNotMatch(html, /SOUPS test dish/);
  assert.match(html, /SALAD BAR test dish/);
  assert.match(html, /aria-label="Add SALAD BAR test dish"/);
  assert.match(html, /aria-controls="busch-food-panel"/);
  assert.match(html, /id="busch-food-panel"/);
  assert.match(html, /aria-label="Open plate"/);
  assert.match(html, /Search all Busch menu items/);
  assert.match(html, /List view/);
  assert.match(html, /More stations/);
  assert.match(html, /Listed on today’s menu/);
  assert.match(html, /Retrieved/);
  assert.doesNotMatch(html, /Livingston/);
});

test("Busch fruit stands share one menu group and removed counters do not hide upstream food", () => {
  const fruit = station("FRESH FRUIT");
  const bread = station("BREADS");
  const coffee = station("COFFEE");
  const groups = groupBuschStations([fruit, bread, coffee]);
  const fruitZone = BUSCH_STATIONS.find((zone) => zone.id === "fruit")!;
  assert.equal(fruitZone.additionalSpots.length, 2);
  assert.equal(groups.find((group) => group.id === "fruit")?.itemCount, 1);
  assert.equal(groups.flatMap((group) => group.stations).filter((entry) => entry === fruit).length, 1);
  assert.deepEqual(groups.find((group) => group.id === "other")?.stations, [bread, coffee]);
  const html = renderToStaticMarkup(<PlateProvider><HallMenuView hall={hall} menu={null} requestedDate="2026-09-08" /></PlateProvider>);
  assert.match(html, /Explore Fruit, entrance left/);
  assert.match(html, /Explore Fruit, entrance right/);
  assert.equal(BUSCH_MAP.image.width / BUSCH_MAP.image.height, 1586 / 992);
});

test("Busch explicitly supplied samples have no live label or retrieval claim", () => {
  const html = render({ ...menu, isLiveData: false });
  assert.match(html, /Sample menu/);
  assert.doesNotMatch(html, /Listed on today|Retrieved|Backup menu/);
});

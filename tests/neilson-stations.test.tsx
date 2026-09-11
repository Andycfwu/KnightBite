import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HallMenuView } from "@/components/menu/HallMenuView";
import { PlateProvider } from "@/hooks/usePlate";
import { NEILSON_MAP, NEILSON_STATIONS, groupNeilsonStations } from "@/lib/neilson-stations";
import type { DailyMenu, Station } from "@/lib/types";

const hall = { id: "neilson" as const, name: "Neilson Dining Hall", shortName: "Neilson" };
function station(name: string): Station {
  return { id: name, name, items: [{ id: `${name}-item`, name: `${name} test dish`, hallId: "neilson", mealType: "lunch", stationId: name,
    stationName: name, nutrition: { calories: 120, protein: 4, carbs: 15, fat: 3 }, available: true }] };
}
const menu: DailyMenu = { hallId: "neilson", hallName: hall.name, date: "2026-09-09", isLiveData: true,
  lastUpdatedAt: "2026-09-09T16:00:00Z", meals: [{ id: "lunch", type: "lunch", label: "Lunch", stations: [station("SALAD BAR"), station("SALAD DRESSING"), station("CTO MASTER")] }] };
function render(value: DailyMenu | null) {
  return renderToStaticMarkup(<PlateProvider><HallMenuView hall={hall} menu={value} requestedDate="2026-09-09" /></PlateProvider>);
}

test("Neilson maps verified section labels and conserves every original station and item", () => {
  const names = ["ENTREES", "COOK TO ORDER BAR", "ASIAN INSPIRED CUISINE", "ROTISSERIE", "PLANT-BASED EATS", "CANTINA", "CANTINA SIDES", "CUSTOM DELI BAR (KIOSK)", "DELI BAR ENTREE", "PIZZA & PASTA", "SALAD BAR", "SALAD DRESSING", "PREPARED SALADS", "SOUPS", "CTO MASTER", "FRESH FRUIT", "BREADS", "THREE CHILIES PROTEINS"];
  const input = names.map(station);
  const before = structuredClone(input);
  const groups = groupNeilsonStations(input);
  const retained = groups.flatMap(group => group.stations);
  assert.equal(retained.length, input.length);
  assert.deepEqual(new Set(retained), new Set(input));
  assert.deepEqual(input, before);
  assert.equal(groups.reduce((sum, group) => sum + group.itemCount, 0), input.length);
  assert.equal(groups.find(group => group.id === "plant-cantina")?.itemCount, 3);
  assert.equal(groups.find(group => group.id === "deli")?.itemCount, 2);
  assert.equal(groups.find(group => group.id === "salad")?.itemCount, 2);
  assert.deepEqual(groups.find(group => group.id === "other")?.stations.map(s => s.name), names.slice(12));
  for (const entry of input) assert.strictEqual(retained.find(s => s.id === entry.id)?.items[0], entry.items[0]);
});

test("Neilson never guesses station placement from cuisine names or dietary tags", () => {
  const unknown = station("UNMAPPED");
  unknown.items[0].name = "Asian vegan chicken salad";
  unknown.items[0].tags = ["vegan"];
  const groups = groupNeilsonStations([station("  salad   bar "), station("SPECIAL DIETARY NEEDS"), unknown]);
  assert.equal(groups.find(group => group.id === "salad")?.itemCount, 1);
  assert.equal(groups.find(group => group.id === "other")?.itemCount, 2);
  const aliases = NEILSON_STATIONS.flatMap(zone => [...zone.aliases]);
  assert.equal(new Set(aliases).size, aliases.length);
});

test("Neilson drawing orientation keeps entrance below counters and deli above the salad island", () => {
  const position = (id: string) => NEILSON_STATIONS.find(zone => zone.id === id)!;
  assert.ok(NEILSON_MAP.entrance.y > Math.max(...NEILSON_STATIONS.map(zone => zone.y)));
  assert.ok(position("deli").y < position("salad").y);
  assert.ok(position("entrees").x < position("salad").x);
  assert.ok(position("pizza").x > position("salad").x);
  assert.ok(position("chicken").y < position("asian").y);
  assert.ok(position("asian").y < position("specialty").y);
});

test("Neilson unavailable state keeps its guide without inventing foods or retrieval claims", () => {
  const html = render(null);
  assert.match(html, /September 9/);
  assert.match(html, /(?:Breakfast|Lunch|Dinner) menu unavailable right now/);
  assert.match(html, /type="search"[^>]*disabled=""/);
  assert.equal((html.match(/aria-label="Explore /g) ?? []).length, 9);
  assert.match(html, /Dietary support/);
  assert.doesNotMatch(html, /aria-label="Explore Dietary|aria-label="Add |Retrieved|Listed on Rutgers|Sample menu/);
});

test("Neilson uses the shared menu and plate controls with real data and honest sample labeling", () => {
  const html = render(menu);
  assert.match(html, /SALAD BAR test dish/);
  assert.match(html, /aria-label="Add SALAD BAR test dish"/);
  assert.match(html, /aria-controls="neilson-food-panel"/);
  assert.match(html, /Search all Neilson menu items/);
  assert.match(html, /aria-label="Open plate"/);
  assert.match(html, /More stations/);
  assert.match(html, /List view/);
  assert.match(html, /Retrieved/);
  const sample = render({ ...menu, isLiveData: false });
  assert.match(sample, /Sample menu/);
  assert.doesNotMatch(sample, /Listed on Rutgers|Retrieved|Backup menu/);
});

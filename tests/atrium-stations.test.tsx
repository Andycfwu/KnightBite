import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HallMenuView } from "@/components/menu/HallMenuView";
import { PlateProvider } from "@/hooks/usePlate";
import { ATRIUM_MAP, ATRIUM_STATIONS, groupAtriumStations } from "@/lib/atrium-stations";
import type { DailyMenu, Station } from "@/lib/types";

const hall = { id: "atrium" as const, name: "The Atrium", shortName: "Atrium" };
function station(name: string): Station {
  return { id: name, name, items: [{ id: `${name}-item`, name: `${name} test dish`, hallId: "atrium", mealType: "lunch", stationId: name,
    stationName: name, nutrition: { calories: 120, protein: 4, carbs: 15, fat: 3 }, available: true }] };
}
const menu: DailyMenu = { hallId: "atrium", hallName: hall.name, date: "2026-09-09", isLiveData: true,
  lastUpdatedAt: "2026-09-09T16:00:00Z", meals: [{ id: "lunch", type: "lunch", label: "Lunch", stations: [station("PI PIZZA"), station("PI PIZZA TOPPINGS"), station("FUTURE STATION")] }] };
function render(value: DailyMenu | null) {
  return renderToStaticMarkup(<PlateProvider><HallMenuView hall={hall} menu={value} requestedDate="2026-09-09" /></PlateProvider>);
}

test("Atrium maps observed FoodProNet sections without dropping or duplicating source objects", () => {
  const names = ["SALAD BAR", "SOUPS", "PI PIZZA", "PI PIZZA TOPPINGS", "MEZZE PROTEINS", "MEZZE BASES", "MEZZE TOPPINGS AND SIDES", "SCARLET GINGER", "SCARLET GINGER NOODLE BOWL", "KINGS HAWAIIAN", "KINGS HAWAIIAN SIDES", "KINGS HAWAIIAN TOPPINGS", "THREE CHILIES", "THREE CHILIES TOPPINGS", "GRAB AND GO", "FUTURE STATION"];
  const input = names.map(station);
  const original = structuredClone(input);
  const groups = groupAtriumStations(input);
  const retained = groups.flatMap(group => group.stations);
  assert.deepEqual(new Set(retained), new Set(input));
  assert.equal(retained.length, input.length);
  assert.deepEqual(input, original);
  assert.equal(groups.reduce((sum, group) => sum + group.itemCount, 0), input.length);
  for (const [id, count] of [["pizza", 2], ["mezze", 3], ["kings", 3], ["chilies", 2], ["ginger", 2], ["salad", 2], ["grab-go", 1], ["other", 1]] as const) {
    assert.equal(groups.find(group => group.id === id)?.itemCount, count, id);
  }
  for (const entry of input) assert.strictEqual(retained.find(s => s.id === entry.id)?.items[0], entry.items[0]);
});

test("Atrium matches section labels exactly, never cuisine or diet words in a food name", () => {
  const ambiguous = station("UNMAPPED");
  ambiguous.items[0].name = "Scarlet Ginger vegan soup";
  ambiguous.items[0].tags = ["vegan"];
  const groups = groupAtriumStations([station("  pi   pizza  "), station("PI PIZZA EVENT"), ambiguous]);
  assert.equal(groups.find(group => group.id === "pizza")?.itemCount, 1);
  assert.equal(groups.find(group => group.id === "ginger")?.itemCount, 0);
  assert.equal(groups.find(group => group.id === "other")?.itemCount, 2);
  const aliases = ATRIUM_STATIONS.flatMap(zone => [...zone.aliases]);
  assert.equal(new Set(aliases).size, aliases.length);
});

test("Atrium breakfast yogurt and later soup/salad use the same area with fresh meal groups", () => {
  const breakfast = groupAtriumStations([station("YOGURT BAR")]);
  const lunch = groupAtriumStations([station("SOUPS"), station("SALAD BAR")]);
  assert.equal(breakfast.find(group => group.id === "salad")?.itemCount, 1);
  assert.equal(lunch.find(group => group.id === "salad")?.itemCount, 2);
  assert.deepEqual(lunch.find(group => group.id === "salad")?.stations.map(s => s.name), ["SOUPS", "SALAD BAR"]);
});

test("Atrium refrigerated islands share a group without decorative landmark labels", () => {
  const grabGo = station("GRAB AND GO");
  const groups = groupAtriumStations([grabGo]);
  const zone = ATRIUM_STATIONS.find(zone => zone.id === "grab-go")!;
  assert.equal(zone.additionalSpots.length, 1);
  assert.equal(groups.flatMap(group => group.stations).filter(s => s === grabGo).length, 1);
  assert.equal(ATRIUM_MAP.landmarks.length, 0);
  const html = render(null);
  assert.doesNotMatch(html, /Rutgers R wall/);
  assert.doesNotMatch(html, /Checkout/);
  assert.doesNotMatch(html, /Snack display/);
  assert.doesNotMatch(html, /aria-label="Explore (Checkout|Rutgers|Snack)/);
});

test("Atrium null menus keep the drawing, date and controls without inventing food or live metadata", () => {
  const html = render(null);
  assert.match(html, /September 9/);
  assert.match(html, /Menu unavailable right now/);
  assert.match(html, /type="search"[^>]*disabled=""/);
  assert.equal((html.match(/aria-label="Explore /g) ?? []).length, 8);
  assert.match(html, /Entrance/);
  assert.doesNotMatch(html, /aria-label="Add |test dish|Retrieved|Listed on Rutgers|Sample menu/);
});

test("Atrium real and sample rendering reuse menu, search and plate behavior", () => {
  const html = render(menu);
  assert.match(html, /PI PIZZA test dish/);
  assert.match(html, /PI PIZZA TOPPINGS test dish/);
  assert.match(html, /aria-label="Add PI PIZZA test dish"/);
  assert.match(html, /aria-controls="atrium-food-panel"/);
  assert.match(html, /Search all The Atrium menu items/);
  assert.match(html, /aria-label="Open plate"/);
  assert.match(html, /List view/);
  assert.match(html, /More stations/);
  assert.match(html, /Retrieved/);
  const sample = render({ ...menu, isLiveData: false });
  assert.match(sample, /Sample menu/);
  assert.doesNotMatch(sample, /Listed on Rutgers|Retrieved|Backup menu/);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HallMenuView } from "@/components/menu/HallMenuView";
import { PlateProvider } from "@/hooks/usePlate";
import { groupLivingstonStations, LIVINGSTON_MAP } from "@/lib/livingston-stations";
import type { DailyMenu, Station } from "@/lib/types";

const hall = { id: "livingston" as const, name: "Livingston Dining Commons", shortName: "Livingston" };
function station(name: string, id = name): Station {
  return { id, name, items: [{ id: `${id}-item`, name: `${name} test dish`, hallId: "livingston", mealType: "lunch", stationId: id,
    stationName: name, nutrition: { calories: 120, protein: 4, carbs: 15, fat: 3 }, available: true }] };
}
const menu: DailyMenu = { hallId: "livingston", hallName: hall.name, date: "2026-09-08", isLiveData: true,
  lastUpdatedAt: "2026-09-08T16:00:00Z", meals: [{ id: "lunch", type: "lunch", label: "Lunch", stations: [station("SALAD BAR"), station("Unfamiliar Station")] }] };

test("Livingston grouping preserves every upstream station and item exactly once", () => {
  const input = [station("PIZZA & PASTA"), station("SALAD BAR"), station("SALAD DRESSING"), station("DELI BAR"), station("PUB"), station("CTO MASTER"), station("FUTURE STATION")];
  const groups = groupLivingstonStations(input);
  const retained = groups.flatMap((group) => group.stations);
  assert.equal(retained.length, input.length);
  assert.deepEqual(new Set(retained), new Set(input));
  assert.equal(groups.reduce((sum, group) => sum + group.itemCount, 0), input.length);
  assert.equal(groups.find((group) => group.id === "salad")?.itemCount, 3);
  assert.deepEqual(groups.find((group) => group.id === "other")?.stations.map((entry) => entry.name), ["PUB", "CTO MASTER", "FUTURE STATION"]);
});

test("Only exact normalized aliases map to a physical area", () => {
  const groups = groupLivingstonStations([station("  salad   bar  "), station("SALAD BAR SPECIAL EVENT"), station("ASIAN INSPIRED CUISINE")]);
  assert.equal(groups.find((group) => group.id === "salad")?.itemCount, 1);
  assert.equal(groups.find((group) => group.id === "wok")?.itemCount, 0);
  assert.equal(groups.find((group) => group.id === "other")?.itemCount, 2);
});

test("Grouping another meal cannot retain a previous meal's foods", () => {
  const lunch = groupLivingstonStations([station("SALAD BAR")]);
  const dinner = groupLivingstonStations([station("ROTISSERIE")]);
  assert.equal(lunch.find((group) => group.id === "salad")?.itemCount, 1);
  assert.equal(dinner.find((group) => group.id === "salad")?.itemCount, 0);
  assert.equal(dinner.find((group) => group.id === "rotisserie")?.itemCount, 1);
});

test("Livingston places fresh fruit on the shared island without inferring dietary locations", () => {
  const fruit = station("FRESH FRUIT");
  const input = [fruit, station("SALAD BAR"), station("DELI BAR"), station("VEGAN SPECIAL"), station("YOGURT BAR")];
  const groups = groupLivingstonStations(input);
  assert.deepEqual(groups.find(group => group.id === "salad")?.stations, input.slice(0, 3));
  assert.deepEqual(groups.find(group => group.id === "other")?.stations, input.slice(3));
  assert.equal(groups.flatMap(group => group.stations).filter(entry => entry === fruit).length, 1);
  const html = render(null);
  assert.equal((html.match(/class="livi-mapEntrance"/g) ?? []).length, 2);
  assert.doesNotMatch(html, /Dietary needs/);
  assert.doesNotMatch(html, /aria-label="Explore Dietary/);
  assert.deepEqual(LIVINGSTON_MAP.entrances.map(entry => entry.direction), ["right", "up"]);
});

function render(value: DailyMenu | null) {
  return renderToStaticMarkup(<PlateProvider><HallMenuView hall={hall} menu={value} requestedDate="2026-09-08" /></PlateProvider>);
}

test("Livingston unavailable state keeps the guide but no food claims, add controls, or invented timestamp", () => {
  const html = render(null);
  assert.match(html, /September 8/);
  assert.match(html, /Menu unavailable right now/);
  assert.match(html, /Approximate station layout/);
  assert.equal((html.match(/aria-label="Explore /g) ?? []).length, 7);
  assert.doesNotMatch(html, /aria-label="Add |test dish|Retrieved|Listed on Rutgers|Sample menu|Backup menu/);
});

test("Livingston uses real menu content, provides list/search alternatives and retains plate entry", () => {
  const html = render(menu);
  assert.match(html, /SALAD BAR test dish/);
  assert.match(html, /aria-label="Add SALAD BAR test dish"/);
  assert.match(html, /aria-label="Open plate"/);
  assert.match(html, /Search all Livingston menu items/);
  assert.match(html, /List view/);
  assert.match(html, /More stations/);
  assert.match(html, /Listed on Rutgers menu/);
  assert.match(html, /Retrieved/);
});

test("Deliberately supplied samples cannot receive a live source label or retrieval time", () => {
  const html = render({ ...menu, isLiveData: false });
  assert.match(html, /Sample menu/);
  assert.doesNotMatch(html, /Listed on Rutgers|Retrieved|Backup menu/);
});

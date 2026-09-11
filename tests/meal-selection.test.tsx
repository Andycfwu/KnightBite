import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { getDefaultMealType } from "@/lib/menu-helpers";
import { getSuggestedMeal } from "@/lib/meal-schedule";
import { getStationMenuStatus, groupMapStations } from "@/lib/station-map";
import { BUSCH_MAP } from "@/lib/busch-stations";
import { HallMenuView } from "@/components/menu/HallMenuView";
import { PlateProvider } from "@/hooks/usePlate";
import { UserPreferencesProvider } from "@/hooks/useUserPreferences";
import { diningHalls } from "@/lib/dining-halls";
import type { DailyMenu, MealType } from "@/lib/types";

function menu(types: MealType[] = ["breakfast", "lunch", "dinner"], date = "2026-09-10"): DailyMenu {
  return { hallId: "busch", hallName: "Busch Dining Hall", date, isLiveData: true,
    meals: types.map(type => ({ id: type, type, label: type, stations: [] })) };
}
const at = (time: string) => new Date(`2026-09-10T${time}:00-04:00`);
for (const [time, expected] of [
  ["06:59", "breakfast"], ["07:00", "breakfast"], ["10:29", "breakfast"],
  ["10:30", "lunch"], ["10:59", "lunch"], ["11:00", "lunch"],
  ["14:59", "lunch"], ["15:00", "dinner"], ["16:29", "dinner"],
  ["16:30", "dinner"], ["18:00", "dinner"], ["21:00", "dinner"], ["23:59", "dinner"], ["00:00", "breakfast"]
] as const) test(`New York initial meal at ${time} is ${expected}`, () => {
  assert.equal(getDefaultMealType(menu(), at(time)), expected);
});
test("uses Neilson's distinct boundary rather than a global breakfast cutoff", () => {
  assert.equal(getSuggestedMeal("neilson", at("10:00")), "lunch");
  assert.equal(getSuggestedMeal("busch", at("10:00")), "breakfast");
  assert.equal(getSuggestedMeal("neilson", at("14:30")), "dinner");
  assert.equal(getSuggestedMeal("busch", at("14:30")), "lunch");
});
test("UTC rollover and winter daylight offset still select New York dinner", () => {
  assert.equal(getDefaultMealType(menu(), new Date("2026-09-11T00:30:00Z")), "dinner");
  assert.equal(getDefaultMealType(menu(undefined, "2026-01-15"), new Date("2026-01-15T23:00:00Z")), "dinner");
  assert.equal(getDefaultMealType(menu(undefined, "2026-03-08"), new Date("2026-03-08T22:00:00Z")), "dinner");
});
test("non-today dates start with chronological first listed meal, regardless of payload order", () => {
  assert.equal(getDefaultMealType(menu(["dinner", "breakfast", "lunch"], "2026-09-09"), at("18:00")), "breakfast");
  assert.equal(getDefaultMealType(menu(["dinner", "lunch"], "2026-09-11"), at("18:00")), "lunch");
});
test("missing expected meal selects a real next or last section; empty menus do not manufacture sections", () => {
  assert.equal(getDefaultMealType(menu(["breakfast", "lunch"]), at("18:00")), "lunch");
  assert.equal(getDefaultMealType(menu(["breakfast", "dinner"]), at("12:00")), "dinner");
  assert.equal(getDefaultMealType(menu(["lunch"]), at("08:00")), "lunch");
  assert.equal(menu([]).meals.find(m => m.type === getDefaultMealType(menu([]), at("18:00"))), undefined);
});
test("station evidence separates unconfirmed menus and empty listed meals; neither implies closed", () => {
  assert.deepEqual(getStationMenuStatus(undefined, 0), { state: "unavailable", label: "Menu status unavailable" });
  const breakfast = menu().meals[0];
  assert.deepEqual(getStationMenuStatus(breakfast, 0), { state: "empty", label: "No items listed for breakfast" });
  assert.deepEqual(getStationMenuStatus(breakfast, 2), { state: "listed", label: "2 items listed for breakfast" });
});
test("breakfast cook-to-order foods are conserved and count as listed, never assumed closed", () => {
  const item = { id: "omelet" } as DailyMenu["meals"][number]["stations"][number]["items"][number];
  const groups = groupMapStations([{ id: "omelets", name: "OMELET BAR", items: [item] }], BUSCH_MAP.zones);
  assert.equal(groups.reduce((sum, group) => sum + group.itemCount, 0), 1);
  const serving = groups.find(group => group.itemCount)!;
  assert.equal(getStationMenuStatus(menu().meals[0], serving.itemCount).state, "listed");
  assert.equal(serving.stations[0].items[0], item);
});
test("rendered empty station controls remain usable and describe the actual selected meal", () => {
  const hall = diningHalls.find(h => h.id === "busch")!;
  const render = (data: DailyMenu | null) => renderToStaticMarkup(<UserPreferencesProvider><PlateProvider>
    <HallMenuView hall={hall} menu={data} requestedDate="2026-09-10" initialMeal="dinner" />
  </PlateProvider></UserPreferencesProvider>);
  const html = render(menu());
  assert.match(html, /No items listed for dinner/);
  assert.match(html, /data-menu-state="empty"/);
  assert.match(html, /aria-describedby="busch-[^"]+-status"/);
  assert.doesNotMatch(html, /No items listed for breakfast|>Closed</);
  const unavailable = render(null);
  assert.match(unavailable, /data-menu-state="unavailable"/);
  assert.doesNotMatch(unavailable, /data-menu-state="empty"|No items listed for dinner|>Closed</);
});

test("missing dinner never displays lunch under a dinner label", () => {
  const html = renderToStaticMarkup(<UserPreferencesProvider><PlateProvider>
    <HallMenuView hall={diningHalls.find(h => h.id === "busch")!} menu={menu(["lunch"])} requestedDate="2026-09-10" initialMeal="dinner" />
  </PlateProvider></UserPreferencesProvider>);
  assert.match(html, /Lunch MENU/);
  assert.match(html, /No items listed for lunch/);
  assert.doesNotMatch(html, /Dinner MENU|No items listed for dinner/);
});

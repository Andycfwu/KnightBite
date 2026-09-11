import assert from "node:assert/strict";
import { test } from "node:test";
import { filterMenuStations, matchesMenuFilter } from "@/lib/menu-filters";
import type { MenuItem, Station } from "@/lib/types";

const item: MenuItem = {
  id: "test", name: "Grilled tofu", hallId: "busch", mealType: "lunch", stationId: "salad",
  stationName: "Salad bar", servingSize: "4 oz", nutrition: { calories: 180, protein: 24, carbs: 6, fat: 7 }, available: true
};

test("dietary filters require explicit tags, never a food name or missing allergen data", () => {
  for (const filter of ["vegan", "vegetarian", "gluten-free", "halal"] as const) {
    assert.equal(matchesMenuFilter({ ...item, name: `${filter} bowl`, allergens: [] }, filter), false);
  }
  assert.equal(matchesMenuFilter({ ...item, tags: [" Vegan "] }, "vegan"), true);
  assert.equal(matchesMenuFilter({ ...item, tags: ["vegan"] }, "vegetarian"), true);
  assert.equal(matchesMenuFilter({ ...item, tags: ["Gluten Free"] }, "gluten-free"), true);
  assert.equal(matchesMenuFilter({ ...item, tags: ["not-vegan"] }, "vegan"), false);
});

test("protein filter uses the displayed 20g threshold and excludes variable nutrition", () => {
  assert.equal(matchesMenuFilter({ ...item, nutrition: { ...item.nutrition, protein: 20 } }, "high-protein"), true);
  assert.equal(matchesMenuFilter({ ...item, nutrition: { ...item.nutrition, protein: 19.9 }, tags: ["high-protein"] }, "high-protein"), false);
  assert.equal(matchesMenuFilter({ ...item, isCustom: true }, "high-protein"), false);
});

test("search intersects dietary filters, matches allergens and retains original food objects", () => {
  const tofu = { ...item, tags: ["vegan"], allergens: ["Soy"], ingredients: ["Tofu", "Ginger"] };
  const cheese = { ...item, id: "cheese", name: "Cheese", allergens: ["Milk"], tags: ["vegetarian"] };
  const stations: Station[] = [{ id: "salad", name: "Salad bar", items: [tofu, cheese] }];
  const before = structuredClone(stations);
  assert.strictEqual(filterMenuStations(stations, " soy ", "vegan")[0].items[0], tofu);
  assert.equal(filterMenuStations(stations, "ginger", "all")[0].items.length, 1);
  assert.equal(filterMenuStations(stations, "milk", "vegan").length, 0);
  assert.equal(filterMenuStations(stations, "SALAD BAR", "all")[0].items.length, 2);
  assert.deepEqual(stations, before);
});

test("empty meal and no matches return no phantom stations", () => {
  assert.deepEqual(filterMenuStations([], "", "all"), []);
  assert.deepEqual(filterMenuStations([{ id: "salad", name: "Salad bar", items: [item] }], "unknown", "all"), []);
});

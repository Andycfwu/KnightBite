import { hasMeaningfulNutrition } from "@/lib/nutrition";
import type { MenuItem, Station } from "@/lib/types";

export const MENU_FILTERS = [
  { id: "all", label: "All items" },
  { id: "vegan", label: "Vegan" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "gluten-free", label: "Gluten-free" },
  { id: "halal", label: "Halal" },
  { id: "high-protein", label: "20g+ protein" }
] as const;

export type MenuFilter = typeof MENU_FILTERS[number]["id"];

export function matchesMenuFilter(item: MenuItem, filter: MenuFilter): boolean {
  if (filter === "all") return true;
  if (filter === "high-protein") return !item.isCustom && hasMeaningfulNutrition(item.nutrition) && item.nutrition.protein !== null && item.nutrition.protein >= 20;
  // Dietary labels must be explicit. Missing allergens or ingredients are not evidence.
  const tags = (item.tags ?? []).map((tag) => tag.trim().toLowerCase().replace(/[\s_]+/g, "-"));
  return tags.includes(filter) || (filter === "vegetarian" && tags.includes("vegan"));
}

export function filterMenuStations(stations: Station[], query: string, filter: MenuFilter): Station[] {
  const search = query.trim().toLowerCase();
  return stations.map((station) => ({
    ...station,
    items: station.items.filter((item) => matchesMenuFilter(item, filter) && (!search || [
      item.name, station.name, item.servingSize, ...(item.ingredients ?? []), ...(item.allergens ?? []), ...(item.tags ?? []), ...(item.sourceLabels ?? [])
    ].filter(Boolean).join(" ").toLowerCase().includes(search)))
  })).filter((station) => station.items.length > 0);
}

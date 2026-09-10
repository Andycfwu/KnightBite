import type { MenuItem, PlateItem } from "./types";
import { NUTRIENTS } from "./nutrition";

// A plate is a snapshot. A refreshed date/portion/value must not silently rewrite it.
export function plateItemIdentity(item: MenuItem): string {
  return JSON.stringify([item.id, item.menuDate ?? null, item.name, item.servingSize ?? null,
    item.isCustom ?? false, ...NUTRIENTS.map((key) => item.nutrition[key] ?? null)]);
}
export function toPlateItem(item: MenuItem): PlateItem {
  return { itemId: plateItemIdentity(item), sourceItemId: item.id, menuDate: item.menuDate,
    isCustom: item.isCustom, name: item.name, quantity: 1, servingSize: item.servingSize,
    nutrition: { ...item.nutrition } };
}
export function addPlateItem(items: PlateItem[], item: MenuItem): PlateItem[] {
  const incoming = toPlateItem(item);
  return items.some((entry) => entry.itemId === incoming.itemId)
    ? items.map((entry) => entry.itemId === incoming.itemId ? { ...entry, quantity: Math.min(entry.quantity + 1, 999) } : entry)
    : [...items, incoming];
}

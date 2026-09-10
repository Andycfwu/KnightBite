import { Nutrition, PlateItem, PlateTotals } from "@/lib/types";

export const NUTRIENTS = ["calories", "protein", "carbs", "fat", "sodium", "sugar"] as const;
export const unknownNutrition = (): Nutrition => ({ calories: null, protein: null, carbs: null, fat: null, sodium: null, sugar: null });
export function isKnownNutrient(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
// Presence, including verified zero, is distinct from absence.
export function hasMeaningfulNutrition(nutrition: Nutrition): boolean {
  return NUTRIENTS.some((key) => isKnownNutrient(nutrition[key]));
}
export function hasCompleteNutrition(nutrition: Nutrition): boolean {
  return NUTRIENTS.every((key) => isKnownNutrient(nutrition[key]));
}
export function formatNutrient(value: number | null | undefined, unit = ""): string {
  return isKnownNutrient(value) ? `${Math.round(value * 10) / 10}${unit}` : "Unknown";
}
export function formatTotal(totals: Nutrition, key: keyof Nutrition, unit = ""): string {
  const coverage = (totals as Partial<PlateTotals>).coverage?.[key];
  const value = totals[key];
  return `${isKnownNutrient(value) && coverage?.missing ? "Known subtotal: " : ""}${formatNutrient(value, unit)}`;
}
export function multiplyNutrition(nutrition: Nutrition, quantity: number): Nutrition {
  return Object.fromEntries(NUTRIENTS.map((key) => [key,
    isKnownNutrient(nutrition[key]) ? nutrition[key]! * quantity : null])) as Nutrition;
}
// Strict addition is useful outside a plate: unknown + known remains unknown.
export function addNutrition(a: Nutrition, b: Nutrition): Nutrition {
  return Object.fromEntries(NUTRIENTS.map((key) => [key,
    isKnownNutrient(a[key]) && isKnownNutrient(b[key]) ? a[key]! + b[key]! : null])) as Nutrition;
}
export function calculatePlateTotals(items: PlateItem[]): PlateTotals {
  const totals = { ...unknownNutrition(), coverage: {} } as PlateTotals;
  for (const key of NUTRIENTS) {
    let known = 0, missing = 0, sum = 0;
    for (const item of items) {
      if (!item.isCustom && isKnownNutrient(item.nutrition[key])) {
        sum += item.nutrition[key]! * item.quantity;
        known += item.quantity;
      } else missing += item.quantity;
    }
    totals[key] = known || !items.length ? Math.round(sum * 10) / 10 : null;
    totals.coverage[key] = { known, missing };
  }
  return totals;
}
export function getTotalPlateItemCount(items: PlateItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

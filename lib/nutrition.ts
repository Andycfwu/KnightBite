import { Nutrition, PlateItem } from "@/lib/types";

function withDefaults(nutrition: Nutrition): Required<Nutrition> {
  return {
    calories: nutrition.calories ?? 0,
    protein: nutrition.protein ?? 0,
    carbs: nutrition.carbs ?? 0,
    fat: nutrition.fat ?? 0,
    sodium: nutrition.sodium ?? 0,
    sugar: nutrition.sugar ?? 0
  };
}

export function hasMeaningfulNutrition(nutrition: Nutrition): boolean {
  const normalized = withDefaults(nutrition);

  return (
    normalized.calories > 0 ||
    normalized.protein > 0 ||
    normalized.carbs > 0 ||
    normalized.fat > 0 ||
    normalized.sodium > 0 ||
    normalized.sugar > 0
  );
}

export function multiplyNutrition(nutrition: Nutrition, quantity: number): Nutrition {
  const normalized = withDefaults(nutrition);

  return {
    calories: normalized.calories * quantity,
    protein: normalized.protein * quantity,
    carbs: normalized.carbs * quantity,
    fat: normalized.fat * quantity,
    sodium: normalized.sodium * quantity,
    sugar: normalized.sugar * quantity
  };
}

export function addNutrition(a: Nutrition, b: Nutrition): Nutrition {
  const left = withDefaults(a);
  const right = withDefaults(b);

  return {
    calories: left.calories + right.calories,
    protein: left.protein + right.protein,
    carbs: left.carbs + right.carbs,
    fat: left.fat + right.fat,
    sodium: left.sodium + right.sodium,
    sugar: left.sugar + right.sugar
  };
}

export function calculatePlateTotals(items: PlateItem[]): Nutrition {
  return items.reduce<Nutrition>(
    (totals, item) => addNutrition(totals, multiplyNutrition(item.nutrition, item.quantity)),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      sodium: 0,
      sugar: 0
    }
  );
}

export function getTotalPlateItemCount(items: PlateItem[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

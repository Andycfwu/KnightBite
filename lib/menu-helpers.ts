import type { DailyMenu, MealSection, MenuItem, MealType } from "./types";

export function getMealSection(menu: DailyMenu, mealType: MealType): MealSection | null {
  return menu.meals.find((meal) => meal.type === mealType) ?? null;
}

export function flattenMenuItems(menu: DailyMenu): MenuItem[] {
  return menu.meals.flatMap((meal) => meal.stations.flatMap((station) => station.items));
}

export function getAvailableMealTypes(menu: DailyMenu): MealType[] {
  return menu.meals.map((meal) => meal.type);
}

export function getDefaultMealType(menu: DailyMenu): MealType {
  return menu.meals[0]?.type ?? "breakfast";
}

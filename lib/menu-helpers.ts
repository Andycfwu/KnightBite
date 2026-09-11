import { MEAL_ORDER } from "./constants";
import { getSuggestedMeal } from "./meal-schedule";
import { getRutgersNowParts } from "./utils";
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

export function getDefaultMealType(menu: DailyMenu, now = new Date()): MealType {
  const available = MEAL_ORDER.filter((type) => menu.meals.some((meal) => meal.type === type));
  if (menu.date !== getRutgersNowParts(now).isoDate) return available[0] ?? "breakfast";
  return getSuggestedMeal(menu.hallId, now);
}

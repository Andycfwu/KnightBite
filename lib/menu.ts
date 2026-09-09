import { diningHalls } from "@/lib/dining-halls";
import { rutgersMenuProvider } from "@/lib/providers/rutgers-provider";
import { DailyMenu, DiningHall, DiningHallId, MealSection, MenuItem, MealType } from "@/lib/types";

export function getDiningHalls(): DiningHall[] {
  return diningHalls;
}

export function getDiningHall(hallId: string): DiningHall | null {
  return diningHalls.find((hall) => hall.id === hallId) ?? null;
}

export async function getHallMenuForDate(hallId: DiningHallId, date: string): Promise<DailyMenu | null> {
  try {
    return await rutgersMenuProvider.getDailyMenu(hallId, date);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[menu] Rutgers menu retrieval failed for ${hallId} on ${date}. Menu unavailable.`, error);
    }

    return null;
  }
}

export async function debugLogHallMenuSnapshot(hallId: DiningHallId, date: string) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const menu = await getHallMenuForDate(hallId, date);
  console.dir(menu, { depth: null });
  return menu;
}

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

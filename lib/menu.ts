import { diningHalls } from "@/lib/dining-halls";
import { rutgersMenuProvider } from "@/lib/providers/rutgers-provider";
import { DailyMenu, DiningHall, DiningHallId } from "@/lib/types";

export function getDiningHalls(): DiningHall[] {
  return diningHalls;
}

export function getDiningHall(hallId: string): DiningHall | null {
  return diningHalls.find((hall) => hall.id === hallId) ?? null;
}

export async function getHallMenuForDate(hallId: DiningHallId, date: string): Promise<DailyMenu | null> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    // Bound the caller's wait even if an upstream operation stops making progress.
    // The provider keeps its own cache and ingestion outcome; this is a display deadline.
    return await Promise.race([
      rutgersMenuProvider.getDailyMenu(hallId, date),
      new Promise<null>((resolve) => { timeout = setTimeout(() => resolve(null), 15_000); })
    ]);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[menu] Rutgers menu retrieval failed for ${hallId} on ${date}. Menu unavailable.`, error);
    }

    return null;
  } finally {
    clearTimeout(timeout);
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

export { getMealSection, flattenMenuItems, getAvailableMealTypes, getDefaultMealType } from "./menu-helpers";

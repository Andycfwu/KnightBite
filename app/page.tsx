import { HallCardStatus } from "@/components/home/HallCard";
import { SERVICE_WINDOWS } from "@/lib/meal-schedule";
import { HomeScreen } from "@/components/home/HomeScreen";
import { getHallMenuForDate } from "@/lib/menu";
import { diningHalls } from "@/lib/dining-halls";
import { DailyMenu, DiningHallId } from "@/lib/types";
import {
  formatRutgersServiceTime,
  formatUpdatedTime,
  getRutgersCurrentDecimalHour,
  getTodayIsoDate
} from "@/lib/utils";

export const dynamic = "force-dynamic";


function buildHallStatus(hallId: DiningHallId, menu: DailyMenu | null): HallCardStatus {
  const hour = getRutgersCurrentDecimalHour();
  const windows = SERVICE_WINDOWS[hallId];
  const menuConfirmed = menu?.isLiveData === true;
  const updatedLabel = menuConfirmed && menu.lastUpdatedAt ? `Updated ${formatUpdatedTime(menu.lastUpdatedAt)}` : undefined;
  const sourceLabel = menuConfirmed ? "Live today" : "Menu status unavailable";
  const orderedMeals = (Object.entries(windows) as Array<[keyof typeof windows, [number, number] | undefined]>).filter(
    ([, range]) => Boolean(range)
  ) as Array<[keyof typeof windows, [number, number]]>;

  const firstMeal = orderedMeals[0];
  const lastMeal = orderedMeals[orderedMeals.length - 1];

  const openMeal = orderedMeals.find(
    ([, range]) => range && hour >= range[0] && hour < range[1]
  );

  const hallIsOpen = Boolean(firstMeal && lastMeal && hour >= firstMeal[1][0] && hour < lastMeal[1][1]);
  const nextMeal = orderedMeals.find(([, range]) => hour < range[0]);

  if (openMeal) {
    const currentMealLabel = openMeal[0].charAt(0).toUpperCase() + openMeal[0].slice(1);

    return {
      state: "open",
      mealLabel: currentMealLabel,
      detail: nextMeal
        ? `Typical ${nextMeal[0].charAt(0).toUpperCase() + nextMeal[0].slice(1)} starts at ${formatRutgersServiceTime(nextMeal[1][0])}`
        : `Typical ${openMeal[0]} hours`,
      updatedLabel,
      menuConfirmed,
      sourceLabel
    };
  }

  if (hallIsOpen && nextMeal) {
    return {
      state: "open",
      mealLabel: "Typical hours",
      detail: `Typical ${nextMeal[0].charAt(0).toUpperCase() + nextMeal[0].slice(1)} starts at ${formatRutgersServiceTime(nextMeal[1][0])}`,
      updatedLabel,
      menuConfirmed,
      sourceLabel
    };
  }

  return {
    state: "closed",
    detail: firstMeal && hour >= lastMeal[1][1]
      ? `Typical first service: ${formatRutgersServiceTime(firstMeal[1][0])}`
      : nextMeal
        ? `Typical next service: ${formatRutgersServiceTime(nextMeal[1][0])}`
        : "Check today’s hours",
    menuConfirmed,
    sourceLabel
  };
}

async function getHomeHallStatus(hallId: DiningHallId, date: string) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const menu = await Promise.race<DailyMenu | null>([
      getHallMenuForDate(hallId, date),
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => resolve(null), 1100);
      })
    ]);

    return buildHallStatus(hallId, menu);
  } catch {
    return buildHallStatus(hallId, null);
  } finally {
    clearTimeout(timeout);
  }
}

export default async function HomePage() {
  const todayIso = getTodayIsoDate();
  const statusEntries = await Promise.all(
    diningHalls.map(async (hall) => {
      const status = await getHomeHallStatus(hall.id as DiningHallId, todayIso);
      return [hall.id, status] as const;
    })
  );

  const statusByHall = Object.fromEntries(statusEntries);
  return <HomeScreen date={todayIso} statusByHall={statusByHall} />;
}

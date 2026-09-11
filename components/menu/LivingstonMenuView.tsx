"use client";

import { HallStationExplorer } from "@/components/menu/HallStationExplorer";
import { LIVINGSTON_MAP } from "@/lib/livingston-stations";
import type { DailyMenu, MealType } from "@/lib/types";

export function LivingstonMenuView({ menu, requestedDate, initialMeal }: { menu: DailyMenu | null; requestedDate: string; initialMeal?: MealType }) {
  return <HallStationExplorer menu={menu} requestedDate={requestedDate} map={LIVINGSTON_MAP} initialMeal={initialMeal} />;
}

"use client";

import { useState } from "react";
import { HallMenuView } from "@/components/menu/HallMenuView";
import { MealEntryClock } from "@/hooks/useMealSelection";
import type { DailyMenu, DiningHall } from "@/lib/types";

// Mounted only by the guarded /preview-check/meals route; data is returned
// Rutgers data. Cloning props exercises a same-hall/date refresh, not retrieval.
export function MealSelectionScenario({ hall, menu, requestedDate, clock }: {
  hall: DiningHall; menu: DailyMenu | null; requestedDate: string; clock: string;
}) {
  const [currentMenu, setCurrentMenu] = useState(menu);
  return <MealEntryClock.Provider value={clock}>
    <button type="button" className="m-4 rounded border p-2" onClick={() => setCurrentMenu(currentMenu ? structuredClone(currentMenu) : null)}>
      Rerender same menu
    </button>
    <HallMenuView hall={hall} menu={currentMenu} requestedDate={requestedDate} initialMeal="breakfast" />
  </MealEntryClock.Provider>;
}

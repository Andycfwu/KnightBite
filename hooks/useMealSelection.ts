"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getDefaultMealType } from "@/lib/menu-helpers";
import type { DailyMenu, DiningHallId, MealType } from "@/lib/types";

// Only the guarded Preview check supplies a fixed clock. Normal hall entry uses
// the browser's current instant, interpreted by the shared Rutgers schedule.
export const MealEntryClock = createContext<string | null>(null);

export function useMealSelection(menu: DailyMenu | null, initialMeal?: MealType, requested?: { hallId: DiningHallId; date: string }) {
  const clock = useContext(MealEntryClock);
  const hallId = requested?.hallId;
  const date = requested?.date;
  const selectionMenu = useMemo(() => menu ?? (hallId && date ? { hallId, date, hallName: "", meals: [] } : null), [menu, hallId, date]);
  const context = `${selectionMenu?.hallId ?? ""}:${selectionMenu?.date ?? ""}`;
  const entryContext = useRef<string | null>(null);
  // Keep the server's hint for matching hydration, then resolve once at entry.
  // A prefetched/server-rendered breakfast can be hours old by navigation time.
  const [choice, setChoice] = useState<MealType>(() => initialMeal ?? (menu ? getDefaultMealType(menu) : "breakfast"));
  const selectedMeal = choice;

  useEffect(() => {
    if (!selectionMenu) return;
    if (entryContext.current !== context) {
      entryContext.current = context;
      setChoice(getDefaultMealType(selectionMenu, clock ? new Date(clock) : new Date()));
    }
  }, [context, selectionMenu, clock]);

  function setSelectedMeal(meal: MealType) {
    // A click replayed during hydration wins over the entry effect as well.
    entryContext.current = context;
    setChoice(meal);
  }

  return { selectedMeal, setSelectedMeal };
}

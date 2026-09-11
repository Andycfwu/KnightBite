"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getDefaultMealType } from "@/lib/menu-helpers";
import type { DailyMenu, MealType } from "@/lib/types";

// Only the guarded Preview check supplies a fixed clock. Normal hall entry uses
// the browser's current instant, interpreted by the shared Rutgers schedule.
export const MealEntryClock = createContext<string | null>(null);

export function useMealSelection(menu: DailyMenu | null, initialMeal?: MealType) {
  const clock = useContext(MealEntryClock);
  const context = `${menu?.hallId ?? ""}:${menu?.date ?? ""}`;
  const entryContext = useRef<string | null>(null);
  // Keep the server's hint for matching hydration, then resolve once at entry.
  // A prefetched/server-rendered breakfast can be hours old by navigation time.
  const [choice, setChoice] = useState<MealType>(() => initialMeal ?? (menu ? getDefaultMealType(menu) : "breakfast"));
  const selectedMeal = menu?.meals.some((meal) => meal.type === choice)
    ? choice : menu ? getDefaultMealType(menu, clock ? new Date(clock) : new Date()) : choice;

  useEffect(() => {
    if (!menu) return;
    if (entryContext.current !== context) {
      entryContext.current = context;
      setChoice(getDefaultMealType(menu, clock ? new Date(clock) : new Date()));
    } else if (choice !== selectedMeal) {
      setChoice(selectedMeal);
    }
  }, [context, menu, clock, choice, selectedMeal]);

  function setSelectedMeal(meal: MealType) {
    // A click replayed during hydration wins over the entry effect as well.
    entryContext.current = context;
    setChoice(meal);
  }

  return { selectedMeal, setSelectedMeal };
}

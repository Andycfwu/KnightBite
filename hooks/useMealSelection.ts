"use client";

import { useEffect, useRef, useState } from "react";
import { getDefaultMealType } from "@/lib/menu-helpers";
import type { DailyMenu, MealType } from "@/lib/types";

export function useMealSelection(menu: DailyMenu | null, initialMeal?: MealType) {
  const context = `${menu?.hallId ?? ""}:${menu?.date ?? ""}`;
  const entryContext = useRef(context);
  const [choice, setSelectedMeal] = useState<MealType>(() => initialMeal ?? (menu ? getDefaultMealType(menu) : "breakfast"));
  const selectedMeal = menu?.meals.some((meal) => meal.type === choice)
    ? choice : menu ? getDefaultMealType(menu) : choice;

  useEffect(() => {
    // Refreshes/search/plate changes must not reset a deliberate selection.
    if (entryContext.current !== context) {
      entryContext.current = context;
      setSelectedMeal(initialMeal ?? (menu ? getDefaultMealType(menu) : "breakfast"));
    } else if (choice !== selectedMeal) {
      setSelectedMeal(selectedMeal);
    }
  }, [context, menu, initialMeal, choice, selectedMeal]);

  return { selectedMeal, setSelectedMeal };
}

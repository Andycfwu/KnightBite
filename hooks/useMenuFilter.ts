"use client";

import { useEffect, useMemo, useState } from "react";

import { useMealSelection } from "@/hooks/useMealSelection";
import { DailyMenu, MealSection, MealType } from "@/lib/types";

export function useMenuFilter(menu: DailyMenu, initialMeal?: MealType) {
  const { selectedMeal, setSelectedMeal } = useMealSelection(menu, initialMeal);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery("");
  }, [menu.hallId, menu.date]);

  const filteredMeal = useMemo<MealSection | null>(() => {
    const meal = menu.meals.find((entry) => entry.type === selectedMeal);

    if (!meal) {
      return null;
    }

    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
      return meal;
    }

    return {
      ...meal,
      stations: meal.stations
        .map((station) => ({
          ...station,
          items: station.items.filter((item) => {
            const haystack = [
              item.name,
              item.stationName,
              item.servingSize,
              ...(item.tags ?? []),
              ...(item.ingredients ?? [])
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return haystack.includes(trimmedQuery);
          })
        }))
        .filter((station) => station.items.length > 0)
    };
  }, [menu.meals, query, selectedMeal]);

  const resultCount = useMemo(() => {
    if (!filteredMeal) return 0;

    return filteredMeal.stations.reduce((count, station) => count + station.items.length, 0);
  }, [filteredMeal]);

  return {
    selectedMeal,
    setSelectedMeal,
    query,
    setQuery,
    filteredMeal,
    resultCount
  };
}

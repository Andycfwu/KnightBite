"use client";

import { useEffect, useMemo, useState } from "react";

import { getDefaultMealType } from "@/lib/menu";
import { DailyMenu, MealSection, MealType } from "@/lib/types";

export function useMenuFilter(menu: DailyMenu) {
  const [selectedMeal, setSelectedMeal] = useState<MealType>(getDefaultMealType(menu));
  const [query, setQuery] = useState("");

  useEffect(() => {
    setSelectedMeal(getDefaultMealType(menu));
    setQuery("");
  }, [menu]);

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

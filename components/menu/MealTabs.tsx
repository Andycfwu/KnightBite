"use client";

import { Button } from "@/components/ui/Button";
import { MEAL_LABELS } from "@/lib/constants";
import { MealType } from "@/lib/types";

type MealTabsProps = {
  meals: MealType[];
  selectedMeal: MealType;
  onSelectMeal: (meal: MealType) => void;
};

export function MealTabs({ meals, selectedMeal, onSelectMeal }: MealTabsProps) {
  return (
    <div className="hide-scrollbar -mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <div className="inline-flex min-w-full gap-2 rounded-2xl bg-sand/75 p-1 sm:min-w-max">
        {meals.map((meal) => (
          <Button
            key={meal}
            type="button"
            variant={selectedMeal === meal ? "primary" : "secondary"}
            size="sm"
            className={`min-w-[6.5rem] rounded-xl ${
              selectedMeal === meal
                ? "shadow-[0_8px_18px_rgba(23,23,23,0.14)]"
                : "border-transparent bg-transparent text-ink/70 hover:bg-white hover:text-ink"
            }`}
            onClick={() => onSelectMeal(meal)}
          >
            {MEAL_LABELS[meal]}
          </Button>
        ))}
      </div>
    </div>
  );
}

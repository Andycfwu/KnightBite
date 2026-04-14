"use client";

import { MEAL_LABELS } from "@/lib/constants";
import { MealType } from "@/lib/types";
import { cn } from "@/lib/utils";

type MealTabsProps = {
  meals: MealType[];
  selectedMeal: MealType;
  onSelectMeal: (meal: MealType) => void;
};

export function MealTabs({ meals, selectedMeal, onSelectMeal }: MealTabsProps) {
  return (
    <div className="rounded-[24px] border border-black/10 bg-white p-1.5 shadow-[0_12px_28px_rgba(23,23,23,0.06)]">
      <div className="grid grid-cols-3 gap-1.5">
        {meals.map((meal) => {
          const active = selectedMeal === meal;

          return (
            <button
              key={meal}
              type="button"
              onClick={() => onSelectMeal(meal)}
              className={cn(
                "rounded-[18px] px-3 py-3 text-[1.05rem] font-medium tracking-[-0.03em] transition",
                active
                  ? "bg-brand text-white shadow-[0_10px_22px_rgba(177,31,36,0.26)]"
                  : "text-ink hover:bg-[#f5f5f5]"
              )}
            >
              {MEAL_LABELS[meal]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

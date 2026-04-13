"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { hasMeaningfulNutrition } from "@/lib/nutrition";
import { MenuItem } from "@/lib/types";

type MenuItemRowProps = {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  onViewDetails?: (item: MenuItem) => void;
};

export function MenuItemRow({ item, onAdd, onViewDetails }: MenuItemRowProps) {
  const [justAdded, setJustAdded] = useState(false);
  const hasNutrition = hasMeaningfulNutrition(item.nutrition);
  const isVariableNutrition = item.isCustom || !hasNutrition;
  const trustNote = item.isCustom
    ? item.description ?? "Nutrition varies based on your selections"
    : !hasNutrition
      ? item.description ?? "Nutrition may be incomplete"
      : null;
  const visibleTags = (item.tags ?? []).filter((tag) => !["custom", "build-your-own"].includes(tag.toLowerCase()));

  useEffect(() => {
    if (!justAdded) return;

    const timer = window.setTimeout(() => setJustAdded(false), 700);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

  const handleAdd = () => {
    onAdd(item);
    setJustAdded(true);
  };

  return (
    <Card className={`rounded-[22px] px-4 py-3 sm:px-5 ${justAdded ? "ring-1 ring-brand/30" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h4 className="text-[15px] font-semibold leading-5 text-ink sm:text-base">{item.name}</h4>
            {item.isCustom ? <Badge variant="custom">Custom</Badge> : null}
            {visibleTags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="muted">
                {tag}
              </Badge>
            ))}
          </div>
          <p className="mt-1 text-[13px] text-ink/55">{item.servingSize ?? "Serving size unavailable"}</p>
          {trustNote ? <p className="mt-1.5 text-[12px] leading-5 text-ink/52">{trustNote}</p> : null}
          {isVariableNutrition ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-ink/65">
              <InfoPill label="Nutrition" value={item.isCustom ? "Varies" : "Limited"} />
              {item.nutrition.calories > 0 ? <InfoPill label="Cal" value={item.nutrition.calories} primary /> : null}
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-ink/65">
              <InfoPill label="Cal" value={item.nutrition.calories} primary />
              <InfoPill label="P" value={`${item.nutrition.protein}g`} />
              <InfoPill label="C" value={`${item.nutrition.carbs}g`} />
              <InfoPill label="F" value={`${item.nutrition.fat}g`} />
            </div>
          )}
        </div>
        <div className="relative shrink-0">
          <Button type="button" size="sm" className="shrink-0" onClick={handleAdd}>
            Add
          </Button>
          <span
            className={`pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 text-xs font-semibold text-brand transition ${
              justAdded ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
            }`}
          >
            +1
          </span>
        </div>
      </div>

      {onViewDetails && (item.ingredients?.length || item.allergens?.length) ? (
        <button type="button" onClick={() => onViewDetails(item)} className="mt-3 text-sm font-medium text-brand">
          View details
        </button>
      ) : null}
    </Card>
  );
}

function InfoPill({
  label,
  value,
  primary = false
}: {
  label: string;
  value: string | number;
  primary?: boolean;
}) {
  return (
    <div
      className={`rounded-full px-2 py-0.5 text-[11px] sm:px-2.5 ${
        primary ? "bg-ink text-white" : "bg-sand text-ink/72"
      }`}
    >
      <span className={`mr-1 ${primary ? "text-white/72" : "text-ink/45"}`}>{label}</span>
      <span className={`font-medium ${primary ? "text-white" : "text-ink"}`}>{value}</span>
    </div>
  );
}

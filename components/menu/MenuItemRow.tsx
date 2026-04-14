"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { hasMeaningfulNutrition } from "@/lib/nutrition";
import { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";

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

    const timer = window.setTimeout(() => setJustAdded(false), 650);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

  const handleAdd = () => {
    onAdd(item);
    setJustAdded(true);
  };

  return (
    <Card className={cn("rounded-[28px] border-white/80 px-4 py-4", justAdded && "ring-2 ring-brand/15")}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="line-clamp-2 text-[1.08rem] font-semibold leading-[1.15] tracking-[-0.04em] text-ink">
                {item.name}
              </h4>
              <p className="mt-1 text-sm text-ink/46">{item.servingSize ?? "Serving size unavailable"}</p>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/6 bg-white text-[2rem] font-light text-ink shadow-[0_10px_18px_rgba(23,23,23,0.06)] transition hover:bg-black/[0.02] active:scale-95"
              aria-label={`Add ${item.name}`}
            >
              +
              <span
                className={cn(
                  "pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs font-semibold text-brand transition",
                  justAdded ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
                )}
              >
                +1
              </span>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isVariableNutrition ? (
              <>
                <MacroPill label="Nutrition" value={item.isCustom ? "Varies" : "Limited"} />
                {item.nutrition.calories > 0 ? <MacroPill label="kcal" value={item.nutrition.calories} primary /> : null}
              </>
            ) : (
              <>
                <MacroPill label="kcal" value={item.nutrition.calories} primary />
                <MacroPill label="Protein" value={`${item.nutrition.protein}g`} dark />
                {item.nutrition.carbs > 0 ? <MacroPill label="Carbs" value={`${item.nutrition.carbs}g`} /> : null}
              </>
            )}
            {item.isCustom ? <Badge variant="custom">Custom</Badge> : null}
            {visibleTags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="muted" className="bg-black/[0.05] text-ink/56">
                {tag}
              </Badge>
            ))}
          </div>

          {trustNote ? <p className="mt-2 text-[13px] leading-5 text-ink/48">{trustNote}</p> : null}
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

function MacroPill({
  label,
  value,
  primary = false,
  dark = false
}: {
  label: string;
  value: string | number;
  primary?: boolean;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl px-3 py-1.5 text-[0.95rem] font-medium tracking-[-0.02em]",
        primary && "bg-[linear-gradient(180deg,#d81f3e,#b4112d)] text-white",
        dark && "bg-black text-white",
        !primary && !dark && "bg-black/[0.05] text-ink/72"
      )}
    >
      <span className={cn("mr-1", primary || dark ? "text-white/72" : "text-ink/48")}>{value}</span>
      <span>{label}</span>
    </div>
  );
}

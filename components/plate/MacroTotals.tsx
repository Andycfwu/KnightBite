import { Nutrition } from "@/lib/types";
import { cn } from "@/lib/utils";

type MacroTotalsProps = {
  totals: Nutrition;
  goals?: {
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  variant?: "grid" | "inline";
};

export function MacroTotals({ totals, goals, variant = "grid" }: MacroTotalsProps) {
  if (variant === "inline") {
    return (
      <p className="text-sm font-medium text-ink/62">
        <span className="font-semibold text-ink">{Math.round(totals.calories)} cal</span>
        {" • "}
        {Math.round(totals.protein)}g protein
        {" • "}
        {Math.round(totals.carbs)}g carbs
        {" • "}
        {Math.round(totals.fat)}g fat
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      <MacroCard
        label="Protein"
        value={Math.round(totals.protein)}
        color="bg-[#5b9cff]"
        goal={goals?.protein}
        maxValue={goals?.protein ?? Math.max(Math.round(totals.protein), Math.round(totals.carbs), Math.round(totals.fat), 1)}
      />
      <MacroCard
        label="Carbs"
        value={Math.round(totals.carbs)}
        color="bg-[#65c48b]"
        goal={goals?.carbs}
        maxValue={goals?.carbs ?? Math.max(Math.round(totals.protein), Math.round(totals.carbs), Math.round(totals.fat), 1)}
      />
      <MacroCard
        label="Fat"
        value={Math.round(totals.fat)}
        color="bg-[#ffcf4d]"
        goal={goals?.fat}
        maxValue={goals?.fat ?? Math.max(Math.round(totals.protein), Math.round(totals.carbs), Math.round(totals.fat), 1)}
      />
    </div>
  );
}

function MacroCard({
  label,
  value,
  color,
  maxValue,
  goal
}: {
  label: string;
  value: number;
  color: string;
  maxValue: number;
  goal?: number;
}) {
  const ratio = Math.max(value / maxValue, 0.1);

  return (
    <div className="rounded-[24px] border border-black/6 bg-white px-4 py-4 shadow-[0_12px_28px_rgba(23,23,23,0.06)]">
      <p className="text-[1rem] font-semibold tracking-[-0.04em] text-ink">{label}</p>
      <p className="mt-1 text-[1.05rem] font-semibold tracking-[-0.03em] text-ink">{value}g</p>
      <div className="mt-4 h-3 rounded-full bg-[#e6e9ef]">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${ratio * 100}%` }} />
      </div>
      <p className="mt-3 text-[0.85rem] text-ink/46">{goal ? `Goal ${goal}g` : "Current total"}</p>
    </div>
  );
}

import { Nutrition } from "@/lib/types";

type MacroTotalsProps = {
  totals: Nutrition;
  variant?: "grid" | "inline";
};

export function MacroTotals({ totals, variant = "grid" }: MacroTotalsProps) {
  if (variant === "inline") {
    return (
      <p className="text-sm font-medium text-ink/72">
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
    <div className="grid grid-cols-2 gap-3">
      <MacroCard label="Calories" value={Math.round(totals.calories)} unit="" />
      <MacroCard label="Protein" value={Math.round(totals.protein)} unit="g" />
      <MacroCard label="Carbs" value={Math.round(totals.carbs)} unit="g" />
      <MacroCard label="Fat" value={Math.round(totals.fat)} unit="g" />
      <MacroCard label="Sodium" value={Math.round(totals.sodium ?? 0)} unit="mg" />
    </div>
  );
}

function MacroCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-2xl bg-white/8 px-3 py-3">
      <p className="text-xs uppercase tracking-[0.08em] text-white/58">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white sm:text-xl">
        {value}
        {unit}
      </p>
    </div>
  );
}

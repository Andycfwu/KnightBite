import { Nutrition, PlateTotals } from "@/lib/types";
import { formatNutrient, formatTotal } from "@/lib/nutrition";

type MacroTotalsProps = {
  totals: Nutrition;
  goals?: { protein?: number; carbs?: number; fat?: number };
  variant?: "grid" | "inline";
};

export function MacroTotals({ totals, goals, variant = "grid" }: MacroTotalsProps) {
  if (variant === "inline") return <p className="text-sm font-medium text-ink/70">
    <span className="font-semibold text-ink">{formatTotal(totals, "calories", " cal")}</span>
    {" • "}{formatTotal(totals, "protein", "g")} protein
    {" • "}{formatTotal(totals, "carbs", "g")} carbs
    {" • "}{formatTotal(totals, "fat", "g")} fat
  </p>;

  return <section className="plate-macroGrid" aria-label="Plate macro totals">
    {([['protein', 'Protein'], ['carbs', 'Carbs'], ['fat', 'Fat']] as const).map(([key, label]) => {
      const value = totals[key];
      const goal = goals?.[key];
      const hasGoal = goal !== undefined && goal > 0;
      const percent = hasGoal && value !== null ? Math.round(value / goal * 100) : null;
      const coverage = (totals as Partial<PlateTotals>).coverage?.[key];
      return <div key={key} className={`plate-macroCard nutrient-${key}`}>
        <div className="plate-macroHeading"><h2>{label}</h2><span className="plate-nutrientDot" /></div>
        <p className="plate-macroValue">{coverage?.missing && value !== null ? <small className="plate-subtotalLabel">Known subtotal: </small> : null}{formatNutrient(value, "g")} {hasGoal ? <span>/ {goal}g</span> : null}</p>
        {percent !== null ? <div className="plate-macroTrack" aria-hidden="true"><div style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} /></div> : null}
        <p className="plate-macroCaption">{hasGoal ? (percent !== null ? `${coverage?.missing ? "Known amount: " : ""}${percent}% of goal` : `Goal ${goal}g`) : "Current total · no goal set"}</p>
        {hasGoal && value !== null && value > goal ? <p className="plate-coverageNote">{coverage?.missing ? "Known amount " : ""}{Math.round((value - goal) * 10) / 10}g over goal</p> : null}
        {coverage?.missing ? <p className="plate-coverageNote">Unknown for {coverage.missing} serving{coverage.missing === 1 ? "" : "s"}</p> : null}
      </div>;
    })}
  </section>;
}

"use client";

import Link from "next/link";
import { AccountLayout } from "@/components/layout/AccountLayout";
import { MacroTotals } from "@/components/plate/MacroTotals";
import { PlateItemRow } from "@/components/plate/PlateItemRow";
import { DiningIcon } from "@/components/ui/DiningIcon";
import { NutritionDisclaimer } from "@/components/ui/NutritionDisclaimer";
import { PlateIcon } from "@/components/ui/PlateIcon";
import { usePlate } from "@/hooks/usePlate";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { hasCompleteNutrition, formatTotal } from "@/lib/nutrition";

export function PlateScreen() {
  const plate = usePlate();
  const { parsedMacroGoals } = useUserPreferences();
  const showDisclaimer = plate.plate.items.some((item) => item.isCustom || !hasCompleteNutrition(item.nutrition));
  return (
    <AccountLayout active="plate">
      <div className="account-pageHeading">
        <div><p className="account-eyebrow">YOUR MEAL, AT A GLANCE</p><h1>My Plate Summary</h1><p>Bring your picks together. Find the balance that works for you.</p></div>
        <Link href="/profile#plate-goals" className="account-secondaryButton"><DiningIcon name="target" />Edit goals</Link>
      </div>
      <section className="plate-overview" aria-label="Plate totals">
        <div className="plate-calorieSummary">
          <span className="plate-summaryIcon"><PlateIcon /></span>
          <div><p className="account-label">{plate.totals.coverage.calories.missing ? "Known calorie subtotal" : "Total calories"}</p>
            <p className="plate-calorieValue">{formatTotal(plate.totals, "calories", " kcal").replace("Known subtotal: ", "")}</p>
            {plate.totals.coverage.calories.missing ? <p className="plate-coverageNote">Unknown for {plate.totals.coverage.calories.missing} serving{plate.totals.coverage.calories.missing === 1 ? "" : "s"}</p> : null}
          </div>
        </div>
        <div className="plate-selectedCount"><span className="account-label">Selected items</span><strong>{plate.totalItems}<small>item{plate.totalItems === 1 ? "" : "s"}</small></strong></div>
        <div className="plate-sessionNote"><span className="account-dot" /><p>Your plate is temporary and clears on reload. Items keep the nutrition shown when added.</p></div>
      </section>
      <MacroTotals totals={plate.totals} goals={parsedMacroGoals} />
      <div className="plate-detailLayout">
        <section className="plate-itemsSection" aria-labelledby="plate-items-title">
          <div className="account-sectionHeading"><h2 id="plate-items-title">Plate items</h2><span>{plate.plate.items.length} selection{plate.plate.items.length === 1 ? "" : "s"}</span></div>
          {plate.plate.items.length > 0 ? <div className="plate-itemList">{plate.plate.items.map((item) => <PlateItemRow key={item.itemId} item={item} onIncrement={plate.incrementItem} onDecrement={plate.decrementItem} onRemove={plate.removeItem} detailed />)}</div> : (
            <div className="plate-empty"><span><PlateIcon /></span><h3>A good meal starts with a first pick.</h3><p>Your plate is empty right now. Explore a dining hall and add items from its menu.</p><Link href="/#dining-halls" className="account-primaryButton">Explore dining halls<DiningIcon name="arrow" /></Link></div>
          )}
          {plate.plate.items.length > 0 ? <Link href="/#dining-halls" className="plate-addMore"><span aria-hidden="true">＋</span>Add more items from a menu<DiningIcon name="arrow" /></Link> : null}
        </section>
        <aside className="plate-nutritionAside">
          <section className="account-card plate-nutrition" aria-labelledby="nutrition-summary-title">
            <div className="account-cardHeading"><span className="account-cardIcon"><DiningIcon name="chart" /></span><h2 id="nutrition-summary-title">Nutrition breakdown</h2></div>
            <p className="account-cardDescription">Totals for the portions on this plate.</p>
            <dl className="plate-nutritionList">
              {([['calories', 'Calories', ' kcal'], ['protein', 'Protein', ' g'], ['carbs', 'Carbohydrates', ' g'], ['fat', 'Dietary fat', ' g'], ['sodium', 'Sodium', ' mg'], ['sugar', 'Total sugars', ' g']] as const).map(([key, label, unit]) => <div key={key}><dt><span className={`plate-nutrientDot nutrient-${key}`} />{label}</dt><dd>{formatTotal(plate.totals, key, unit)}</dd></div>)}
            </dl>
            {showDisclaimer ? <NutritionDisclaimer className="mt-4" /> : null}
          </section>
          <button type="button" onClick={plate.clearPlate} disabled={plate.totalItems === 0} className="plate-clearButton"><DiningIcon name="trash" />Clear Plate</button>
        </aside>
      </div>
    </AccountLayout>
  );
}

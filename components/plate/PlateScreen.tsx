"use client";

import { MacroTotals } from "@/components/plate/MacroTotals";
import { NutritionDisclaimer } from "@/components/ui/NutritionDisclaimer";
import { usePlate } from "@/hooks/usePlate";
import { hasMeaningfulNutrition } from "@/lib/nutrition";

export function PlateScreen() {
  const plate = usePlate();
  const showDisclaimer = plate.plate.items.some((item) => !hasMeaningfulNutrition(item.nutrition));

  return (
    <main className="space-y-6">
      <section className="space-y-2 pt-1">
        <p className="text-sm text-ink/44">Plate</p>
        <h1 className="text-[3rem] font-semibold leading-none tracking-[-0.06em] text-ink">My Plate Summary</h1>
      </section>

      <MacroTotals totals={plate.totals} />

      <section className="space-y-3">
        <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-ink">Added Items</h2>
        <div className="rounded-[28px] border border-black/6 bg-white px-5 py-3 shadow-[0_16px_36px_rgba(23,23,23,0.07)]">
          {plate.plate.items.length > 0 ? (
            <>
              <div className="divide-y divide-black/8">
                {plate.plate.items.map((item) => (
                  <div key={item.itemId} className="flex items-center gap-3 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-[1rem] font-semibold tracking-[-0.03em] text-ink">{item.name}</p>
                      <p className="mt-1 text-sm text-ink/48">{item.servingSize ?? "1 serving"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center rounded-full bg-[#f1f2f4] p-1">
                        <button
                          type="button"
                          onClick={() => plate.decrementItem(item.itemId)}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-base text-ink/75"
                        >
                          -
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold text-ink">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => plate.incrementItem(item.itemId)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-base shadow-[0_2px_8px_rgba(23,23,23,0.08)]"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => plate.removeItem(item.itemId)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] text-xl text-ink/65"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-4">
                <p className="text-[1.05rem] font-semibold tracking-[-0.03em] text-ink">
                  Total Calories: {Math.round(plate.totals.calories)} kcal
                </p>
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-ink/48">Your plate is empty right now.</p>
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-black/6 bg-white px-5 py-5 shadow-[0_16px_36px_rgba(23,23,23,0.07)]">
        <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-ink">Nutrition Summary</h2>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[1.05rem]">
          <SummaryRow label="Calories" value={`${Math.round(plate.totals.calories)} kcal`} />
          <SummaryRow label="Protein" value={`${Math.round(plate.totals.protein)} g`} />
          <SummaryRow label="Carbs" value={`${Math.round(plate.totals.carbs)} g`} />
          <SummaryRow label="Fat" value={`${Math.round(plate.totals.fat)} g`} />
          <SummaryRow label="Sodium" value={`${Math.round(plate.totals.sodium ?? 0)} mg`} />
        </div>
        {showDisclaimer ? <NutritionDisclaimer className="mt-4" /> : null}
      </section>

      <button
        type="button"
        onClick={plate.clearPlate}
        className="w-full rounded-[20px] border border-black/8 bg-white px-5 py-4 text-[1.05rem] font-medium text-ink shadow-[0_12px_28px_rgba(23,23,23,0.05)]"
      >
        Clear Plate
      </button>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand/12 text-sm font-semibold text-brand">
        {label.charAt(0)}
      </span>
      <div>
        <p className="text-sm text-ink/46">{label}</p>
        <p className="font-medium tracking-[-0.02em] text-ink">{value}</p>
      </div>
    </div>
  );
}

type PlateSummaryProps = {
  totalItems: number;
  totalCalories: number;
};

export function PlateSummary({ totalItems, totalCalories }: PlateSummaryProps) {
  return (
    <div className="space-y-3">
      <div className="mx-auto h-1.5 w-14 rounded-full bg-ink/15" />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[1.6rem] font-semibold tracking-[-0.05em] text-ink">My Plate</p>
          <p className="text-sm text-ink/48">
            {totalItems} item{totalItems === 1 ? "" : "s"} selected
          </p>
        </div>
        <div className="rounded-full bg-brand/8 px-3 py-2 text-sm font-semibold text-brand">
          {Math.round(totalCalories)} kcal
        </div>
      </div>
    </div>
  );
}

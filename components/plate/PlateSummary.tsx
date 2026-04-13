type PlateSummaryProps = {
  totalItems: number;
  totalCalories: number;
};

export function PlateSummary({ totalItems, totalCalories }: PlateSummaryProps) {
  return (
    <div className="space-y-2">
      <div className="mx-auto h-1.5 w-12 rounded-full bg-ink/18" />
      <div className="rounded-[20px] bg-sand/80 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand">Your plate</p>
        <p className="mt-1 text-sm font-medium text-ink">
          {totalItems} item{totalItems === 1 ? "" : "s"} • {Math.round(totalCalories)} cal
        </p>
      </div>
    </div>
  );
}

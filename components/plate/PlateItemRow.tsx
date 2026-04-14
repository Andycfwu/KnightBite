import { PlateItem } from "@/lib/types";

type PlateItemRowProps = {
  item: PlateItem;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  onRemove: (itemId: string) => void;
};

export function PlateItemRow({ item, onIncrement, onDecrement, onRemove }: PlateItemRowProps) {
  return (
    <div className="rounded-[24px] border border-black/6 bg-white px-4 py-3.5 shadow-[0_12px_28px_rgba(23,23,23,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-[1rem] font-semibold leading-5 tracking-[-0.03em] text-ink">{item.name}</p>
          <p className="mt-1 text-[13px] text-ink/46">{item.servingSize ?? "Serving size unavailable"}</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.itemId)}
          className="rounded-full bg-black/[0.04] px-2.5 py-1 text-xs font-medium text-ink/42"
        >
          Remove
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-full bg-[#f0f1f3] p-1">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-ink/75"
            onClick={() => onDecrement(item.itemId)}
          >
            -
          </button>
          <span className="min-w-7 text-center text-sm font-semibold text-ink">{item.quantity}</span>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg text-ink shadow-[0_2px_8px_rgba(23,23,23,0.08)]"
            onClick={() => onIncrement(item.itemId)}
          >
            +
          </button>
        </div>
        <p className="text-sm font-semibold text-ink/70">{Math.round(item.nutrition.calories * item.quantity)} cal</p>
      </div>
    </div>
  );
}

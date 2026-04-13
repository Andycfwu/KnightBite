import { Button } from "@/components/ui/Button";
import { PlateItem } from "@/lib/types";

type PlateItemRowProps = {
  item: PlateItem;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  onRemove: (itemId: string) => void;
};

export function PlateItemRow({ item, onIncrement, onDecrement, onRemove }: PlateItemRowProps) {
  return (
    <div className="rounded-[20px] border border-ink/12 bg-white px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-[15px] font-semibold leading-5 text-ink">{item.name}</p>
          <p className="mt-1 text-[13px] text-ink/52">{item.servingSize ?? "Serving size unavailable"}</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.itemId)}
          className="text-xs font-medium text-ink/38 transition hover:text-ink/55"
        >
          Remove
        </button>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-full border border-ink/10 bg-sand/45">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-base"
            onClick={() => onDecrement(item.itemId)}
          >
            -
          </Button>
          <span className="min-w-7 text-center text-sm font-semibold text-ink">{item.quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-base"
            onClick={() => onIncrement(item.itemId)}
          >
            +
          </Button>
        </div>
        <p className="text-sm font-medium text-ink/70">{Math.round(item.nutrition.calories * item.quantity)} cal</p>
      </div>
    </div>
  );
}

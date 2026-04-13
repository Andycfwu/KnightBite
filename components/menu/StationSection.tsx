import { MenuItemRow } from "@/components/menu/MenuItemRow";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Station, MenuItem } from "@/lib/types";

type StationSectionProps = {
  station: Station;
  onAddItem: (item: MenuItem) => void;
  anchorId?: string;
  sectionRef?: (node: HTMLElement | null) => void;
  active?: boolean;
};

export function StationSection({ station, onAddItem, anchorId, sectionRef, active = false }: StationSectionProps) {
  const customItemCount = station.items.filter((item) => item.isCustom).length;

  return (
    <section
      id={anchorId}
      ref={sectionRef}
      className={`scroll-mt-32 space-y-3 rounded-[22px] border bg-white px-4 py-4 shadow-soft transition sm:px-5 ${
        active ? "border-brand/18 shadow-[0_14px_34px_rgba(177,31,36,0.08)]" : "border-ink/12"
      }`}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-brand/85">Station</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">{station.name}</h3>
          {customItemCount > 0 ? (
            <Badge variant="custom">{customItemCount === station.items.length ? "Build your own" : "Custom"}</Badge>
          ) : null}
        </div>
      </div>

      {station.items.length > 0 ? (
        <div className="space-y-3">
          {station.items.map((item) => (
            <MenuItemRow key={item.id} item={item} onAdd={onAddItem} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No items here right now"
          description="This station does not have posted items for the selected meal."
          compact
        />
      )}
    </section>
  );
}

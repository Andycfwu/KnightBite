import { MenuItemRow } from "@/components/menu/MenuItemRow";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { MenuItem, Station } from "@/lib/types";

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
    <section id={anchorId} ref={sectionRef} className="scroll-mt-[12.5rem] space-y-3.5">
      <div className="flex items-center gap-2">
        <h3 className={`text-[2rem] font-semibold tracking-[-0.05em] text-ink ${active ? "" : "opacity-92"}`}>
          {station.name}
        </h3>
        {customItemCount > 0 ? (
          <Badge variant="custom" className="bg-black/[0.05] text-ink/58">
            {customItemCount === station.items.length ? "Build your own" : "Custom"}
          </Badge>
        ) : null}
      </div>

      {station.items.length > 0 ? (
        <div className="space-y-3.5">
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

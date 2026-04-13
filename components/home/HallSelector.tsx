import type { Route } from "next";

import { HallCard, HallCardStatus } from "@/components/home/HallCard";
import { DiningHall, DiningHallId } from "@/lib/types";

type HallSelectorProps = {
  halls: DiningHall[];
  blurbs: Record<DiningHallId, string>;
  statusByHall?: Partial<Record<DiningHallId, HallCardStatus>>;
};

export function HallSelector({ halls, blurbs, statusByHall }: HallSelectorProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand/85">Choose a hall</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">Today’s dining halls</h2>
        </div>
        <p className="text-sm text-ink/52">{halls.length} options</p>
      </div>
      <div className="grid gap-4">
        {halls.map((hall) => (
          <HallCard
            key={hall.id}
            hall={hall}
            description={blurbs[hall.id]}
            href={`/hall/${hall.id}` as Route}
            status={statusByHall?.[hall.id]}
          />
        ))}
      </div>
    </section>
  );
}

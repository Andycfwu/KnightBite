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
    <section className="grid gap-4 pb-2">
      {halls.map((hall) => (
        <HallCard
          key={hall.id}
          hall={hall}
          description={blurbs[hall.id]}
          href={`/hall/${hall.id}` as Route}
          status={statusByHall?.[hall.id]}
        />
      ))}
    </section>
  );
}

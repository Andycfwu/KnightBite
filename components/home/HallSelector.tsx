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
    <div className="home-hallGrid">
      {halls.map((hall, index) => (
        <HallCard
          key={hall.id}
          hall={hall}
          description={blurbs[hall.id]}
          href={`/hall/${hall.id}` as Route}
          status={statusByHall?.[hall.id]}
          priority={index < 2}
        />
      ))}
    </div>
  );
}

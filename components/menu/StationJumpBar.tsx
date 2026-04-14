"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type StationJumpBarProps = {
  stations: Array<{ id: string; name: string }>;
  activeStationId: string | null;
  onJumpToStation: (stationId: string) => void;
  searchActive?: boolean;
};

export function StationJumpBar({
  stations,
  activeStationId,
  onJumpToStation,
  searchActive = false
}: StationJumpBarProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!activeStationId) return;

    const container = containerRef.current;
    const activePill = pillRefs.current[activeStationId];

    if (!container || !activePill) {
      return;
    }

    const nextLeft = activePill.offsetLeft - container.clientWidth / 2 + activePill.clientWidth / 2;
    container.scrollTo({
      left: Math.max(nextLeft, 0),
      behavior: "smooth"
    });
  }, [activeStationId]);

  if (stations.length <= 1) {
    return null;
  }

  return (
    <div className="sticky top-0 z-20 -mx-1 bg-[#f7f7f4]/92 px-1 pb-2 pt-1 backdrop-blur-xl">
      <div className="hide-scrollbar overflow-x-auto" ref={containerRef}>
        <div className="inline-flex min-w-full gap-2 pb-1 sm:min-w-max">
          {stations.map((station) => {
            const active = station.id === activeStationId;

            return (
              <button
                key={station.id}
                ref={(node) => {
                  pillRefs.current[station.id] = node;
                }}
                type="button"
                onClick={() => onJumpToStation(station.id)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2.5 text-sm font-medium tracking-[-0.02em] transition",
                  active ? "bg-ink text-white shadow-[0_10px_22px_rgba(23,23,23,0.14)]" : "bg-white text-ink/62"
                )}
              >
                {station.name}
              </button>
            );
          })}
        </div>
      </div>
      {searchActive ? <p className="mt-1 px-2 text-[11px] text-ink/40">Filtered stations</p> : null}
    </div>
  );
}

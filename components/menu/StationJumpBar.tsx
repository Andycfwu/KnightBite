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
    if (!activeStationId) {
      return;
    }

    const activePill = pillRefs.current[activeStationId];
    activePill?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest"
    });
  }, [activeStationId]);

  if (stations.length <= 1) {
    return null;
  }

  return (
    <div className="sticky top-3 z-20 -mx-1">
      <div className="rounded-[22px] border border-ink/10 bg-cream/90 px-1 py-1 shadow-[0_10px_28px_rgba(23,23,23,0.08)] backdrop-blur-sm">
        <div className="hide-scrollbar overflow-x-auto" ref={containerRef}>
          <div className="inline-flex min-w-full items-center gap-2 px-1 sm:min-w-max">
            {stations.map((station) => {
              const isActive = station.id === activeStationId;

              return (
                <button
                  key={station.id}
                  ref={(node) => {
                    pillRefs.current[station.id] = node;
                  }}
                  type="button"
                  onClick={() => onJumpToStation(station.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-ink text-white shadow-[0_8px_18px_rgba(23,23,23,0.14)]"
                      : "bg-white/88 text-ink/68 hover:bg-white hover:text-ink"
                  )}
                  aria-pressed={isActive}
                >
                  {station.name}
                </button>
              );
            })}
          </div>
        </div>
        {searchActive ? (
          <p className="px-3 pt-2 text-[11px] text-ink/48">Jumping between filtered stations</p>
        ) : null}
      </div>
    </div>
  );
}

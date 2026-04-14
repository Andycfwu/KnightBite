"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { MealTabs } from "@/components/menu/MealTabs";
import { MenuSearch } from "@/components/menu/MenuSearch";
import { StationJumpBar } from "@/components/menu/StationJumpBar";
import { StationSection } from "@/components/menu/StationSection";
import { PlateDrawer } from "@/components/plate/PlateDrawer";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { NutritionDisclaimer } from "@/components/ui/NutritionDisclaimer";
import { PlateIcon } from "@/components/ui/PlateIcon";
import { useMenuFilter } from "@/hooks/useMenuFilter";
import { usePlate } from "@/hooks/usePlate";
import { MEAL_LABELS } from "@/lib/constants";
import { getAvailableMealTypes } from "@/lib/menu";
import { hasMeaningfulNutrition } from "@/lib/nutrition";
import { DailyMenu, DiningHall } from "@/lib/types";
import { formatDateLabel, formatUpdatedTime } from "@/lib/utils";

type HallMenuViewProps = {
  hall: DiningHall;
  menu: DailyMenu | null;
};

export function HallMenuView({ hall, menu }: HallMenuViewProps) {
  if (!menu) {
    return (
      <main className="space-y-5">
        <HallHeader hall={hall} dateLabel={formatDateLabel(new Date().toISOString().slice(0, 10))} />
        <EmptyState
          title="No menu available right now."
          description="We couldn’t find a menu for this hall right now. Try another hall or check back a little later."
        />
      </main>
    );
  }

  return <HallMenuContent hall={hall} menu={menu} />;
}

function HallMenuContent({ hall, menu }: { hall: DiningHall; menu: DailyMenu }) {
  const plate = usePlate();
  const [plateOpen, setPlateOpen] = useState(false);
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
  const [platePulse, setPlatePulse] = useState(false);
  const previousTotalItemsRef = useRef(plate.totalItems);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const { filteredMeal, query, resultCount, selectedMeal, setQuery, setSelectedMeal } = useMenuFilter(menu);
  const stations = filteredMeal?.stations ?? [];

  const stationNavItems = useMemo(
    () =>
      stations.map((station) => ({
        id: station.id,
        name: station.name
      })),
    [stations]
  );

  const mealHasIncompleteNutrition = useMemo(
    () => stations.some((station) => station.items.some((item) => item.isCustom || !hasMeaningfulNutrition(item.nutrition))),
    [stations]
  );

  useEffect(() => {
    if (plate.totalItems <= previousTotalItemsRef.current) {
      previousTotalItemsRef.current = plate.totalItems;
      return;
    }

    previousTotalItemsRef.current = plate.totalItems;
    setPlatePulse(true);
    const timer = window.setTimeout(() => setPlatePulse(false), 540);
    return () => window.clearTimeout(timer);
  }, [plate.totalItems]);

  useEffect(() => {
    setActiveStationId(stations[0]?.id ?? null);
  }, [stations, selectedMeal, query]);

  useEffect(() => {
    if (stations.length === 0) {
      return;
    }

    let frameId = 0;

    const updateActiveStation = () => {
      const offset = 190;
      let nextActiveId = stations[0]?.id ?? null;

      for (const station of stations) {
        const node = sectionRefs.current[station.id];
        if (!node) continue;

        const rect = node.getBoundingClientRect();
        if (rect.top - offset <= 0) {
          nextActiveId = station.id;
        } else {
          break;
        }
      }

      setActiveStationId((current) => (current === nextActiveId ? current : nextActiveId));
    };

    const onScroll = () => {
      if (frameId) return;

      frameId = window.requestAnimationFrame(() => {
        updateActiveStation();
        frameId = 0;
      });
    };

    updateActiveStation();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [stations]);

  const jumpToStation = (stationId: string) => {
    const target = sectionRefs.current[stationId];
    if (!target) return;

    const topOffset = 178;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - topOffset;
    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth"
    });
    setActiveStationId(stationId);
  };

  return (
    <main className="space-y-5">
      <HallHeader hall={hall} dateLabel={formatDateLabel(menu.date)} isLiveData={menu.isLiveData} lastUpdatedAt={menu.lastUpdatedAt} />

      <section className="space-y-3">
        <MealTabs meals={getAvailableMealTypes(menu)} selectedMeal={selectedMeal} onSelectMeal={setSelectedMeal} />
        <MenuSearch value={query} onChange={setQuery} />
      </section>

      {stations.length > 1 ? (
        <StationJumpBar
          stations={stationNavItems}
          activeStationId={activeStationId}
          onJumpToStation={jumpToStation}
          searchActive={Boolean(query.trim())}
        />
      ) : null}

      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-ink/44">
          {resultCount} item{resultCount === 1 ? "" : "s"} in {MEAL_LABELS[selectedMeal]}
        </p>
      </div>

      {!filteredMeal || filteredMeal.stations.length === 0 ? (
        <EmptyState
          title="No matching items"
          description="Try a different search or switch meals to see what is being served today."
        />
      ) : (
        <section className="space-y-8 pb-24">
          {filteredMeal.stations.map((station) => (
            <StationSection
              key={station.id}
              station={station}
              onAddItem={plate.addItem}
              anchorId={`station-${station.id}`}
              sectionRef={(node) => {
                sectionRefs.current[station.id] = node;
              }}
              active={station.id === activeStationId}
            />
          ))}
        </section>
      )}

      {mealHasIncompleteNutrition ? <NutritionDisclaimer className="px-1 pb-1" /> : null}

      <FloatingPlateButton
        open={plateOpen}
        totalItems={plate.totalItems}
        totalCalories={plate.totals.calories}
        platePulse={platePulse}
        onOpen={() => setPlateOpen(true)}
      />

      <PlateDrawer
        open={plateOpen}
        onOpenChange={setPlateOpen}
        plate={plate.plate}
        totals={plate.totals}
        totalItems={plate.totalItems}
        onIncrement={plate.incrementItem}
        onDecrement={plate.decrementItem}
        onRemove={plate.removeItem}
        onClear={plate.clearPlate}
      />
    </main>
  );
}

function HallHeader({
  hall,
  dateLabel,
  isLiveData,
  lastUpdatedAt
}: {
  hall: DiningHall;
  dateLabel: string;
  isLiveData?: boolean;
  lastUpdatedAt?: string;
}) {
  return (
    <section className="space-y-3 pt-1">
      <div className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_10px_22px_rgba(23,23,23,0.06)]">
          <BackIcon />
        </Link>
        <div className="text-center">
          <h1 className="text-[2.15rem] font-semibold leading-none tracking-[-0.06em] text-ink">{hall.name}</h1>
          <p className="mt-2 text-[1.1rem] text-ink/60">{dateLabel}</p>
        </div>
        <div />
      </div>

      {typeof isLiveData === "boolean" ? (
        <div className="flex items-center justify-center gap-2">
          <Badge variant={isLiveData ? "live" : "fallback"} className="px-3 py-1">
            {isLiveData ? "Live today" : "Backup menu"}
          </Badge>
          {lastUpdatedAt ? <span className="text-sm text-ink/42">Updated {formatUpdatedTime(lastUpdatedAt)}</span> : null}
        </div>
      ) : null}
    </section>
  );
}

function FloatingPlateButton({
  open,
  totalItems,
  totalCalories,
  platePulse,
  onOpen
}: {
  open: boolean;
  totalItems: number;
  totalCalories: number;
  platePulse: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`sheet-transition fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-[28px] border border-white/70 bg-white/96 px-5 py-3.5 shadow-[0_18px_34px_rgba(177,31,36,0.18)] backdrop-blur-xl ${
        open ? "pointer-events-none opacity-0" : "opacity-100"
      } ${platePulse ? "scale-[1.04]" : "scale-100"}`}
      aria-label="Open plate"
    >
      <ChevronUpIcon />
      <span className="flex items-center gap-2 text-[1rem] font-semibold tracking-[-0.03em] text-ink">
        <PlateIcon className="h-[21px] w-[21px]" />
        <span>My Plate:</span>
        <span className="text-brand">{Math.round(totalCalories)} kcal</span>
      </span>
      {totalItems > 0 ? (
        <span className="rounded-full bg-brand/10 px-2 py-1 text-xs font-semibold text-brand">{totalItems}</span>
      ) : null}
    </button>
  );
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m14.5 5-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 14 6-6 6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

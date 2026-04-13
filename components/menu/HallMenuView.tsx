"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { MealTabs } from "@/components/menu/MealTabs";
import { MenuSearch } from "@/components/menu/MenuSearch";
import { StationSection } from "@/components/menu/StationSection";
import { StationJumpBar } from "@/components/menu/StationJumpBar";
import { PlateDrawer } from "@/components/plate/PlateDrawer";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { NutritionDisclaimer } from "@/components/ui/NutritionDisclaimer";
import { useMenuFilter } from "@/hooks/useMenuFilter";
import { usePlate } from "@/hooks/usePlate";
import { HALL_LOCATIONS, MEAL_LABELS } from "@/lib/constants";
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
      <main className="space-y-4 sm:space-y-6">
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
  const [devNotesOpen, setDevNotesOpen] = useState(false);
  const [platePulse, setPlatePulse] = useState(false);
  const [activeStationId, setActiveStationId] = useState<string | null>(null);
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
    const timer = window.setTimeout(() => setPlatePulse(false), 520);
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
      const offset = 150;
      let nextActiveId = stations[0]?.id ?? null;

      for (const station of stations) {
        const node = sectionRefs.current[station.id];
        if (!node) {
          continue;
        }

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
      if (frameId) {
        return;
      }

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
    if (!target) {
      return;
    }

    const topOffset = 132;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - topOffset;
    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth"
    });
    setActiveStationId(stationId);
  };

  return (
    <main className="space-y-4 sm:space-y-5">
      <HallHeader
        hall={hall}
        dateLabel={formatDateLabel(menu.date)}
        isLiveData={menu.isLiveData}
        lastUpdatedAt={menu.lastUpdatedAt}
        totalItems={plate.totalItems}
        onOpenPlate={() => setPlateOpen(true)}
        plateOpen={plateOpen}
        platePulse={platePulse}
        showDevButton={process.env.NODE_ENV !== "production"}
        onToggleDevNotes={() => setDevNotesOpen((current) => !current)}
      />

      <Card className="rounded-[24px] px-4 py-3.5 sm:rounded-[26px] sm:px-5 sm:py-4">
        <div className="flex flex-col gap-3">
          <MealTabs
            meals={getAvailableMealTypes(menu)}
            selectedMeal={selectedMeal}
            onSelectMeal={setSelectedMeal}
          />
          <MenuSearch value={query} onChange={setQuery} />
          <p className="text-sm text-ink/60">
            {resultCount} item{resultCount === 1 ? "" : "s"} in {MEAL_LABELS[selectedMeal]}
          </p>
        </div>
      </Card>

      {stations.length > 1 ? (
        <StationJumpBar
          stations={stationNavItems}
          activeStationId={activeStationId}
          onJumpToStation={jumpToStation}
          searchActive={Boolean(query.trim())}
        />
      ) : null}

      {process.env.NODE_ENV !== "production" && devNotesOpen ? (
        <Card className="rounded-[20px] border-dashed bg-white/80 px-4 py-3 text-sm text-ink/65 shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand">Dev note</p>
          <p className="mt-2 leading-6">
            Compare a few normalized live items against Rutgers source nutrition to verify custom stations still show
            variable nutrition messaging instead of fixed macros.
          </p>
        </Card>
      ) : null}

      {!filteredMeal || filteredMeal.stations.length === 0 ? (
        <EmptyState
          title="No matching items"
          description="Try a different search or switch meals to see what is being served today."
        />
      ) : (
        <section className="space-y-6 sm:space-y-7">
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

      {mealHasIncompleteNutrition ? (
        <NutritionDisclaimer className="px-1 pb-1" />
      ) : null}

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
  lastUpdatedAt,
  totalItems = 0,
  onOpenPlate,
  plateOpen = false,
  platePulse = false,
  showDevButton = false,
  onToggleDevNotes
}: {
  hall: DiningHall;
  dateLabel: string;
  isLiveData?: boolean;
  lastUpdatedAt?: string;
  totalItems?: number;
  onOpenPlate?: () => void;
  plateOpen?: boolean;
  platePulse?: boolean;
  showDevButton?: boolean;
  onToggleDevNotes?: () => void;
}) {
  return (
    <Card className="rounded-[24px] px-4 py-3.5 sm:rounded-[28px] sm:px-5 sm:py-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-sm font-medium text-brand">
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            {showDevButton && onToggleDevNotes ? (
              <button
                type="button"
                onClick={onToggleDevNotes}
                className="rounded-full border border-ink/10 bg-white px-2.5 py-1.5 text-xs font-medium text-ink/55"
                aria-label="Toggle developer notes"
              >
                Dev
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[1.55rem] font-semibold tracking-tight text-ink sm:text-3xl">{hall.name}</h1>
            <p className="mt-1 text-sm text-ink/52">{HALL_LOCATIONS[hall.id]}</p>
          </div>
          <p className="shrink-0 text-sm text-ink/55">{dateLabel}</p>
        </div>
        {typeof isLiveData === "boolean" ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant={isLiveData ? "live" : "fallback"}>{isLiveData ? "Live" : "Backup"}</Badge>
            <p className="text-sm text-ink/58">
              {isLiveData ? "Rutgers menu data" : "Showing backup menu right now"}
              {lastUpdatedAt ? ` · Updated ${formatUpdatedTime(lastUpdatedAt)}` : ""}
            </p>
          </div>
        ) : null}
      </div>

      {onOpenPlate ? (
        <button
          type="button"
          onClick={onOpenPlate}
          className={`sheet-transition fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-40 flex min-h-14 items-center gap-3 rounded-full border border-ink/12 bg-white px-4 py-3 shadow-[0_18px_34px_rgba(23,23,23,0.14)] sm:right-6 ${
            plateOpen ? "pointer-events-none opacity-0" : "opacity-100"
          } ${
            platePulse ? "scale-[1.06]" : "scale-100"
          }`}
          aria-label="Open plate"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sand text-ink">
            <PlateIcon />
          </span>
          <span className="text-left">
            <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-brand">Plate</span>
            <span className="block text-sm font-medium text-ink">
              {totalItems} item{totalItems === 1 ? "" : "s"}
            </span>
          </span>
          <span className="rounded-full bg-ink px-2 py-1 text-xs font-semibold text-white">
            {Math.min(totalItems, 99)}
          </span>
        </button>
      ) : null}
    </Card>
  );
}

function PlateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 12a8 8 0 1 0 16 0H4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 12a5 5 0 0 1 10 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

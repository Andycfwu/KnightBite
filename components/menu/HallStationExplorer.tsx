"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PlateDrawer } from "@/components/plate/PlateDrawer";
import { PlateIcon } from "@/components/ui/PlateIcon";
import { NutritionDisclaimer } from "@/components/ui/NutritionDisclaimer";
import { usePlate } from "@/hooks/usePlate";
import { groupMapStations, type StationMap } from "@/lib/station-map";
import { MEAL_LABELS } from "@/lib/constants";
import { hasMeaningfulNutrition } from "@/lib/nutrition";
import { formatDateLabel, formatUpdatedTime } from "@/lib/utils";
import type { DailyMenu, MenuItem, MealType, Station } from "@/lib/types";

export function HallStationExplorer({ menu, requestedDate, map }: { menu: DailyMenu | null; requestedDate: string; map: StationMap }) {
  const plate = usePlate();
  const [selectedMeal, setSelectedMeal] = useState<MealType>(menu?.meals[0]?.type ?? "lunch");
  const [selectedZone, setSelectedZone] = useState(map.defaultZone);
  const [view, setView] = useState<"map" | "list">("map");
  const [query, setQuery] = useState("");
  const [plateOpen, setPlateOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const panelRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLElement>(null);
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const meal = menu?.meals.find((entry) => entry.type === selectedMeal) ?? menu?.meals[0];
  const groups = groupMapStations(meal?.stations ?? [], map.zones);
  const activeGroup = groups.find((group) => group.id === selectedZone) ?? groups[0];
  const search = query.trim().toLowerCase();
  const visibleStations = search
    ? (meal?.stations ?? []).map((station) => ({ ...station, items: station.items.filter((item) =>
      [item.name, station.name, ...(item.ingredients ?? []), ...(item.tags ?? [])].join(" ").toLowerCase().includes(search))
    })).filter((station) => station.items.length > 0)
    : view === "list" ? meal?.stations ?? [] : activeGroup.stations;
  const itemCount = visibleStations.reduce((sum, station) => sum + station.items.length, 0);
  const hasIncomplete = visibleStations.some((station) => station.items.some((item) => item.isCustom || !hasMeaningfulNutrition(item.nutrition)));
  const panelTitle = search ? "Search results" : view === "list" ? "All stations" : activeGroup.name;

  useEffect(() => {
    const viewport = mapViewportRef.current;
    const zone = map.zones.find((entry) => entry.id === selectedZone);
    if (!map.minCanvasWidth || !viewport || !zone) return;
    viewport.scrollTo({ left: Math.max(0, viewport.scrollWidth * zone.x / 100 - viewport.clientWidth / 2), behavior: "instant" });
  }, [map, selectedZone, view]);

  function selectZone(id: string) {
    setSelectedZone(id);
    setView("map");
    setQuery("");
    // Keep the selected station's food within reach on smaller screens and move keyboard focus.
    requestAnimationFrame(() => {
      panelRef.current?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width: 859px)").matches) {
        panelRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
      }
    });
  }

  function addItem(item: MenuItem) {
    plate.addItem(item);
    setAnnouncement(`${item.name} added to your plate.`);
  }

  return (
    <main className="livi-page">
      <nav className="livi-topbar" aria-label="Hall navigation">
        <Link href="/" className="livi-back"><span aria-hidden="true">←</span> Dining halls</Link>
        <Link href="/" className="livi-wordmark">knightbite<span>.</span></Link>
        <span className="livi-campus">RUTGERS · NEW BRUNSWICK</span>
      </nav>

      <header className="livi-header">
        <div><p className="livi-eyebrow">{map.campus}</p><h1>{map.name}<span>{map.subtitle}</span></h1></div>
        <div className="livi-dateBlock">
          <p>{formatDateLabel(menu?.date ?? requestedDate)}</p>
          <p className="livi-source"><span className={menu?.isLiveData ? "livi-liveDot" : "livi-unknownDot"} />
            {menu ? menu.isLiveData ? "Listed on today’s menu" : "Sample menu" : "Menu status unavailable"}
          </p>
          {menu?.isLiveData && menu.lastUpdatedAt ? <p className="livi-updated">Retrieved {formatUpdatedTime(menu.lastUpdatedAt)}</p> : null}
        </div>
      </header>

      <div className="livi-toolbar">
        <div className="livi-meals" role="group" aria-label="Choose a meal">
          {(menu?.meals ?? []).map((entry) => <button key={entry.type} type="button" aria-pressed={meal?.type === entry.type}
            onClick={() => { setSelectedMeal(entry.type); setQuery(""); }}>
            {MEAL_LABELS[entry.type]}
          </button>)}
          {!menu ? <span className="livi-unavailableMeal">Today’s station guide</span> : null}
        </div>
        <div className="livi-viewToggle" role="group" aria-label="Menu view">
          <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")}>Explore map</button>
          <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>List view</button>
        </div>
      </div>

      <div className={`livi-workspace ${map.minCanvasWidth ? "livi-wideMapWorkspace" : ""} ${view === "list" ? "livi-listWorkspace" : ""}`}>
        {view === "map" ? <section ref={mapRef} tabIndex={-1} className="livi-mapSection" aria-label={`${map.name} illustrated station guide`}>
          <div className="livi-mapIntro"><span>Find your next bite.</span><span>Tap a station to explore</span></div>
          <div ref={mapViewportRef} className="livi-mapViewport" tabIndex={map.minCanvasWidth ? 0 : undefined}
            role={map.minCanvasWidth ? "region" : undefined} aria-label={map.minCanvasWidth ? `${map.name} map; scroll horizontally to explore` : undefined}>
          <div className={`livi-mapCanvas ${map.compactLabels ? "livi-compactPins" : ""}`}
            style={{ aspectRatio: `${map.image.width} / ${map.image.height}`, minWidth: map.minCanvasWidth }}>
            <Image src={map.image.src} alt={map.image.alt}
              width={map.image.width} height={map.image.height} priority sizes={map.minCanvasWidth ? "(min-width: 1100px) 800px, 680px" : "(min-width: 860px) 650px, 100vw"} className="livi-artwork" />
            {map.zones.flatMap((zone) => [{ x: zone.x, y: zone.y, label: "" }, ...(zone.additionalSpots ?? [])].map((spot, index) => <button key={`${zone.id}-${index}`} type="button" className="livi-mapPin" data-label-side={zone.labelSide}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }} aria-label={`Explore ${zone.name}${spot.label ? `, ${spot.label}` : ""}`}
              aria-pressed={selectedZone === zone.id && !search} aria-controls={`${map.hallId}-food-panel`} onClick={() => selectZone(zone.id)}>
              <span className="livi-pinNumber">{zone.number}</span><span className="livi-pinLabel">{zone.shortName}</span>
            </button>))}
            {map.entrance ? <span className="livi-mapEntrance" style={{ left: `${map.entrance.x}%`, top: `${map.entrance.y}%` }}><span aria-hidden="true">↑</span> Entrance</span> : null}
            <span className="livi-mapCaption">{map.name.toUpperCase()} / STATION GUIDE</span>
          </div>
          </div>
          {map.minCanvasWidth ? <p className="livi-mapScrollHint">Scroll or swipe to explore · Choose a station below for quick access</p> : null}
          <div className="livi-mapFootnote"><span>Approximate station layout</span>
            <a href="https://food.rutgers.edu/places-eat/dining-hall-tour" target="_blank" rel="noreferrer">Rutgers station guide ↗</a>
          </div>
          <div className="livi-legend" aria-label="Choose a serving area">
            {groups.map((group) => <button key={group.id} type="button" aria-pressed={selectedZone === group.id && !search}
              aria-controls={`${map.hallId}-food-panel`} onClick={() => selectZone(group.id)}>
              <span className="livi-legendNumber">{map.zones.find((zone) => zone.id === group.id)?.number ?? "+"}</span>
              <span>{group.name}</span><span className="livi-count">{menu ? group.itemCount : "—"}</span>
            </button>)}
          </div>
        </section> : null}

        <section id={`${map.hallId}-food-panel`} ref={panelRef} tabIndex={-1} className="livi-foodPanel" aria-labelledby={`${map.hallId}-panel-title`}>
          {view === "map" ? <button type="button" className="livi-backToMap" onClick={() => {
            mapRef.current?.focus({ preventScroll: true });
            mapRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
          }}>↑ Back to the station map</button> : null}
          <label className="livi-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search all {map.name} menu items</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find something you’re craving" disabled={!menu} />
          </label>
          <div className="livi-panelHeading"><p className="livi-eyebrow">{meal ? `${MEAL_LABELS[meal.type]} MENU` : "TODAY’S MENU"}</p>
            <h2 id={`${map.hallId}-panel-title`}>{panelTitle}</h2>
            <p>{menu ? `${itemCount} item${itemCount === 1 ? "" : "s"} listed${search ? " across all stations" : ""}` : "Menus could not be confirmed"}</p>
          </div>
          {selectedZone === "other" && !search && view === "map" ? <p className="livi-otherNote">These menu sections don’t have a confirmed spot on our illustration yet.</p> : null}
          {activeGroup.note && !search && view === "map" ? <p className="livi-otherNote">{activeGroup.note}</p> : null}
          <div className="livi-foodList">
            {!menu ? <div className="livi-empty"><span aria-hidden="true">↻</span><h3>Menu unavailable right now.</h3>
              <p>We couldn’t load a menu for this hall for today. Try another hall or check back later.</p><Link href="/">Explore other halls →</Link></div>
              : !itemCount ? <div className="livi-empty"><span aria-hidden="true">⌕</span><h3>{search ? "No matching items" : "No items listed here"}</h3>
                <p>{search ? "Try another food or station name." : "This doesn’t mean the station is closed. Try another station or explore the full menu."}</p>
                <button type="button" onClick={() => { setQuery(""); setView("list"); }}>See all menu items →</button></div>
                : visibleStations.map((station) => <FoodSection key={station.id} station={station} onAdd={addItem} quantities={plate.plate.items} />)}
            {hasIncomplete ? <NutritionDisclaimer className="livi-nutritionNote" /> : null}
          </div>
        </section>
      </div>

      <div className="livi-plateDock">
        <div><PlateIcon className="h-6 w-7" /><span><strong>Your plate</strong><small>{plate.totalItems} item{plate.totalItems === 1 ? "" : "s"} added</small></span></div>
        <button type="button" onClick={() => setPlateOpen(true)} aria-label="Open plate"><span>{Math.round(plate.totals.calories)} kcal</span>View plate <span aria-hidden="true">↗</span></button>
      </div>
      <p role="status" className="sr-only">{announcement}</p>
      <PlateDrawer open={plateOpen} onOpenChange={setPlateOpen} plate={plate.plate} totals={plate.totals} totalItems={plate.totalItems}
        onIncrement={plate.incrementItem} onDecrement={plate.decrementItem} onRemove={plate.removeItem} onClear={plate.clearPlate} />
    </main>
  );
}

function FoodSection({ station, onAdd, quantities }: { station: Station; onAdd: (item: MenuItem) => void; quantities: { itemId: string; quantity: number }[] }) {
  return <section className="livi-foodSection"><h3>{station.name}</h3>
    {station.items.map((item) => {
      const quantity = quantities.find((entry) => entry.itemId === item.id)?.quantity ?? 0;
      const limited = item.isCustom || !hasMeaningfulNutrition(item.nutrition);
      return <article key={item.id} className="livi-foodRow">
        <div><h4>{item.name}</h4><p>{item.servingSize ?? "Serving size not provided"}</p>
          <div className="livi-nutrients">{limited ? <span>{item.isCustom ? "Nutrition varies" : "Nutrition incomplete"}</span>
            : <><span>{item.nutrition.calories} <small>kcal</small></span><span>{item.nutrition.protein}g <small>protein</small></span></>}
          </div>
        </div>
        <button type="button" aria-label={`Add ${item.name}${quantity ? `, ${quantity} already on plate` : ""}`} className={quantity ? "livi-added" : ""} onClick={() => onAdd(item)}>
          {quantity ? <><span className="livi-quantity">{quantity}</span><span aria-hidden="true">+</span></> : "+"}
        </button>
      </article>;
    })}
  </section>;
}

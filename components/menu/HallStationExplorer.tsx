"use client";

import { plateItemIdentity } from "@/lib/plate";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PlateDrawer } from "@/components/plate/PlateDrawer";
import { KnightBiteBrand } from "@/components/layout/KnightBiteBrand";
import { PlateIcon } from "@/components/ui/PlateIcon";
import { DiningIcon } from "@/components/ui/DiningIcon";
import { NutritionDisclaimer } from "@/components/ui/NutritionDisclaimer";
import { usePlate } from "@/hooks/usePlate";
import { diningHalls } from "@/lib/dining-halls";
import { groupMapStations, type StationMap } from "@/lib/station-map";
import { filterMenuStations, matchesMenuFilter, MENU_FILTERS, type MenuFilter } from "@/lib/menu-filters";
import { MEAL_LABELS } from "@/lib/constants";
import { hasMeaningfulNutrition, hasCompleteNutrition, formatNutrient, formatTotal } from "@/lib/nutrition";
import { formatDateLabel, formatUpdatedTime } from "@/lib/utils";
import type { DailyMenu, MenuItem, MealType, Station } from "@/lib/types";

export function HallStationExplorer({ menu, requestedDate, map }: { menu: DailyMenu | null; requestedDate: string; map: StationMap }) {
  const plate = usePlate();
  const [selectedMeal, setSelectedMeal] = useState<MealType>(menu?.meals[0]?.type ?? "lunch");
  const [selectedZone, setSelectedZone] = useState(map.defaultZone);
  const [view, setView] = useState<"map" | "list">("map");
  const [mapExpanded, setMapExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MenuFilter>("all");
  const [plateOpen, setPlateOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const panelRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLElement>(null);
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const foodListRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const hallPickerRef = useRef<HTMLDetailsElement>(null);
  const meal = menu?.meals.find((entry) => entry.type === selectedMeal) ?? menu?.meals[0];
  const groups = groupMapStations(meal?.stations ?? [], map.zones);
  const activeGroup = groups.find((group) => group.id === selectedZone) ?? groups[0];
  const activeZone = map.zones.find((zone) => zone.id === selectedZone);
  const search = query.trim();
  const sourceStations = search || view === "list" ? meal?.stations ?? [] : activeGroup.stations;
  const visibleStations = filterMenuStations(sourceStations, query, filter);
  const availableFilters = MENU_FILTERS.filter((entry) => entry.id === "all" || entry.id === filter ||
    meal?.stations.some((station) => station.items.some((item) => matchesMenuFilter(item, entry.id))));
  const itemCount = visibleStations.reduce((sum, station) => sum + station.items.length, 0);
  const hasIncomplete = visibleStations.some((station) => station.items.some((item) => item.isCustom || !hasCompleteNutrition(item.nutrition)));
  const panelTitle = search ? "Search results" : view === "list" ? "All stations" : activeGroup.name;
  const hallName = diningHalls.find((hall) => hall.id === map.hallId)?.name ?? map.name;
  const displayedGroups = groups.filter((group) => group.id !== "other" || group.itemCount > 0);

  useEffect(() => {
    const viewport = mapViewportRef.current;
    const zone = map.zones.find((entry) => entry.id === selectedZone);
    if (!map.minCanvasWidth || !viewport || !zone) return;
    const centerSelected = () => {
      viewport.scrollTo({ left: Math.max(0, viewport.scrollWidth * zone.x / 100 - viewport.clientWidth / 2), behavior: "instant" });
      const legend = legendRef.current;
      const selected = legend?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
      if (legend && selected && legend.scrollWidth > legend.clientWidth) {
        legend.scrollTo({ left: legend.scrollLeft + selected.getBoundingClientRect().left - legend.getBoundingClientRect().left - 4, behavior: "instant" });
      }
    };
    centerSelected();
    const observer = new ResizeObserver(centerSelected);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [map, selectedZone, view, mapExpanded]);

  useEffect(() => {
    foodListRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [selectedMeal, selectedZone, view, query, filter]);

  useEffect(() => {
    function dismissPicker(event: PointerEvent) {
      if (!hallPickerRef.current?.contains(event.target as Node)) hallPickerRef.current?.removeAttribute("open");
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && hallPickerRef.current?.open) {
        hallPickerRef.current.removeAttribute("open");
        hallPickerRef.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", dismissPicker);
    document.addEventListener("keydown", onEscape);
    return () => { document.removeEventListener("pointerdown", dismissPicker); document.removeEventListener("keydown", onEscape); };
  }, []);

  function focusPanel() {
    requestAnimationFrame(() => {
      panelRef.current?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width: 859px)").matches) {
        panelRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
      }
    });
  }

  function selectZone(id: string) {
    setSelectedZone(id);
    setView("map");
    setQuery("");
    focusPanel();
  }

  function showMap() {
    setView("map");
    setQuery("");
    requestAnimationFrame(() => {
      mapRef.current?.focus({ preventScroll: true });
      mapRef.current?.scrollIntoView({ behavior: "instant", block: "start" });
    });
  }

  function showList() {
    setView("list");
    setQuery("");
    focusPanel();
  }

  function addItem(item: MenuItem) {
    plate.addItem(item);
    const quantity = plate.plate.items.find((entry) => entry.itemId === plateItemIdentity(item))?.quantity ?? 0;
    setAnnouncement(`${item.name} added to your plate. ${quantity + 1} on your plate.`);
  }

  return (
    <main className="livi-page">
      <nav className="livi-topbar" aria-label="Hall navigation">
        <KnightBiteBrand />
        <details ref={hallPickerRef} className="livi-hallPicker">
          <summary><DiningIcon name="pin" /><span><small>Dining location</small><strong>{hallName}</strong></span><DiningIcon name="chevron" /></summary>
          <div className="livi-hallOptions"><p>Choose your dining hall</p>{diningHalls.map((hall) =>
            <Link key={hall.id} href={`/hall/${hall.id}`} aria-current={hall.id === map.hallId ? "page" : undefined}
              onClick={() => hallPickerRef.current?.removeAttribute("open")}><DiningIcon name="pin" /><span>{hall.name}</span>{hall.id === map.hallId ? <span aria-hidden="true">✓</span> : null}</Link>
          )}</div>
        </details>
        <div className="livi-desktopNav">
          <button type="button" aria-pressed={view === "map"} onClick={showMap}>Overview</button>
          <button type="button" aria-pressed={view === "list"} onClick={showList}>Full menu</button>
          <Link href="/">Campus halls</Link>
        </div>
        <div className="livi-navActions">
          <button type="button" className="livi-iconButton" aria-label="Search menu" disabled={!menu} onClick={() => {
            searchRef.current?.focus(); searchRef.current?.scrollIntoView({ behavior: "instant", block: "center" });
          }}><DiningIcon name="search" /></button>
          <button type="button" className="livi-navPlate" onClick={() => setPlateOpen(true)} aria-label="View your plate"><PlateIcon className="h-4 w-5" />Plate<span>{plate.totalItems}</span></button>
          <Link href="/profile" className="livi-profileLink" aria-label="Your profile"><DiningIcon name="user" /></Link>
        </div>
      </nav>

      <div className="livi-content">
        <header className="livi-header">
          <div className="livi-hallHeading"><p className="livi-eyebrow">{map.campus}</p><h1>{hallName}</h1>
            <div className="livi-source"><span className={menu?.isLiveData ? "livi-liveDot" : "livi-unknownDot"} />
              <span>{menu ? menu.isLiveData ? "Listed on today’s menu" : "Sample menu" : "Menu status unavailable"}</span>
              {menu?.isLiveData && menu.lastUpdatedAt ? <span className="livi-updated">Retrieved {formatUpdatedTime(menu.lastUpdatedAt)}</span> : null}
            </div>
          </div>
          <div className="livi-toolbar">
            <p className="livi-date"><DiningIcon name="calendar" />{formatDateLabel(menu?.date ?? requestedDate)}</p>
            <div className="livi-controls">
              <div className="livi-meals" role="group" aria-label="Choose a meal">
                {(menu?.meals ?? []).map((entry) => <button key={entry.type} type="button" aria-pressed={meal?.type === entry.type}
                  onClick={() => { setSelectedMeal(entry.type); setQuery(""); setFilter("all"); }}>{MEAL_LABELS[entry.type]}</button>)}
                {!menu || !menu.meals.length ? <span className="livi-unavailableMeal">Today’s station guide</span> : null}
              </div>
              <div className="livi-viewToggle" role="group" aria-label="Menu view">
                <button type="button" aria-pressed={view === "map"} onClick={showMap}><DiningIcon name="map" />Explore map</button>
                <button type="button" aria-pressed={view === "list"} onClick={showList}><DiningIcon name="list" />List view</button>
              </div>
            </div>
          </div>
        </header>

        <div className={`livi-workspace ${view === "list" ? "livi-listWorkspace" : ""}`}>
          {view === "map" ? <section ref={mapRef} tabIndex={-1} className="livi-mapSection" aria-label={`${map.name} illustrated station guide`}>
            <div className="livi-mapCard">
              <div className="livi-mapIntro"><div><DiningIcon name="map" /><div><h2>Hall layout & stations</h2><p>Pick a station. Find something good.</p></div></div>
                <span className="livi-stationBadge">{map.zones.length}<span> stations</span></span>
              </div>
              <div ref={mapViewportRef} className={`livi-mapViewport ${mapExpanded ? "livi-expandedMap" : ""}`} tabIndex={map.minCanvasWidth ? 0 : undefined}
                style={{ maxWidth: map.maxCanvasWidth, marginInline: map.maxCanvasWidth ? "auto" : undefined }}
                role={map.minCanvasWidth ? "region" : undefined} aria-label={map.minCanvasWidth ? `${map.name} map; scroll horizontally to explore` : undefined}>
                <div className={`livi-mapCanvas ${map.compactLabels ? "livi-compactPins" : ""} ${map.image.height > map.image.width ? "livi-portraitCanvas" : ""}`}
                  style={{ aspectRatio: `${map.image.width} / ${map.image.height}`, minWidth: map.minCanvasWidth }}>
                  <Image src={map.image.src} alt={map.image.alt} width={map.image.width} height={map.image.height} priority
                    sizes={map.minCanvasWidth ? `(min-width: 1100px) ${map.maxCanvasWidth ?? 800}px, ${map.minCanvasWidth}px` : "(min-width: 860px) 750px, 100vw"} className="livi-artwork" />
                  {map.zones.flatMap((zone) => [{ x: zone.x, y: zone.y, label: "" }, ...(zone.additionalSpots ?? [])].map((spot, index) =>
                    <button key={`${zone.id}-${index}`} type="button" className="livi-mapPin" data-label-side={zone.labelSide}
                      style={{ left: `${spot.x}%`, top: `${spot.y}%` }} aria-label={`Explore ${zone.name}${spot.label ? `, ${spot.label}` : ""}`}
                      aria-pressed={selectedZone === zone.id && !search} aria-controls={`${map.hallId}-food-panel`} onClick={() => selectZone(zone.id)}>
                      <span className="livi-pinNumber">{zone.number}</span><span className="livi-pinLabel">{zone.shortName}</span>
                    </button>))}
                  {map.entrance ? <span className="livi-mapEntrance" style={{ left: `${map.entrance.x}%`, top: `${map.entrance.y}%` }}><span aria-hidden="true">↑</span> Entrance</span> : null}
                  {map.entrances?.map((entry, index) => <span key={`entrance-${index}`} className="livi-mapEntrance" style={{ left: `${entry.x}%`, top: `${entry.y}%` }}><span aria-hidden="true">{entry.direction === "right" ? "→" : "↑"}</span> Entrance</span>)}
                  {map.landmarks?.map((landmark) => <span key={landmark.name} className="livi-mapLandmark" style={{ left: `${landmark.x}%`, top: `${landmark.y}%` }}>{landmark.name}</span>)}
                </div>
              </div>
              <div className="livi-mapFootnote"><span>Approximate station layout</span><button type="button" className="livi-expandMap" aria-pressed={mapExpanded} onClick={() => setMapExpanded(!mapExpanded)}><DiningIcon name="target" />{mapExpanded ? "Fit map" : "Expand map"}</button><button type="button" className="livi-centerMap" onClick={() => {
                const viewport = mapViewportRef.current;
                if (viewport) viewport.scrollTo({ left: (viewport.scrollWidth - viewport.clientWidth) / 2, behavior: "instant" });
              }}><DiningIcon name="target" />Center map</button></div>
              {mapExpanded ? <p className="livi-mapScrollHint">Swipe the map to explore · Or choose a station below</p> : null}
            </div>
            <div className="livi-stationsCard">
              <div className="livi-stationsHeading"><div><h2>All stations</h2><p>Your guide to this hall</p></div>
                <a href="https://food.rutgers.edu/places-eat/dining-hall-tour" target="_blank" rel="noreferrer">Rutgers station guide <span aria-hidden="true">↗</span></a>
              </div>
              <div ref={legendRef} className="livi-legend" aria-label="Choose a serving area">
                {displayedGroups.map((group) => <button key={group.id} type="button" aria-pressed={selectedZone === group.id && !search}
                  aria-controls={`${map.hallId}-food-panel`} onClick={() => selectZone(group.id)}>
                  <span className="livi-legendNumber">{map.zones.find((zone) => zone.id === group.id)?.number ?? "+"}</span>
                  <span className="livi-legendName">{group.name}</span><span className="livi-count">{menu ? `${group.itemCount} items` : "—"}</span>
                </button>)}
              </div>
            </div>
            {map.guideNote ? <p className="livi-guideNote">{map.guideNote}</p> : null}
          </section> : null}

          <div className="livi-menuColumn">
            <section id={`${map.hallId}-food-panel`} ref={panelRef} tabIndex={-1} className="livi-foodPanel" aria-labelledby={`${map.hallId}-panel-title`}>
              {view === "map" ? <button type="button" className="livi-backToMap" onClick={showMap}>↑ Back to the station map</button> : null}
              <div className="livi-panelHeader">
                <div className="livi-panelHeading"><div><p className="livi-eyebrow">{meal ? `${MEAL_LABELS[meal.type]} MENU` : "TODAY’S MENU"}{view === "map" && !search && activeZone ? ` · STATION ${activeZone.number}` : ""}</p>
                  <h2 id={`${map.hallId}-panel-title`}>{panelTitle}</h2>
                  <p aria-live="polite">{menu ? `${itemCount} item${itemCount === 1 ? "" : "s"} listed${search ? " across all stations" : ""}` : "Menus could not be confirmed"}</p></div>
                  <span className="livi-panelSymbol">{view === "map" && !search && activeZone ? activeZone.number : <DiningIcon name={search ? "search" : "list"} />}</span>
                </div>
                <label className="livi-search"><DiningIcon name="search" /><span className="sr-only">Search all {map.name} menu items</span>
                  <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search food, stations, ingredients…" disabled={!menu} />
                </label>
                {menu ? <div className="livi-filters" role="group" aria-label="Filter menu items">{availableFilters.map((entry) =>
                  <button key={entry.id} type="button" aria-pressed={filter === entry.id} onClick={() => setFilter(entry.id)}>
                    {entry.id === "vegan" ? <span className="livi-liveDot" /> : null}{entry.label}
                  </button>)}</div> : null}
              </div>
              {selectedZone === "other" && !search && view === "map" ? <p className="livi-otherNote">These menu sections don’t have a confirmed spot on our illustration yet.</p> : null}
              {activeGroup.note && !search && view === "map" ? <p className="livi-otherNote">{activeGroup.note}</p> : null}
              <div ref={foodListRef} className="livi-foodList" tabIndex={itemCount ? 0 : undefined} aria-label={itemCount ? "Menu items" : undefined} role={itemCount ? "region" : undefined}>
                {!menu ? <div className="livi-empty"><DiningIcon name="list" /><h3>Menu unavailable right now.</h3>
                  <p>We couldn’t load a menu for this hall for today. Try another hall or check back later.</p><Link href="/">Explore other halls →</Link></div>
                  : !itemCount ? <div className="livi-empty"><DiningIcon name="search" /><h3>{search || filter !== "all" ? "No matching items" : "No items listed here"}</h3>
                    <p>{search || filter !== "all" ? "Try another search or clear your filter to see more of the menu." : "This doesn’t mean the station is closed. Try another station or explore the full menu."}</p>
                    <button type="button" onClick={() => { setQuery(""); setFilter("all"); setView("list"); }}>See all menu items →</button></div>
                    : visibleStations.map((station) => <FoodSection key={station.id} station={station} onAdd={addItem} quantities={plate.plate.items} />)}
                {hasIncomplete ? <NutritionDisclaimer className="livi-nutritionNote" /> : null}
              </div>
            </section>
            <div className="livi-plateDock" hidden={plateOpen}>
              <div><span className="livi-plateSymbol"><PlateIcon className="h-5 w-6" /></span><span><strong>{plate.totalItems ? `${plate.totalItems} item${plate.totalItems === 1 ? "" : "s"} on your plate` : "Your next bite starts here"}</strong>
                <small>{plate.totalItems ? <><b>{formatTotal(plate.totals, "calories", " kcal")}</b><span> · </span>{formatTotal(plate.totals, "protein", "g")} protein</> : "Add items to build your plate"}</small></span></div>
              <button type="button" onClick={() => setPlateOpen(true)} aria-label="Open plate">View plate <DiningIcon name="arrow" /></button>
            </div>
          </div>
        </div>
        <footer className="livi-footer"><Link href="/" className="livi-footerBrand">KnightBite<span>Rutgers dining, made yours.</span></Link>
          <span>Find your station. Build your plate.</span>
        </footer>
      </div>
      <nav className="livi-mobileNav" aria-label="Dining navigation">
        <button type="button" aria-pressed={view === "map"} onClick={showMap}><DiningIcon name="map" />Explore</button>
        <button type="button" aria-pressed={view === "list"} onClick={showList}><DiningIcon name="list" />Menu</button>
        <button type="button" onClick={() => setPlateOpen(true)}><PlateIcon className="h-5 w-6" />My plate{plate.totalItems > 0 ? <span className="livi-tabCount">{plate.totalItems}</span> : null}</button>
        <Link href="/"><DiningIcon name="halls" />Halls</Link>
      </nav>
      <p role="status" className="sr-only">{announcement}</p>
      <PlateDrawer open={plateOpen} onOpenChange={setPlateOpen} plate={plate.plate} totals={plate.totals} totalItems={plate.totalItems}
        onIncrement={plate.incrementItem} onDecrement={plate.decrementItem} onRemove={plate.removeItem} onClear={plate.clearPlate} />
    </main>
  );
}

function FoodSection({ station, onAdd, quantities }: { station: Station; onAdd: (item: MenuItem) => void; quantities: { itemId: string; quantity: number }[] }) {
  return <section className="livi-foodSection"><h3>{station.name}</h3>
    {station.items.map((item) => {
      const quantity = quantities.find((entry) => entry.itemId === plateItemIdentity(item))?.quantity ?? 0;
      const limited = item.isCustom || !hasMeaningfulNutrition(item.nutrition);
      const tags = MENU_FILTERS.filter((entry) => entry.id !== "all" && entry.id !== "high-protein" && matchesMenuFilter(item, entry.id) &&
        !(entry.id === "vegetarian" && matchesMenuFilter(item, "vegan")));
      return <article key={item.id} className="livi-foodRow">
        <div><div className="livi-foodTitle"><h4>{item.name}</h4>{tags.map((tag) => <span key={tag.id} className={`livi-foodTag ${tag.id === "vegan" || tag.id === "vegetarian" ? "livi-plantTag" : ""}`}>{tag.label}</span>)}</div>
          <p>{item.servingSize ? `Portion: ${item.servingSize}` : "Serving size not provided"}</p>
          <div className="livi-nutrients">{limited ? <span>{item.isCustom ? "Nutrition varies" : "Nutrition incomplete"}</span>
            : <><span>{formatNutrient(item.nutrition.calories)} <small>kcal</small></span><span className="livi-protein">{formatNutrient(item.nutrition.protein, "g")} <small>protein</small></span><span>{formatNutrient(item.nutrition.carbs, "g")} <small>carbs</small></span></>}
          </div>
          {item.ingredients?.length || item.allergens?.length || item.sourceLabels?.length ? <details className="livi-foodDetails"><summary>Ingredients & source labels</summary>
            {item.ingredients?.length ? <p><strong>Ingredients:</strong> {item.ingredients.join(", ")}</p> : null}
            {item.allergens?.length ? <p><strong>Rutgers allergen labels:</strong> {item.allergens.join(", ")}</p> : null}
          {item.sourceLabels?.length ? <p><strong>Other Rutgers labels:</strong> {item.sourceLabels.join(", ")}</p> : null}<p>Missing labels do not establish allergy safety. Check with Rutgers dining staff.</p></details> : null}
        </div>
        <button type="button" aria-label={`Add ${item.name}${quantity ? `, ${quantity} already on plate` : ""}`} className={quantity ? "livi-added" : ""} onClick={() => onAdd(item)}>
          {quantity ? <><span className="livi-quantity">{quantity}</span><span aria-hidden="true">+</span></> : "+"}
        </button>
      </article>;
    })}
  </section>;
}

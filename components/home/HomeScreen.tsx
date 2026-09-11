"use client";

import { formatTotal } from "@/lib/nutrition";
import Link from "next/link";
import { useRef, useState } from "react";
import { HallSelector } from "@/components/home/HallSelector";
import type { HallCardStatus } from "@/components/home/HallCard";
import { KnightBiteBrand } from "@/components/layout/KnightBiteBrand";
import { DiningIcon } from "@/components/ui/DiningIcon";
import { PlateIcon } from "@/components/ui/PlateIcon";
import { usePlate } from "@/hooks/usePlate";
import { HALL_BLURBS } from "@/lib/constants";
import { diningHalls } from "@/lib/dining-halls";
import { matchesHallSearch } from "@/lib/hall-guides";
import type { DiningHallId } from "@/lib/types";
import { formatDateLabel } from "@/lib/utils";

type HomeScreenProps = {
  date: string;
  statusByHall: Partial<Record<DiningHallId, HallCardStatus>>;
};

type HallFilter = "all" | "open" | "confirmed";

export function HomeScreen({ date, statusByHall }: HomeScreenProps) {
  const plate = usePlate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<HallFilter>("all");
  const searchRef = useRef<HTMLInputElement>(null);
  const openCount = diningHalls.filter((hall) => statusByHall[hall.id]?.state === "open").length;
  const confirmedCount = diningHalls.filter((hall) => statusByHall[hall.id]?.menuConfirmed).length;
  const currentMeals = Array.from(new Set(diningHalls.flatMap((hall) => {
    const status = statusByHall[hall.id];
    return status?.state === "open" && status.mealLabel && status.mealLabel !== "Typical hours" ? [status.mealLabel] : [];
  })));
  const visibleHalls = diningHalls.filter((hall) => matchesHallSearch(hall, query) &&
    (filter !== "open" || statusByHall[hall.id]?.state === "open") &&
    (filter !== "confirmed" || statusByHall[hall.id]?.menuConfirmed));
  const filters: { id: HallFilter; label: string; count: number }[] = [
    { id: "all", label: "All halls", count: diningHalls.length },
    { id: "open", label: "Within typical hours", count: openCount },
    { id: "confirmed", label: "Menus confirmed", count: confirmedCount }
  ];

  function resetSearch() {
    setQuery("");
    setFilter("all");
    searchRef.current?.focus();
  }

  return <main className="livi-page home-page">
    <header className="livi-topbar home-topbar">
      <KnightBiteBrand />
      <nav className="home-desktopNav" aria-label="Main navigation">
        <Link href="/" aria-current="page">Campus halls</Link>
        <a href="#dining-halls">Maps & menus</a>
        <Link href="/profile">Nutrition & preferences</Link>
      </nav>
      <div className="home-headerActions">
        <time className="home-headerDate" dateTime={date}><DiningIcon name="calendar" />{formatDateLabel(date)}</time>
        <button type="button" className="livi-iconButton home-searchShortcut" aria-label="Search dining halls" onClick={() => {
          searchRef.current?.focus(); searchRef.current?.scrollIntoView({ behavior: "instant", block: "center" });
        }}><DiningIcon name="search" /></button>
        <Link href="/plate" className="livi-navPlate home-headerPlate" aria-label={`Your plate, ${plate.totalItems} items`}><PlateIcon className="h-4 w-5" /><span className="home-plateLinkText">Your plate</span><span>{plate.totalItems}</span></Link>
        <Link href="/profile" className="livi-profileLink" aria-label="Your profile"><DiningIcon name="user" /></Link>
      </div>
    </header>

    <div className="home-content">
      <section className="home-serviceBar" aria-label="Dining status">
        <div className="home-serviceSummary"><span className={`home-servicePill ${openCount ? "has-service" : ""}`}><span className="home-statusDot" />{currentMeals.length === 1 ? `Typical ${currentMeals[0].toLowerCase()} hours` : "Campus dining"}</span>
          <span className="home-openCount">{openCount} of {diningHalls.length} halls within typical hours<span className="home-scheduleLabel"> · Unverified schedule</span></span>
        </div>
        <p className="home-confirmation"><span className={confirmedCount > 0 ? "livi-liveDot" : "livi-unknownDot"} />{confirmedCount > 0
          ? `${confirmedCount} menu${confirmedCount === 1 ? "" : "s"} confirmed for today`
          : "Menu status could not be confirmed"}</p>
      </section>

      <p className="mt-3 text-xs text-ink/70">Hours are a typical schedule, not live operating status. Weekends, holidays and exceptions may differ. <a className="underline" href="https://food.rutgers.edu/places-eat" target="_blank" rel="noreferrer">Check Rutgers hours</a></p>
      <section className="home-hero" aria-labelledby="home-title">
        <div><p className="livi-eyebrow">RUTGERS · NEW BRUNSWICK</p><h1 id="home-title">Where are you<br className="home-mobileBreak" /> eating today?</h1>
          <p className="home-intro"><span className="home-introLead">Four halls. Plenty to make your own.<br /></span>Find your station, explore the menu, and build your plate.</p>
        </div>
        <div className="home-searchBlock">
          <label htmlFor="home-hall-search" className="home-searchLabel">Find your next stop</label>
          <div className="home-search"><DiningIcon name="search" /><input id="home-hall-search" ref={searchRef} type="search" aria-label="Search halls, campuses, or stations" placeholder="Search halls, campuses, stations…" value={query} onChange={(event) => setQuery(event.target.value)} aria-controls="dining-halls" />
            {query ? <button type="button" aria-label="Clear search" onClick={() => { setQuery(""); searchRef.current?.focus(); }}>×</button> : null}
          </div>
        </div>
      </section>

      <section id="dining-halls" className="home-halls" aria-label="Dining halls">
        <div className="home-filterBar"><div className="home-filters" role="group" aria-label="Filter dining halls">
          {filters.map((entry) => <button key={entry.id} type="button" aria-pressed={entry.id === filter} onClick={() => setFilter(entry.id)}>
            {entry.id === "open" ? <span className="livi-liveDot" /> : null}{entry.label}<span className="home-filterCount">{entry.count}</span>
          </button>)}
        </div><p className="home-resultCount" aria-live="polite">{visibleHalls.length} hall{visibleHalls.length === 1 ? "" : "s"}{query || filter !== "all" ? " found" : " to explore"}</p></div>
        {visibleHalls.length ? <HallSelector halls={visibleHalls} blurbs={HALL_BLURBS} statusByHall={statusByHall} /> :
          <div className="home-empty"><span><DiningIcon name="search" /></span><h2>No halls match your search</h2>
            <p>{filter === "confirmed" && confirmedCount === 0 ? "Menu availability hasn’t been confirmed yet. You can still explore all four station guides." : "Try a hall, campus, or station name, or reset your filters."}</p>
            <button type="button" onClick={resetSearch}>Show all halls<DiningIcon name="arrow" /></button>
          </div>}
      </section>

      <section className="home-utilities" aria-label="Your dining tools">
        <Link href="/plate" className="home-utilityCard"><span className="home-utilityIcon"><PlateIcon className="h-6 w-7" /></span>
          <div><h2>Your plate</h2><p>{plate.totalItems ? `${plate.totalItems} item${plate.totalItems === 1 ? "" : "s"} · ${formatTotal(plate.totals, "calories", " kcal")} · ${formatTotal(plate.totals, "protein", "g")} protein` : "Add your picks and see your nutrition totals."}</p></div>
          <span className="home-utilityAction">View plate<DiningIcon name="arrow" /></span>
        </Link>
        <Link href="/profile" className="home-utilityCard"><span className="home-utilityIcon home-utilityGreen"><DiningIcon name="leaf" /></span>
          <div><h2>Nutrition & preferences</h2><p>Set your macro goals and save dietary preferences.</p></div>
          <span className="home-utilityAction">Your profile<DiningIcon name="arrow" /></span>
        </Link>
      </section>
    </div>

    <footer className="home-footer"><div className="home-footerInner">
      <div className="home-footerIntro"><KnightBiteBrand /><p>A little less wondering.<br />A little more enjoying your next meal.</p><span>Made for Rutgers, New Brunswick.</span></div>
      <nav aria-label="Dining hall links"><h2>Explore the halls</h2>{diningHalls.map((hall) => <Link key={hall.id} href={`/hall/${hall.id}`}>{hall.name}</Link>)}</nav>
      <nav aria-label="Dining tools"><h2>Make it yours</h2><Link href="/plate">Your plate & nutrition</Link><Link href="/profile">Goals & preferences</Link><Link href="/profile">Meal account information</Link></nav>
      <div className="home-footerNote"><span>KnightBite · Rutgers dining, made yours.</span><span>Station guides are approximate. Menus may change.</span></div>
    </div></footer>

    <nav className="livi-mobileNav home-mobileNav" aria-label="Main navigation">
      <Link href="/" aria-current="page"><DiningIcon name="halls" />Halls</Link>
      <a href="#dining-halls"><DiningIcon name="map" />Maps & menus</a>
      <Link href="/plate"><PlateIcon className="h-5 w-6" />My plate{plate.totalItems ? <span className="livi-tabCount">{plate.totalItems}</span> : null}</Link>
      <Link href="/profile"><DiningIcon name="user" />Profile</Link>
    </nav>
  </main>;
}

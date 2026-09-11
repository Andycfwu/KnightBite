import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { DiningIcon } from "@/components/ui/DiningIcon";
import { HALL_GUIDES } from "@/lib/hall-guides";
import type { DiningHall } from "@/lib/types";

export type HallCardStatus = {
  state: "open" | "closed";
  menuConfirmed: boolean;
  mealLabel?: string;
  detail: string;
  updatedLabel?: string;
  sourceLabel?: string;
};

type HallCardProps = {
  hall: DiningHall;
  description: string;
  href: Route;
  status?: HallCardStatus;
  priority?: boolean;
};

export function HallCard({ hall, description, href, status, priority = false }: HallCardProps) {
  const map = HALL_GUIDES[hall.id];
  const isOpen = status?.state === "open";

  return <article className="home-hallCard" aria-labelledby={`home-${hall.id}-title`}>
    <Link href={href} className="home-hallLink" aria-label={`Explore ${hall.name} map and menu`} aria-describedby={`home-${hall.id}-meta home-${hall.id}-hours`}>
      <div className="home-mapPreview">
        <Image src={map.image.src} alt={`${map.name} station layout preview`} width={map.image.width} height={map.image.height}
          sizes="(min-width: 1280px) 560px, (min-width: 700px) 45vw, 90vw" priority={priority} className="home-mapImage" />
        <span className="home-campusLabel">{map.campus.replace(/ CAMPUS$/, "")}</span>
        {status ? <span className={`home-openBadge ${isOpen ? "is-open" : "is-closed"}`}><span className="home-statusDot" /><span>{isOpen ? "TYPICAL HOURS" : "OUTSIDE TYPICAL HOURS"}</span>{isOpen && status.mealLabel ? <span className="home-badgeMeal">· {status.mealLabel}</span> : null}</span> : null}
        <span className="home-mapCaption"><DiningIcon name="map" />Station guide</span>
      </div>
      <div className="home-cardBody">
        <div className="home-cardHeading"><h2 id={`home-${hall.id}-title`}>{hall.name}</h2><DiningIcon name="arrow" /></div>
        <div id={`home-${hall.id}-meta`} className="home-stationMeta"><span><DiningIcon name="pin" />{map.zones.length} mapped stations</span><span className="home-cardSource"><span className={status?.menuConfirmed ? "livi-liveDot" : "livi-unknownDot"} />{status?.sourceLabel ?? "Menu status unavailable"}</span></div>
        <p className="home-hallDescription">{description}</p>
        <div id={`home-${hall.id}-hours`} className="home-hours"><p>{status?.detail ?? "Explore the station guide and today’s menu"}</p>{status?.updatedLabel ? <span>{status.updatedLabel}</span> : null}</div>
        <span className="home-exploreButton">Explore map & menu<DiningIcon name="arrow" /></span>
      </div>
    </Link>
  </article>;
}

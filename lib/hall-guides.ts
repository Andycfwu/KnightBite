import { ATRIUM_MAP } from "@/lib/atrium-stations";
import { BUSCH_MAP } from "@/lib/busch-stations";
import { LIVINGSTON_MAP } from "@/lib/livingston-stations";
import { NEILSON_MAP } from "@/lib/neilson-stations";
import type { StationMap } from "@/lib/station-map";
import type { DiningHall, DiningHallId } from "@/lib/types";

export const HALL_GUIDES: Record<DiningHallId, StationMap> = {
  busch: BUSCH_MAP,
  livingston: LIVINGSTON_MAP,
  neilson: NEILSON_MAP,
  atrium: ATRIUM_MAP
};

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

// Search the same station definitions used by the hall explorer. A matching
// station is a place on the guide, not a claim about today's available food.
export function matchesHallSearch(hall: DiningHall, query: string): boolean {
  const map = HALL_GUIDES[hall.id];
  const haystack = normalizeSearch([
    hall.name, hall.shortName, map.campus,
    ...map.zones.flatMap((zone) => [zone.name, zone.shortName, ...zone.aliases])
  ].join(" "));
  return normalizeSearch(query).split(" ").every((term) => haystack.includes(term));
}

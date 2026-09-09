import type { Station } from "@/lib/types";
import { groupMapStations, type StationGroup, type StationMap } from "@/lib/station-map";

// Concept positions follow the relative counter order in Rutgers' numbered interior photo.
// They are not measured coordinates. Only explicit label aliases are mapped; no fuzzy matches.
// https://food.rutgers.edu/places-eat/dining-hall-tour
export const LIVINGSTON_STATIONS = [
  { id: "pizza", number: "01", name: "Pizza & pasta", shortName: "Pizza & pasta", x: 18, y: 25, aliases: ["pizza & pasta", "pasta station"] },
  { id: "specialty", number: "02", name: "Cook to order", shortName: "Cook to order", x: 39, y: 18, aliases: ["cook to order bar", "omelet bar"] },
  { id: "wok", number: "03", name: "Mongolian grill", shortName: "Mongolian grill", x: 64, y: 18, aliases: ["wok/ mongolian grill", "wok/mongolian grill"] },
  { id: "salad", number: "04", name: "Salad & deli", shortName: "Salad & deli", x: 45, y: 55, aliases: ["salad bar", "salad dressing", "deli bar"] },
  { id: "rotisserie", number: "05", name: "Rotisserie", shortName: "Rotisserie", x: 84, y: 30, aliases: ["rotisserie"] },
  { id: "breakfast", number: "06", name: "Breakfast & dessert", shortName: "Breakfast & dessert", x: 83, y: 57, aliases: ["bagels", "breakfast and dessert", "breakfast & dessert", "desserts"] },
  { id: "vegetables", number: "07", name: "Roasted vegetables", shortName: "Vegetables", x: 79, y: 79, aliases: ["roasted vegetables"] }
] as const;

export type LivingstonStationId = typeof LIVINGSTON_STATIONS[number]["id"];
export type LivingstonGroup = StationGroup<LivingstonStationId>;

export function groupLivingstonStations(stations: Station[]): LivingstonGroup[] {
  return groupMapStations(stations, LIVINGSTON_STATIONS);
}

export const LIVINGSTON_MAP = {
  hallId: "livingston",
  name: "Livingston",
  subtitle: "Dining Commons",
  campus: "LIVINGSTON CAMPUS",
  image: {
    src: "/images/livingston-station-map.png",
    alt: "Illustrated overhead view of Livingston’s serving area, with a central salad island and surrounding counters. Approximate layout.",
    width: 1254,
    height: 1254
  },
  defaultZone: "salad",
  zones: LIVINGSTON_STATIONS
} satisfies StationMap;

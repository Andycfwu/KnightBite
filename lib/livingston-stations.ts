import type { Station } from "@/lib/types";
import { groupMapStations, type StationGroup, type StationMap } from "@/lib/station-map";

// Positions follow the user's September 10 sketch; labels were checked against
// Rutgers' panorama and station guide. Geometry is approximate, not measured.
// https://food.rutgers.edu/places-eat/dining-hall-tour
export const LIVINGSTON_STATIONS = [
  { id: "pizza", number: "01", name: "Pizza & pasta", shortName: "Pizza & pasta", x: 22, y: 28, aliases: ["pizza & pasta", "pasta station"] },
  { id: "specialty", number: "02", name: "Specialty cook to order", shortName: "Daily specialty", x: 44, y: 12, aliases: ["cook to order bar", "omelet bar"] },
  { id: "wok", number: "03", name: "Mongolian grill", shortName: "Mongolian grill", x: 78, y: 26, aliases: ["wok/ mongolian grill", "wok/mongolian grill"] },
  { id: "salad", number: "04", name: "Salad, deli & fruit", shortName: "Salad, deli & fruit", x: 52, y: 43, aliases: ["salad bar", "salad dressing", "deli bar", "fresh fruit"] },
  { id: "rotisserie", number: "05", name: "Rotisserie", shortName: "Rotisserie", x: 77, y: 76, aliases: ["rotisserie"] },
  { id: "breakfast", number: "06", name: "Breakfast & dessert", shortName: "Breakfast & dessert", x: 52, y: 59, aliases: ["bagels", "breakfast and dessert", "breakfast & dessert", "desserts"] },
  { id: "vegetables", number: "07", name: "Roasted vegetables", shortName: "Vegetables", x: 28, y: 79, aliases: ["roasted vegetables"] }
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
    src: "/images/livingston-station-map-v4.png",
    alt: "Approximate overhead Livingston guide following a visitor’s drawing: circular perimeter counters with entrances on the left and bottom, an upper horseshoe-shaped salad, deli and fruit island, a separate small breakfast and dessert island below it, and a vegetable counter on the lower-left perimeter.",
    width: 1415,
    height: 1111
  },
  defaultZone: "salad",
  minCanvasWidth: 680,
  compactLabels: true,
  entrances: [{ x: 16, y: 48, direction: "right" }, { x: 52, y: 91, direction: "up" }],
  landmarks: [],
  zones: LIVINGSTON_STATIONS
} satisfies StationMap;

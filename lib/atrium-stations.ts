import { groupMapStations, type StationMap } from "@/lib/station-map";
import type { Station } from "@/lib/types";

// The user's sketch establishes the footprint and entrance at the bottom.
// Rutgers' panorama identifies the refrigerated center islands, checkout row,
// snack display and R feature wall. See public/images/ATRIUM-MAP.md.
export const ATRIUM_STATIONS = [
  { id: "pizza", number: "01", name: "Pi Pizza", shortName: "Pi Pizza", x: 16.5, y: 31, aliases: ["pi pizza", "pi pizza toppings"] },
  { id: "mezze", number: "02", name: "Mezze", shortName: "Mezze", x: 38.6, y: 15, aliases: ["mezze", "mezze proteins", "mezze bases", "mezze toppings and sides"] },
  { id: "kings", number: "03", name: "King’s Hawaiian", shortName: "King’s Hawaiian", x: 59.6, y: 15, aliases: ["kings hawaiian", "kings hawaiian sides", "kings hawaiian toppings", "king's hawaiian", "king's hawaiian sides", "king's hawaiian toppings"] },
  { id: "chilies", number: "04", name: "Three Chilies", shortName: "Three Chilies", x: 82.7, y: 31, aliases: ["three chilies", "three chilies toppings"] },
  { id: "ginger", number: "05", name: "Scarlet Ginger", shortName: "Scarlet Ginger", x: 82.7, y: 64.3, aliases: ["scarlet ginger", "scarlet ginger noodle bowl"] },
  { id: "salad", number: "06", name: "Soup & salad", shortName: "Soup & salad", x: 17.3, y: 55, aliases: ["salad bar", "soups", "yogurt bar"], note: "This area serves yogurt parfait options in the morning and soup and salad later in the day. Check the selected meal below." },
  { id: "grab-go", number: "07", name: "Grab & go", shortName: "Grab & go", x: 41, y: 53, aliases: ["grab and go", "grab & go", "grab-and-go"], additionalSpots: [{ x: 56.2, y: 53, label: "right refrigerated island" }], note: "The two central refrigerated displays share this menu listing. Packaging and shelf placement may vary." }
] as const;

export function groupAtriumStations(stations: Station[]) {
  return groupMapStations(stations, ATRIUM_STATIONS);
}

export const ATRIUM_MAP = {
  hallId: "atrium",
  name: "The Atrium",
  subtitle: "College Avenue",
  campus: "COLLEGE AVENUE CAMPUS",
  image: {
    src: "/images/atrium-station-map-v3.png",
    alt: "Overhead Atrium station guide based on a visitor’s sketch and Rutgers’ panorama. Entrance directly below the soup and salad counter at the lower left, checkout and a separate exit along the bottom, and a continuous lower walkway extending to Scarlet Ginger at the right wall. Pi Pizza is to the left, Mezze and King’s Hawaiian at the back, Three Chilies to the right, and two refrigerated grab-and-go islands in the center.",
    width: 1355,
    height: 1161
  },
  defaultZone: "pizza",
  minCanvasWidth: 600,
  compactLabels: true,
  entrance: { x: 16.5, y: 76 },
  landmarks: [],
  zones: ATRIUM_STATIONS
} satisfies StationMap;

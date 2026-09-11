import { groupMapStations, type StationMap } from "@/lib/station-map";
import type { Station } from "@/lib/types";

// User sketch rotated 90 degrees clockwise: the right-hand V entrance moves
// to the bottom, preserving handedness. See public/images/NEILSON-MAP.md.
export const NEILSON_STATIONS = [
  { id: "entrees", number: "01", name: "Entrees & sides", shortName: "Entrees & sides", x: 18, y: 72, aliases: ["entrees", "sides"] },
  { id: "specialty", number: "02", name: "Cook to order", shortName: "Cook to order", x: 14, y: 53, aliases: ["cook to order bar", "omelet bar"], note: "Omelettes at breakfast or brunch; changing cook-to-order dishes at lunch and dinner." },
  { id: "asian", number: "03", name: "Asian-inspired cuisine", shortName: "Asian-inspired", x: 14, y: 45, aliases: ["asian inspired cuisine"] },
  { id: "chicken", number: "04", name: "Chicken & rotisserie", shortName: "Chicken", x: 13, y: 33, aliases: ["rotisserie", "grilled chicken"] },
  { id: "plant-cantina", number: "05", name: "Vegan/vegetarian & cantina", shortName: "Plant-based & tacos", x: 20, y: 13, aliases: ["plant-based eats", "cantina", "cantina sides"] },
  { id: "deli", number: "06", name: "Deli", shortName: "Deli", x: 55, y: 10, aliases: ["custom deli bar (kiosk)", "deli bar entree"] },
  { id: "pizza", number: "07", name: "Pizza & pasta", shortName: "Pizza & pasta", x: 82, y: 14, aliases: ["pizza & pasta", "pasta station"] },
  { id: "ice-cream", number: "08", name: "Ice cream", shortName: "Ice cream", x: 87, y: 50, aliases: ["ice cream", "ice cream bar"] },
  { id: "salad", number: "09", name: "Salad bar", shortName: "Salad bar", x: 62, y: 48, aliases: ["salad bar", "salad dressing"] }
] as const;

export function groupNeilsonStations(stations: Station[]) {
  return groupMapStations(stations, NEILSON_STATIONS);
}

export const NEILSON_MAP = {
  hallId: "neilson",
  name: "Neilson",
  subtitle: "Dining Hall",
  campus: "COOK / DOUGLASS CAMPUS",
  image: {
    src: "/images/neilson-station-map.png",
    alt: "Illustrated overhead Neilson layout, rotated from a visitor’s drawing so the V-shaped entrance is at the bottom. Hot-food counters run up the left, deli across the top, pizza and ice cream on the right, and a curved salad island in the center.",
    width: 1086,
    height: 1448
  },
  defaultZone: "salad",
  minCanvasWidth: 500,
  maxCanvasWidth: 540,
  compactLabels: true,
  entrance: { x: 50, y: 94 },
  landmarks: [{ name: "Dietary support", x: 87, y: 74 }],
  guideNote: "Special dietary needs? Ask dining staff for assistance. Dietary support is marked for orientation and has no confirmed menu listing.",
  zones: NEILSON_STATIONS
} satisfies StationMap;

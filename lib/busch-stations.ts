import { groupMapStations, type StationMap } from "@/lib/station-map";
import type { Station } from "@/lib/types";

// Geometry follows the user's September 9 sketch: entrance at the bottom,
// second entree line between cook-to-order and pasta. Positions are approximate.
// The first entree line is typically Asian-inspired according to Rutgers,
// not a promise of a fixed cuisine or a confirmed rotation schedule.
// See public/images/BUSCH-MAP.md for source evidence and mapping limits.
export const BUSCH_STATIONS = [
  { id: "asian", number: "01", name: "Entrees 1", shortName: "Entrees 1", x: 23.5, y: 20.5, aliases: ["asian inspired cuisine"], note: "Usually Asian-inspired, according to Rutgers. Offerings may vary; check the listed menu below." },
  { id: "specialty", number: "02", name: "Cook to order", shortName: "Cook to order", x: 35.2, y: 27.5, aliases: ["cook to order bar", "omelet bar"], note: "Omelettes at breakfast; specialty dishes at lunch and dinner." },
  { id: "entrees", number: "03", name: "Entrees 2", shortName: "Entrees 2", x: 49.2, y: 30, aliases: ["entrees"] },
  { id: "pasta", number: "04", name: "Pasta", shortName: "Pasta", x: 71.8, y: 32, aliases: ["pasta station"] },
  { id: "pizza", number: "05", name: "Pizza & pasta", shortName: "Pizza", x: 85, y: 37, aliases: ["pizza & pasta"] },
  { id: "ice-cream", labelSide: "left", number: "06", name: "Ice cream", shortName: "Ice cream", x: 94.8, y: 44.5, aliases: ["ice cream"] },
  { id: "cantina", number: "07", name: "Taco bar", shortName: "Taco bar", x: 32.2, y: 64.5, aliases: ["cantina", "cantina sides"] },
  { id: "vegetables", number: "08", name: "Vegetables", shortName: "Vegetables", x: 28.2, y: 80, aliases: ["vegetables", "grilled vegetables"] },
  { id: "noodle", labelSide: "left", number: "09", name: "Noodle bar", shortName: "Noodle bar", x: 52.6, y: 55, aliases: ["noodle bar"] },
  { id: "salad", labelSide: "left", number: "10", name: "Salad bar", shortName: "Salad bar", x: 52.5, y: 65.5, aliases: ["salad bar", "salad dressing"] },
  { id: "sides", labelSide: "right", number: "11", name: "Sides", shortName: "Sides", x: 64.3, y: 55, aliases: ["sides"] },
  { id: "fruit", labelSide: "right", number: "12", name: "Fruit", shortName: "Fruit", x: 64.3, y: 65.5, aliases: ["fresh fruit", "fruits", "fruit"], additionalSpots: [{ x: 50.2, y: 86, label: "entrance left" }, { x: 65.8, y: 86, label: "entrance right" }], note: "Find fruit on the central island and at the two stands by the entrance." },
  { id: "sushi", number: "13", name: "Sushi", shortName: "Sushi", x: 58.3, y: 76, aliases: ["sushi", "sushi sides"] },
  { id: "desserts", number: "14", name: "Desserts", shortName: "Desserts", x: 80.5, y: 60.8, aliases: ["desserts", "dessert"] },
  { id: "milk", labelSide: "left", number: "15", name: "Milk", shortName: "Milk", x: 95.3, y: 65.5, aliases: ["milk"] },
  { id: "juice", number: "16", name: "Juice", shortName: "Juice", x: 82, y: 79.5, aliases: ["juice", "juices"] }
] as const;

export function groupBuschStations(stations: Station[]) {
  return groupMapStations(stations, BUSCH_STATIONS);
}

export const BUSCH_MAP = {
  hallId: "busch",
  name: "Busch",
  subtitle: "Dining Hall",
  campus: "BUSCH CAMPUS",
  image: {
    src: "/images/busch-station-map-v2.png",
    alt: "Overhead Busch station illustration based on a visitor’s drawing. Entry from the bottom, zigzag entree counters across the back, taco and vegetable counter on the left, a central U-shaped noodle, salad, sides, fruit and sushi island, and desserts on the right.",
    width: 1586,
    height: 992
  },
  defaultZone: "salad",
  minCanvasWidth: 680,
  compactLabels: true,
  entrance: { x: 58.2, y: 95 },
  zones: BUSCH_STATIONS
} satisfies StationMap;

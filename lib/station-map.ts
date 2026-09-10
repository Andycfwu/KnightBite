import type { DiningHallId, Station } from "@/lib/types";

export type StationZone = {
  id: string;
  number: string;
  name: string;
  shortName: string;
  x: number;
  y: number;
  aliases: readonly string[];
  note?: string;
  labelSide?: "left" | "right";
  additionalSpots?: readonly { x: number; y: number; label: string }[];
};

export type StationMap = {
  hallId: DiningHallId;
  name: string;
  subtitle: string;
  campus: string;
  image: { src: string; alt: string; width: number; height: number };
  defaultZone: string;
  zones: readonly StationZone[];
  minCanvasWidth?: number;
  maxCanvasWidth?: number;
  compactLabels?: boolean;
  entrance?: { x: number; y: number };
  entrances?: readonly { x: number; y: number; direction: "up" | "right" }[];
  landmarks?: readonly { name: string; x: number; y: number }[];
  guideNote?: string;
};

export type StationGroup<Id extends string = string> = {
  id: Id | "other";
  name: string;
  stations: Station[];
  itemCount: number;
  note?: string;
};

// Match upstream section labels, never food names or dietary tags. Unknown sections
// stay visible once under More stations. Grouping retains the original food objects.
export function groupMapStations<Id extends string>(stations: Station[], zones: readonly (StationZone & { id: Id })[]): StationGroup<Id>[] {
  const groups: StationGroup<Id>[] = zones.map(({ id, name, note }) => ({ id, name, note, stations: [], itemCount: 0 }));
  groups.push({ id: "other", name: "More stations", stations: [], itemCount: 0 });
  for (const station of stations) {
    const name = station.name.trim().replace(/\s+/g, " ").toLowerCase();
    const match = zones.find((zone) => zone.aliases.includes(name));
    const group = groups.find((entry) => entry.id === (match?.id ?? "other"))!;
    group.stations.push(station);
    group.itemCount += station.items.length;
  }
  return groups;
}

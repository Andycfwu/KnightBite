import type { DiningHallId, MealType } from "@/lib/types";
import { getRutgersNowParts } from "@/lib/utils";

// Existing typical hall hours; not live operating or individual station hours.
export const SERVICE_WINDOWS: Record<
  DiningHallId,
  {
    breakfast?: [number, number];
    lunch?: [number, number];
    dinner?: [number, number];
  }
> = {
  livingston: { breakfast: [7, 10.5], lunch: [11, 15], dinner: [16.5, 21] },
  busch: { breakfast: [7, 10.5], lunch: [11, 15], dinner: [16.5, 21] },
  neilson: { breakfast: [7.5, 10], lunch: [11.5, 14.5], dinner: [16.5, 20] },
  atrium: { breakfast: [8, 10.5], lunch: [11, 15], dinner: [16.5, 21] }
};


export function getSuggestedMeal(hallId: DiningHallId, now = new Date()): MealType {
  const { hour, minute } = getRutgersNowParts(now);
  const time = (hour % 24) + minute / 60;
  const windows = Object.entries(SERVICE_WINDOWS[hallId]) as [MealType, [number, number]][];
  return (windows.find(([, [start, end]]) => time >= start && time < end)
    ?? windows.find(([, [start]]) => time < start)
    ?? windows[windows.length - 1])[0];
}

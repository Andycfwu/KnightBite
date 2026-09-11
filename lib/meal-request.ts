import { MEAL_ORDER } from './constants';
import { diningHalls } from './dining-halls';
import { getTodayIsoDate } from './utils';
import type { DiningHallId, MealType } from './types';

// Limit the public recovery surface to a small requested-date window. No user-supplied upstream URL.
export function parseMealRequest(hall: string, date: string, meal: string, today = getTodayIsoDate()) {
  if (!diningHalls.some(entry => entry.id === hall) || !MEAL_ORDER.includes(meal as MealType)) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const instant = Date.parse(`${date}T12:00:00Z`);
  if (!Number.isFinite(instant) || new Date(instant).toISOString().slice(0,10) !== date ||
    Math.abs(instant - Date.parse(`${today}T12:00:00Z`)) > 7 * 86_400_000) return null;
  return { hallId: hall as DiningHallId, date, mealType: meal as MealType };
}

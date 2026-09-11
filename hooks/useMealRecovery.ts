"use client";

import { useRef, useState } from 'react';
import { MEAL_ORDER } from '@/lib/constants';
import type { DailyMenu, DiningHallId, MealLoadResult, MealType } from '@/lib/types';

// The guarded Preview scenario can replace transport without changing the production loader.
import { createContext, useContext } from 'react';
export const MealRetryTransport = createContext<((meal: MealType) => Promise<MealLoadResult>) | null>(null);

export function useMealRecovery(source: DailyMenu | null, hallId: DiningHallId, date: string) {
  const override = useContext(MealRetryTransport);
  const context = `${hallId}:${date}`;
  const currentContext = useRef(context);
  currentContext.current = context;
  const [results, setResults] = useState<Partial<Record<MealType, MealLoadResult>>>({});
  const [pending, setPending] = useState<string | null>(null);
  const busy = useRef(false);
  const [message, setMessage] = useState('');
  const retained = Object.values(results).filter(result => result.hallId === hallId && result.date === date);
  const menu: DailyMenu | null = retained.length ? {
    ...(source ?? { hallId, date, hallName: '', meals: [], isLiveData: true }),
    meals: MEAL_ORDER.flatMap(type => {
      const original = source?.meals.find(meal => meal.type === type);
      const recovered = retained.find(result => result.mealType === type)?.section;
      return recovered ?? original ? [recovered ?? original!] : [];
    }),
    mealStatus: { ...source?.mealStatus, ...Object.fromEntries(retained.map(result => [result.mealType, result.status])) }
  } : source;

  async function retry(meal: MealType) {
    if (busy.current) return;
    busy.current = true; setPending(`${context}:${meal}`); setMessage('Trying this meal again…');
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    try {
      timeout = setTimeout(() => controller.abort(), 12_000);
      const result = override ? await override(meal) : await (async () => {
        const response = await fetch(`/api/menu/${hallId}/${date}/${meal}`, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Meal retry failed');
        return await response.json() as MealLoadResult;
      })();
      if (currentContext.current !== context) return;
      if (result.hallId !== hallId || result.date !== date || result.mealType !== meal ||
        !['available', 'empty', 'unavailable'].includes(result.status?.state) ||
        (result.section && result.section.type !== meal)) throw new Error('Unexpected meal response');
      setResults(previous => ({ ...previous, [meal]: result }));
      setMessage(result.status.state === 'available' ? `${meal} menu loaded.` : result.status.state === 'empty'
        ? `Rutgers returned no items for ${meal} on this date.` : `${meal} menu is still unavailable. Try again after the short cooldown.`);
    } catch {
      if (currentContext.current !== context) return;
      setResults(previous => ({ ...previous, [meal]: { hallId, date, mealType: meal, section: null,
        status: { state: 'unavailable', retryAt: Date.now() + 30_000 } } }));
      setMessage(`${meal} menu is still unavailable. Try again after the short cooldown.`);
    } finally { clearTimeout(timeout); busy.current = false; setPending(null); }
  }
  return { menu, retry, pending: pending?.startsWith(`${context}:`) ? pending : null, message };
}

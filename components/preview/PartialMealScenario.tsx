"use client";
import { useState } from 'react';
import { HallMenuView } from '@/components/menu/HallMenuView';
import { MealEntryClock } from '@/hooks/useMealSelection';
import { MealRetryTransport } from '@/hooks/useMealRecovery';
import type { DailyMenu, DiningHall, MealLoadResult, MealType } from '@/lib/types';

// Only mounted by a Preview-guarded route. No fixtures or upstream traffic on retry.
// Success can expose only food actually returned for this hall/date/meal.
export function PartialMealScenario({ hall, source, date, clock }: {
  hall: DiningHall; source: DailyMenu | null; date: string; clock: string;
}) {
  const [mode, setMode] = useState('success');
  const [revision, setRevision] = useState(0);
  const partial: DailyMenu | null = source ? { ...structuredClone(source),
    meals: source.meals.filter(meal => meal.type === 'breakfast'),
    mealStatus: { breakfast: source.mealStatus?.breakfast, lunch: { state: 'unavailable' }, dinner: { state: 'unavailable' } }
  } : null;
  async function transport(meal: MealType): Promise<MealLoadResult> {
    const chosen = mode;
    await new Promise(resolve => setTimeout(resolve, 1500));
    const section = chosen === 'success' ? source?.meals.find(entry => entry.type === meal) ?? null : null;
    return { hallId: hall.id, date, mealType: meal, section, status: section
      ? source?.mealStatus?.[meal] ?? { state: 'available', retrievedAt: source?.lastUpdatedAt }
      : chosen === 'empty' ? { state: 'empty' } : { state: 'unavailable', retryAt: Date.now() + 30_000 } };
  }
  return <MealEntryClock.Provider value={clock}><MealRetryTransport.Provider value={transport}>
    <aside aria-label="Controlled partial-menu scenario" className="border-b bg-white p-4 text-sm">
      <p>Preview-only controlled partial menu at 6pm America/New_York, {date}. Lunch/Dinner are deliberately hidden initially.
        Retry waits 1.5 seconds and uses the selected controlled outcome; it does not call Rutgers.
        Success reveals only actual returned food for this date. Actual retrieved meals: {source?.meals.map(meal => meal.type).join(', ') || 'none'}.
        A controlled empty result is not evidence of an empty upstream menu. No sample food.</p>
      <label>Next retry outcome <select value={mode} onChange={event => setMode(event.target.value)}>
        <option value="success">Returned source meal</option><option value="failure">Controlled failure</option><option value="empty">Controlled empty</option>
      </select></label>
      <button type="button" className="m-2 rounded border p-2" onClick={() => setRevision(value => value + 1)}>Rerender partial menu</button>
      <span>Render {revision}</span>
    </aside>
    <HallMenuView hall={hall} menu={partial} requestedDate={date} initialMeal="breakfast" />
  </MealRetryTransport.Provider></MealEntryClock.Provider>;
}

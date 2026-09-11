"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MEAL_LABELS } from '@/lib/constants';
import type { MealStatus, MealType } from '@/lib/types';

export function MealUnavailable({ meal, status, pending, onRetry }: {
  meal: MealType; status?: MealStatus; pending: boolean; onRetry: () => void;
}) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    if (!status?.retryAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [status?.retryAt]);
  const seconds = now && status?.retryAt ? Math.max(0, Math.ceil((status.retryAt - now) / 1000)) : 0;
  return <div className="livi-empty">
    <h3>{MEAL_LABELS[meal]} menu unavailable right now.</h3>
    <p>We couldn’t load {meal} for this hall on the requested date. This doesn’t mean the meal or station is closed.</p>
    <button type="button" className="min-h-11 rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60" disabled={pending || seconds > 0} onClick={onRetry} aria-describedby="meal-retry-help">
      {pending ? `Loading ${meal}…` : `Retry ${MEAL_LABELS[meal]}`}
    </button>
    <p id="meal-retry-help">{seconds ? `Try again in ${seconds} seconds.` : 'Retry this meal, choose another meal, or check back later.'}</p>
    <Link href="/">Explore other halls →</Link>
  </div>;
}

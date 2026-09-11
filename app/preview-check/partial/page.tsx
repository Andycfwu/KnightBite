import { notFound } from 'next/navigation';
import { PartialMealScenario } from '@/components/preview/PartialMealScenario';
import { getDiningHall, getHallMenuForDate } from '@/lib/menu';
import { getRutgersNowParts, getTodayIsoDate } from '@/lib/utils';
export const dynamic = 'force-dynamic';
export default async function PartialCheck({ searchParams }: { searchParams: Promise<{ hall?: string }> }) {
  if (process.env.VERCEL_ENV !== 'preview') notFound();
  const hall = getDiningHall((await searchParams).hall ?? 'livingston');
  if (!hall) notFound();
  const date = getTodayIsoDate();
  const menu = await getHallMenuForDate(hall.id, date);
  const clock = new Date(`${date}T12:00:00Z`);
  clock.setUTCHours(12 + 18 - getRutgersNowParts(clock).hour);
  return <PartialMealScenario hall={hall} source={menu} date={date} clock={clock.toISOString()} />;
}

import { HallCardStatus } from "@/components/home/HallCard";
import { RutgersMark } from "@/components/layout/RutgersMark";
import { HallSelector } from "@/components/home/HallSelector";
import { APP_NAME, HALL_BLURBS } from "@/lib/constants";
import { getHallMenuForDate } from "@/lib/menu";
import { diningHalls } from "@/lib/mock-data";
import { DailyMenu, DiningHallId } from "@/lib/types";
import { formatShortDateLabel, formatUpdatedTime, getGreetingForHour, getTodayIsoDate } from "@/lib/utils";

const SERVICE_WINDOWS: Record<
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

function buildHallStatus(hallId: DiningHallId, menu: DailyMenu | null): HallCardStatus {
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  const windows = SERVICE_WINDOWS[hallId];
  const updatedLabel = menu?.lastUpdatedAt ? `Updated ${formatUpdatedTime(menu.lastUpdatedAt)}` : "Updated recently";
  const sourceLabel = menu?.isLiveData ? "Live today" : "Backup menu";

  const openMeal = (Object.entries(windows) as Array<[keyof typeof windows, [number, number] | undefined]>).find(
    ([, range]) => range && hour >= range[0] && hour < range[1]
  );

  if (openMeal) {
    return {
      state: "open",
      mealLabel: openMeal[0].charAt(0).toUpperCase() + openMeal[0].slice(1),
      detail: HALL_BLURBS[hallId],
      updatedLabel,
      sourceLabel
    };
  }

  const nextMeal = (Object.entries(windows) as Array<[keyof typeof windows, [number, number] | undefined]>).find(
    ([, range]) => range && hour < range[0]
  );

  return {
    state: "closed",
    detail: nextMeal
      ? `Opens for ${nextMeal[0]} at ${formatHourLabel(nextMeal[1]![0])}`
      : "Reopens tomorrow morning",
    sourceLabel
  };
}

function formatHourLabel(value: number) {
  const hours = Math.floor(value);
  const minutes = value % 1 === 0 ? 0 : 30;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

async function getHomeHallStatus(hallId: DiningHallId, date: string) {
  try {
    const menu = await Promise.race<DailyMenu | null>([
      getHallMenuForDate(hallId, date),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 1100);
      })
    ]);

    return buildHallStatus(hallId, menu);
  } catch {
    return buildHallStatus(hallId, null);
  }
}

export default async function HomePage() {
  const todayIso = getTodayIsoDate();
  const statusEntries = await Promise.all(
    diningHalls.map(async (hall) => {
      const status = await getHomeHallStatus(hall.id as DiningHallId, todayIso);
      return [hall.id, status] as const;
    })
  );

  const statusByHall = Object.fromEntries(statusEntries);
  const liveCount = statusEntries.filter(([, status]) => status.sourceLabel === "Live today").length;

  return (
    <main className="space-y-6">
      <section className="px-1 pt-1">
        <div className="mb-5 flex items-center gap-3">
          <RutgersMark />
          <div>
            <p className="text-base font-semibold tracking-tight text-ink">{APP_NAME}</p>
            <p className="text-sm font-medium tracking-tight text-ink/46">Rutgers Dining, Reimagined</p>
          </div>
        </div>
        <h1 className="max-w-[10ch] text-[3rem] font-semibold leading-[0.96] tracking-[-0.05em] text-ink">
          {getGreetingForHour()} Scarlet Knight
        </h1>
        <p className="mt-3 text-lg text-ink/46">{formatShortDateLabel(todayIso)}</p>
        <div className="mt-5 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm text-ink/60 shadow-[0_12px_26px_rgba(23,23,23,0.06)]">
          <span className="mr-2 inline-flex h-2.5 w-2.5 rounded-full bg-[#34c759]" />
          {liveCount} live menu{liveCount === 1 ? "" : "s"} today
        </div>
      </section>

      <HallSelector halls={diningHalls} blurbs={HALL_BLURBS} statusByHall={statusByHall} />
    </main>
  );
}

import { HallCardStatus } from "@/components/home/HallCard";
import { HallSelector } from "@/components/home/HallSelector";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { APP_NAME, APP_SUBTITLE, HALL_BLURBS } from "@/lib/constants";
import { getHallMenuForDate } from "@/lib/menu";
import { diningHalls } from "@/lib/mock-data";
import { DailyMenu, DiningHallId } from "@/lib/types";
import { formatUpdatedTime, getTodayIsoDate } from "@/lib/utils";

function buildHallStatus(menu: DailyMenu | null): HallCardStatus {
  if (!menu) {
    return {
      label: "Updating",
      variant: "neutral",
      detail: "Checking today’s menu"
    };
  }

  if (menu.isLiveData) {
    return {
      label: "Live",
      variant: "live",
      detail: menu.lastUpdatedAt ? `Updated ${formatUpdatedTime(menu.lastUpdatedAt)}` : "Rutgers menu data"
    };
  }

  return {
    label: "Backup",
    variant: "fallback",
    detail: "Showing backup menu right now"
  };
}

export default async function HomePage() {
  const todayIso = getTodayIsoDate();
  const statusEntries = await Promise.all(
    diningHalls.map(async (hall) => {
      const menu = await getHallMenuForDate(hall.id as DiningHallId, todayIso);
      return [hall.id, buildHallStatus(menu)] as const;
    })
  );

  const statusByHall = Object.fromEntries(statusEntries);
  const liveCount = statusEntries.filter(([, status]) => status.variant === "live").length;
  const fallbackCount = statusEntries.filter(([, status]) => status.variant === "fallback").length;
  const freshestLiveStatus = statusEntries.find(([, status]) => status.variant === "live")?.[1];

  return (
    <main className="space-y-4 sm:space-y-5">
      <Card className="overflow-hidden rounded-[26px] px-5 py-4 sm:px-6 sm:py-5">
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 rounded-[22px] bg-[radial-gradient(circle_at_top_left,rgba(177,31,36,0.08),transparent_58%),radial-gradient(circle_at_top_right,rgba(15,118,110,0.08),transparent_50%)]" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Rutgers New Brunswick</p>
                <h1 className="mt-2 text-[1.8rem] font-semibold tracking-tight text-ink sm:text-[2.15rem]">
                  {APP_NAME}
                </h1>
                <p className="mt-1 max-w-xl text-sm leading-6 text-ink/62">{APP_SUBTITLE}</p>
              </div>
              <div className="hidden rounded-full border border-ink/10 bg-white/85 px-3 py-2 text-sm font-medium text-ink/70 sm:block">
                {diningHalls.length} halls today
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <Badge variant={liveCount > 0 ? "live" : "neutral"}>
                {liveCount > 0 ? `${liveCount} live menu${liveCount === 1 ? "" : "s"}` : "Menus loading"}
              </Badge>
              {fallbackCount > 0 ? (
                <Badge variant="fallback">{fallbackCount} backup{fallbackCount === 1 ? "" : "s"}</Badge>
              ) : null}
              <p className="text-sm text-ink/56">
                Pick a hall to browse today’s stations and build your next bite fast.
                {freshestLiveStatus?.detail ? ` ${freshestLiveStatus.detail}.` : ""}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <HallSelector halls={diningHalls} blurbs={HALL_BLURBS} statusByHall={statusByHall} />
    </main>
  );
}

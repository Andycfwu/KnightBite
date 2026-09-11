import { notFound } from "next/navigation";
import { HallMenuView } from "@/components/menu/HallMenuView";
import { getDiningHall, getHallMenuForDate } from "@/lib/menu";
import { getDefaultMealType } from "@/lib/menu-helpers";
import { getRutgersNowParts, getTodayIsoDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

// A controlled clock over returned Rutgers data, never sample food or a fallback.
export default async function MealSelectionCheck() {
  if (process.env.VERCEL_ENV !== "preview") notFound();
  const requestedDate = getTodayIsoDate();
  const hall = getDiningHall("busch")!;
  const menu = await getHallMenuForDate(hall.id, requestedDate);
  const sixPm = new Date(`${requestedDate}T12:00:00Z`);
  sixPm.setUTCHours(12 + 18 - getRutgersNowParts(sixPm).hour);
  const initialMeal = menu ? getDefaultMealType(menu, sixPm) : undefined;
  return <>
    <aside aria-label="Controlled Preview scenario" className="border-b bg-white p-4 text-sm">
      Controlled 6pm America/New_York entry for {requestedDate}. Clock: {sixPm.toISOString()}.
      Real Rutgers menu retrieval; no sample foods. {menu?.meals.some((meal) => meal.type === "dinner")
        ? "Dinner is listed; Dinner must be initially selected."
        : "Dinner was not retrieved; this does not establish that dinner is not served."}
    </aside>
    <HallMenuView hall={hall} menu={menu} requestedDate={requestedDate} initialMeal={initialMeal} />
  </>;
}

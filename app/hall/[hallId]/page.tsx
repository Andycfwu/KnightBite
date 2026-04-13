import { notFound } from "next/navigation";

import { HallMenuView } from "@/components/menu/HallMenuView";
import { getDiningHall, getHallMenuForDate } from "@/lib/menu";
import { DiningHallId } from "@/lib/types";

type HallPageProps = {
  params: Promise<{
    hallId: string;
  }>;
};

export default async function HallPage({ params }: HallPageProps) {
  const { hallId } = await params;
  const hall = getDiningHall(hallId);

  if (!hall) {
    notFound();
  }

  const todayIso = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  const menu = await getHallMenuForDate(hall.id as DiningHallId, todayIso);

  return <HallMenuView hall={hall} menu={menu} />;
}

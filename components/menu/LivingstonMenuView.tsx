"use client";

import { HallStationExplorer } from "@/components/menu/HallStationExplorer";
import { LIVINGSTON_MAP } from "@/lib/livingston-stations";
import type { DailyMenu } from "@/lib/types";

export function LivingstonMenuView({ menu, requestedDate }: { menu: DailyMenu | null; requestedDate: string }) {
  return <HallStationExplorer menu={menu} requestedDate={requestedDate} map={LIVINGSTON_MAP} />;
}

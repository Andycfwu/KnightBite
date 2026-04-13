import { DailyMenu, DiningHallId } from "@/lib/types";

export type MenuProvider = {
  getDailyMenu: (hallId: DiningHallId, date: string) => Promise<DailyMenu | null>;
};

import { dailyMenus } from "@/lib/mock-data";
import { MenuProvider } from "@/lib/providers/menu-provider";

export const mockMenuProvider: MenuProvider = {
  async getDailyMenu(hallId, date) {
    const menu = dailyMenus.find((entry) => entry.hallId === hallId && entry.date === date);

    if (!menu) {
      return null;
    }

    return {
      ...menu,
      isLiveData: false,
      lastUpdatedAt: new Date().toISOString()
    };
  }
};

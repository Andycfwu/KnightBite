"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { PlateProvider } from "@/hooks/usePlate";
import { UserPreferencesProvider } from "@/hooks/useUserPreferences";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showTabBar = pathname === "/" || pathname === "/plate" || pathname === "/profile";

  return (
    <UserPreferencesProvider>
      <PlateProvider>
        <div className="min-h-screen bg-[#e5e6e8] px-0 py-0 sm:px-6 sm:py-8">
          <div className="mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-[#f7f7f4] sm:min-h-[860px] sm:rounded-[38px] sm:border sm:border-white/80 sm:shadow-[0_28px_70px_rgba(23,23,23,0.16)]">
            <div
              className={`px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] sm:px-7 ${
                showTabBar
                  ? "pb-[calc(env(safe-area-inset-bottom)+6.5rem)]"
                  : "pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
              }`}
            >
              {children}
            </div>
            {showTabBar ? <MobileTabBar /> : null}
          </div>
        </div>
      </PlateProvider>
    </UserPreferencesProvider>
  );
}

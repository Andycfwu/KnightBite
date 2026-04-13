import { ReactNode } from "react";

import { PlateProvider } from "@/hooks/usePlate";
import { TopNav } from "@/components/layout/TopNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <PlateProvider>
      <div className="mx-auto min-h-screen w-full max-w-6xl px-4 pb-8 pt-4 sm:px-6 sm:pb-10 lg:px-8 lg:pb-12">
        <TopNav />
        {children}
      </div>
    </PlateProvider>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";

import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";
import "./livingston.css";
import "./home.css";
import "./account.css";

export const metadata: Metadata = {
  title: "KnightBite",
  description: "Rutgers Dining, Reimagined"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
        {process.env.NEXT_PUBLIC_ANALYTICS_DISABLED !== "1" ? <Analytics /> : null}
      </body>
    </html>
  );
}

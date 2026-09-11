import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DeploymentAnalytics } from "@/components/layout/DeploymentAnalytics";

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
        <DeploymentAnalytics />
      </body>
    </html>
  );
}

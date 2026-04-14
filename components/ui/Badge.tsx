import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "brand" | "live" | "fallback" | "custom" | "neutral" | "muted";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  brand: "bg-brand/10 text-brand",
  live: "bg-emerald-500/12 text-emerald-700",
  fallback: "bg-amber-500/12 text-amber-700",
  custom: "bg-sky-500/12 text-sky-700",
  neutral: "bg-[#e5e7eb] text-ink/66",
  muted: "bg-black/[0.05] text-ink/54"
};

export function Badge({
  children,
  variant = "brand",
  className
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium tracking-[-0.01em]",
        BADGE_STYLES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

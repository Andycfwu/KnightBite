import { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "brand" | "live" | "fallback" | "custom" | "neutral" | "muted";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  brand: "bg-brand/8 text-brand/85",
  live: "bg-emerald-500/10 text-emerald-700",
  fallback: "bg-amber-500/10 text-amber-700",
  custom: "bg-sky-500/10 text-sky-700",
  neutral: "bg-sand text-ink/72",
  muted: "bg-ink/5 text-ink/58"
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
        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.04em]",
        BADGE_STYLES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

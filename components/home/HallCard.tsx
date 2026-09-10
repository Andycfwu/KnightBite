import type { Route } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DiningHall } from "@/lib/types";
import { cn } from "@/lib/utils";

export type HallCardStatus = {
  state: "open" | "closed";
  mealLabel?: string;
  detail: string;
  updatedLabel?: string;
  sourceLabel?: string;
};

type HallCardProps = {
  hall: DiningHall;
  description: string;
  href: Route;
  status?: HallCardStatus;
};

export function HallCard({ hall, href, status }: HallCardProps) {
  const isOpen = status?.state === "open";

  return (
    <Link href={href} className="group block">
      <Card
        className={cn(
          "rounded-[30px] border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,244,246,0.9))] px-5 py-5 shadow-[0_16px_38px_rgba(23,23,23,0.08)] transition duration-200 group-active:scale-[0.99]",
          isOpen ? "min-h-[180px]" : "min-h-[118px]"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[1.9rem] font-semibold tracking-[-0.05em] text-ink leading-none">
                {hall.name}
              </h2>
            </div>
            {status ? (
              <Badge
                variant={isOpen ? "live" : "neutral"}
                className={cn(
                  "px-3 py-1 text-[0.95rem] font-semibold tracking-[-0.02em] normal-case",
                  isOpen ? "bg-[#48c774] text-white" : "bg-[#b9bcc2] text-white"
                )}
              >
                {isOpen ? "OPEN" : "CLOSED"}
              </Badge>
            ) : null}
          </div>

          {isOpen ? (
            <>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-[1.05rem] font-semibold text-ink">{status?.mealLabel ?? "Serving now"}</span>
                {status?.sourceLabel ? <span className="text-sm text-ink/42">{status.sourceLabel}</span> : null}
              </div>
              <p className="mt-3 max-w-[26ch] text-[1rem] leading-[1.28] text-ink/86">{status?.detail}</p>
              {status?.updatedLabel ? <p className="mt-auto pt-5 text-sm text-ink/42">{status.updatedLabel}</p> : null}
            </>
          ) : (
            <div className="mt-auto pt-4">
              <p className="text-[1.15rem] leading-tight text-ink/88">{status?.detail ?? "Check today’s menu"}</p>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

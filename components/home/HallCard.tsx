import type { Route } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DiningHall } from "@/lib/types";

export type HallCardStatus = {
  label: string;
  variant: "live" | "fallback" | "neutral";
  detail?: string;
};

type HallCardProps = {
  hall: DiningHall;
  description: string;
  href: Route;
  status?: HallCardStatus;
};

export function HallCard({ hall, description, href, status }: HallCardProps) {
  return (
    <Link href={href} className="group block">
      <Card className="rounded-[24px] px-5 py-4 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_34px_rgba(23,23,23,0.08)] sm:px-6 sm:py-5">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand">{hall.shortName}</p>
              {status ? <Badge variant={status.variant}>{status.label}</Badge> : null}
            </div>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-ink sm:text-xl">{hall.name}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/60">{description}</p>
            {status?.detail ? <p className="mt-3 text-xs text-ink/56">{status.detail}</p> : null}
          </div>
          <div className="shrink-0 pt-0.5">
            <Button asChild size="sm" variant="secondary">
              <span>Open</span>
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}

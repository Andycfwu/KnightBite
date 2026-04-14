import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border border-black/5 bg-white/96 shadow-[0_18px_40px_rgba(23,23,23,0.08)] backdrop-blur-sm", className)}
      {...props}
    />
  );
}

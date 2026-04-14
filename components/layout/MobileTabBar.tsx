"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PlateIcon } from "@/components/ui/PlateIcon";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/plate", label: "Plate", icon: PlateTabIcon },
  { href: "/profile", label: "Profile", icon: ProfileIcon }
] as const;

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] border-t border-black/6 bg-white/92 px-5 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-3 backdrop-blur-xl sm:rounded-b-[38px]">
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2.5 text-[11px] font-medium transition active:scale-[0.98]",
                active ? "text-brand" : "text-ink/38"
              )}
            >
              <Icon active={active} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="mx-auto mt-3 h-1.5 w-28 rounded-full bg-ink/10" />
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} aria-hidden="true">
      <path
        d="m4 10.5 8-6.5 8 6.5V19a1 1 0 0 1-1 1h-4.8v-5.2H9.8V20H5a1 1 0 0 1-1-1v-8.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlateTabIcon({ active }: { active: boolean }) {
  return (
    <PlateIcon active={active} className="h-[26px] w-[30px]" />
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 20a7 7 0 0 1 14 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

import type { ReactNode, SVGProps } from "react";

type IconName = "map" | "list" | "pin" | "search" | "user" | "calendar" | "arrow" | "chevron" | "halls" | "target" | "leaf" | "chart" | "card" | "lock" | "external" | "trash" | "check";

const paths: Record<IconName, ReactNode> = {
  map: <><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Z" /><path d="M9 3v16M15 5v16" /></>,
  list: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 4v16M3 9h18M3 15h18" /></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2H5Z" /></>,
  calendar: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4M16 3v4M4 11h16" /></>,
  arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
  halls: <><path d="M3 21h18M5 21V8h14v13M3 8l9-5 9 5M9 12v2M15 12v2M10 21v-4h4v4" /></>,
  target: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
  leaf: <><path d="M20 4C8 2 2 8 5 15c4 8 16 2 15-11Z" /><path d="M4 21 15 10" /></>,
  chart: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M7 16v-4M12 16V7M17 16v-7" /></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20M6 15h4" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
  external: <><path d="M14 3h7v7m0-7L10 14M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" /></>,
  trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>,
  check: <path d="m5 12 4 4L19 6" />
};

export function DiningIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

import { cn } from "@/lib/utils";

type PlateIconProps = {
  className?: string;
  active?: boolean;
};

export function PlateIcon({ className, active = false }: PlateIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn("fill-none", className)}
    >
      <circle
        cx="32"
        cy="32"
        r="18"
        stroke="currentColor"
        strokeWidth="3.2"
      />
      <circle
        cx="32"
        cy="32"
        r="11"
        fill="currentColor"
        opacity={active ? 0.12 : 0}
      />
      <path
        d="M10 10v16"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M15.5 10v16"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M12.75 26v27"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M48.5 10c-4.4 0-8 3.6-8 8v9h16v-9c0-4.4-3.6-8-8-8Z"
        stroke="currentColor"
        strokeWidth="3.2"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.1 : 0}
      />
      <path
        d="M48.5 27v26"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

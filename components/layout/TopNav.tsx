import Link from "next/link";

import { APP_NAME } from "@/lib/constants";

export function TopNav() {
  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-brand/12 bg-white text-brand shadow-soft">
          <RutgersLogo />
        </div>
        <div>
          <p className="text-lg font-semibold tracking-tight text-ink">{APP_NAME}</p>
          <p className="text-sm text-ink/55">Rutgers dining, made quick</p>
        </div>
      </Link>
    </header>
  );
}

function RutgersLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4.5h8.3a4.2 4.2 0 0 1 0 8.4H9.3v6.6H5V4.5Zm4.3 4.2h3a1.5 1.5 0 0 0 0-3h-3v3Z"
        fill="currentColor"
      />
      <path
        d="M16.2 4.5H19v10.6c0 2.8-2.2 4.9-5.5 4.9-1.8 0-3.2-.4-4.5-1.3l1.6-2.2c.8.5 1.7.8 2.6.8 1.8 0 3-.9 3-2.5V4.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

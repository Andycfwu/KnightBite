"use client";

import Link from "next/link";

export default function HallError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="livi-page">
    <nav className="livi-topbar" aria-label="Hall navigation"><Link href="/" className="livi-brand">KnightBite</Link></nav>
    <section className="livi-content">
      <div className="livi-empty" role="alert">
        <h1 className="text-2xl font-semibold">We couldn’t open this dining hall.</h1>
        <p>Try again or choose another hall.</p>
        <div className="flex flex-wrap gap-6">
          <button type="button" onClick={reset}>Try again</button>
          <Link href="/">Back to dining halls</Link>
        </div>
      </div>
    </section>
  </main>;
}

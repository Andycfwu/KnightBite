"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

import { usePlate } from "@/hooks/usePlate";

const RU_EXPRESS_ACCOUNT_URL =
  "https://cas.rutgers.edu/login?service=https%3A%2F%2Fservices.jsatech.com%2Flogin.php%3Fcid%3D52";

export function ProfileScreen() {
  const { totalItems, totals } = usePlate();
  const [preferences, setPreferences] = useState({
    vegetarian: false,
    vegan: false,
    nutFree: true
  });

  return (
    <main className="space-y-6">
      <ProfileCard title="Dining Stats">
        <p className="-mt-1 text-sm leading-6 text-ink/46">
          Local KnightBite snapshot from the meals you build here.
        </p>
        <StatRow icon="↗" label="Current Plate Calories" value={`${Math.round(totals.calories)} kcal`} />
        <Divider />
        <StatRow icon="◌" label="Items Added This Session" value={`${totalItems}`} />
      </ProfileCard>

      <ProfileCard title="Dietary Preferences">
        <p className="-mt-1 text-sm leading-6 text-ink/46">
          Save your go-to preferences here. Full filtering can plug into these next.
        </p>
        <ToggleRow
          label="Vegetarian"
          checked={preferences.vegetarian}
          onChange={() => setPreferences((current) => ({ ...current, vegetarian: !current.vegetarian }))}
        />
        <ToggleRow
          label="Vegan"
          checked={preferences.vegan}
          onChange={() => setPreferences((current) => ({ ...current, vegan: !current.vegan }))}
        />
        <ToggleRow
          label="Nut-Free"
          checked={preferences.nutFree}
          accent
          onChange={() => setPreferences((current) => ({ ...current, nutFree: !current.nutFree }))}
        />
      </ProfileCard>

      <ProfileCard title="Meal Swipe Balance">
        <p className="-mt-1 text-sm leading-6 text-ink/46">
          KnightBite does not read private Rutgers account balances directly.
        </p>
        <div className="rounded-[24px] border border-brand/10 bg-[linear-gradient(180deg,rgba(177,31,36,0.08),rgba(255,255,255,0.72))] px-4 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-[0_8px_18px_rgba(23,23,23,0.06)]">
              🎟️
            </span>
            <div className="min-w-0">
              <p className="text-[1.02rem] font-semibold tracking-[-0.03em] text-ink">View balance in RU Express</p>
              <p className="mt-1 text-sm leading-6 text-ink/56">
                Sign in on Rutgers&apos; official account page to check meal swipes, RU Express funds, and account details.
              </p>
            </div>
          </div>

          <Link
            href={RU_EXPRESS_ACCOUNT_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center justify-between rounded-[18px] bg-white px-4 py-3 text-[1rem] font-medium tracking-[-0.02em] text-ink shadow-[0_10px_22px_rgba(23,23,23,0.06)] transition hover:translate-y-[-1px]"
          >
            <span>Check official balance</span>
            <ExternalLinkIcon />
          </Link>

          <p className="mt-3 text-xs leading-5 text-ink/44">
            Opens the official Rutgers NetID sign-in for RU Express account management.
          </p>
        </div>
      </ProfileCard>
    </main>
  );
}

function ProfileCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(243,244,246,0.92))] px-5 py-5 shadow-[0_16px_36px_rgba(23,23,23,0.08)]">
      <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-ink">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function StatRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/12 text-2xl">{icon}</span>
      <div>
        <p className="text-[1.05rem] text-ink/54">{label}:</p>
        <p className="text-[1.15rem] font-semibold tracking-[-0.03em] text-ink">{value}</p>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  accent = false
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  accent?: boolean;
}) {
  return (
    <button type="button" onClick={onChange} className="flex w-full items-center justify-between gap-4 text-left">
      <span className="text-[1.15rem] text-ink">{label}</span>
      <span
        className={`relative inline-flex h-11 w-20 rounded-full transition ${checked ? (accent ? "bg-brand" : "bg-[#b9c0ca]") : "bg-[#d7dce2]"}`}
      >
        <span
          className={`absolute top-1 h-9 w-9 rounded-full bg-white shadow-[0_4px_10px_rgba(23,23,23,0.12)] transition ${
            checked ? "left-10" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-black/8" />;
}

function ExternalLinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 5h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 14 19 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M19 13v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

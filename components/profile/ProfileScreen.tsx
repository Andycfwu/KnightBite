"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { useUserPreferences } from "@/hooks/useUserPreferences";

const RU_EXPRESS_ACCOUNT_URL =
  "https://cas.rutgers.edu/login?service=https%3A%2F%2Fservices.jsatech.com%2Flogin.php%3Fcid%3D52";

export function ProfileScreen() {
  const { dietaryPreferences, macroGoals, setDietaryPreference, setMacroGoal, resetMacroGoals } = useUserPreferences();
  const hasAnyGoals = Boolean(macroGoals.protein || macroGoals.carbs || macroGoals.fat);

  return (
    <main className="space-y-6">
      <ProfileCard title="Dietary Preferences">
        <p className="-mt-1 text-sm leading-6 text-ink/46">
          Save your go-to preferences here. Full filtering can plug into these next.
        </p>
        <ToggleRow
          label="Vegetarian"
          checked={dietaryPreferences.vegetarian}
          onChange={() => setDietaryPreference("vegetarian", !dietaryPreferences.vegetarian)}
        />
        <ToggleRow
          label="Vegan"
          checked={dietaryPreferences.vegan}
          onChange={() => setDietaryPreference("vegan", !dietaryPreferences.vegan)}
        />
        <ToggleRow
          label="Nut-Free"
          checked={dietaryPreferences.nutFree}
          onChange={() => setDietaryPreference("nutFree", !dietaryPreferences.nutFree)}
        />
      </ProfileCard>

      <ProfileCard title="Plate Goals">
        <p className="-mt-1 text-sm leading-6 text-ink/46">
          Set optional macro goals for your plate summary. Leave a field empty to keep the simpler no-target view.
        </p>
        {hasAnyGoals ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={resetMacroGoals}
              className="text-sm font-medium text-ink/46 transition hover:text-ink/68"
            >
              Reset goals
            </button>
          </div>
        ) : null}
        <div className="grid gap-3">
          <GoalInput
            label="Protein"
            value={macroGoals.protein}
            placeholder="e.g. 200"
            onChange={(value) => setMacroGoal("protein", value)}
          />
          <GoalInput
            label="Carbs"
            value={macroGoals.carbs}
            placeholder="e.g. 300"
            onChange={(value) => setMacroGoal("carbs", value)}
          />
          <GoalInput
            label="Fat"
            value={macroGoals.fat}
            placeholder="e.g. 70"
            onChange={(value) => setMacroGoal("fat", value)}
          />
        </div>
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

function GoalInput({
  label,
  value,
  placeholder,
  onChange
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-[22px] border border-black/6 bg-white px-4 py-3 shadow-[0_10px_22px_rgba(23,23,23,0.05)]">
      <span className="text-[1.05rem] font-medium text-ink">{label}</span>
      <div className="flex items-center gap-2">
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-20 bg-transparent text-right text-[1rem] font-semibold tracking-[-0.02em] text-ink outline-none"
        />
        <span className="text-sm text-ink/46">g</span>
      </div>
    </label>
  );
}

function ToggleRow({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button type="button" onClick={onChange} className="flex w-full items-center justify-between gap-4 text-left">
      <span className="text-[1.15rem] text-ink">{label}</span>
      <span
        className={`relative inline-flex h-11 w-20 rounded-full transition ${checked ? "bg-brand" : "bg-[#d7dce2]"}`}
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

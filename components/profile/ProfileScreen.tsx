"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { AccountLayout } from "@/components/layout/AccountLayout";
import { DiningIcon } from "@/components/ui/DiningIcon";
import { usePlate } from "@/hooks/usePlate";
import { useUserPreferences } from "@/hooks/useUserPreferences";

const RU_EXPRESS_ACCOUNT_URL =
  "https://cas.rutgers.edu/login?service=https%3A%2F%2Fservices.jsatech.com%2Flogin.php%3Fcid%3D52";

export function ProfileScreen() {
  const { dietaryPreferences, macroGoals, setDietaryPreference, setMacroGoal, resetMacroGoals, saveStatus, saveMessage, clearLocalPreferences } = useUserPreferences();
  const plate = usePlate();
  const hasAnyGoals = Boolean(macroGoals.protein || macroGoals.carbs || macroGoals.fat);
  const preferenceCount = Object.values(dietaryPreferences).filter(Boolean).length;

  return (
    <AccountLayout active="profile">
      <div className="account-pageHeading">
        <div><p className="account-eyebrow">MAKE IT YOURS</p><h1>Your dining profile</h1><p>A few preferences. A plate that feels more like you.</p></div>
        <Link href="/plate" className="account-secondaryButton">View your plate<DiningIcon name="arrow" /></Link>
      </div>

      <section className="profile-intro" aria-label="Your local profile">
        <span className="profile-introIcon"><DiningIcon name="user" /></span>
        <div><h2>Your preferences, in one place.</h2><p>Personalize your plate goals and keep your dining preferences close.</p></div>
        <span className="profile-localBadge"><DiningIcon name="lock" />This browser</span>
      </section>
      <p role="status" className="profile-saveStatus" data-save-status={saveStatus}><span className="account-dot" />{saveMessage}</p>

      <div className="profile-layout">
        <div className="profile-column">
          <ProfileCard title="Dietary Preferences" icon="leaf" trailing={<span className="account-countBadge">{preferenceCount} selected</span>}>
            <p className="account-cardDescription">Save the preferences that matter to you.</p>
            <div className="profile-toggles">
              <ToggleRow label="Vegetarian" description="Your preference for meat-free meals" checked={dietaryPreferences.vegetarian} onChange={() => setDietaryPreference("vegetarian", !dietaryPreferences.vegetarian)} />
              <ToggleRow label="Vegan" description="Your preference for plant-based meals" checked={dietaryPreferences.vegan} onChange={() => setDietaryPreference("vegan", !dietaryPreferences.vegan)} />
              <ToggleRow label="Nut-Free" description="Your preference to avoid nuts" checked={dietaryPreferences.nutFree} onChange={() => setDietaryPreference("nutFree", !dietaryPreferences.nutFree)} />
            </div>
            <p className="profile-preferenceNote">These saved preferences do not filter menus. Use each menu’s filters to find explicit Rutgers labels; missing labels do not establish allergy safety.</p>
          </ProfileCard>

          <ProfileCard title="Plate Goals" icon="target" id="plate-goals" trailing={hasAnyGoals ? <button type="button" onClick={resetMacroGoals} className="profile-resetGoals">Reset goals</button> : null}>
            <p className="account-cardDescription">Set optional macro goals for your plate summary. Leave a field empty to see totals without a target.</p>
            <div className="profile-goalGrid">
              <GoalInput label="Protein" nutrient="protein" value={macroGoals.protein} onChange={(value) => setMacroGoal("protein", value)} />
              <GoalInput label="Carbs" nutrient="carbs" value={macroGoals.carbs} onChange={(value) => setMacroGoal("carbs", value)} />
              <GoalInput label="Fat" nutrient="fat" value={macroGoals.fat} onChange={(value) => setMacroGoal("fat", value)} />
            </div>
            <Link href="/plate" className="profile-inlineLink">See your goals on your plate<DiningIcon name="arrow" /></Link>
          </ProfileCard>
        </div>

        <div className="profile-column">
          <ProfileCard title="Meal Swipe & RU Express" icon="card">
            <p className="account-cardDescription">Your Rutgers meal account, one step away.</p>
            <div className="profile-balancePanel">
              <span className="profile-balanceIcon"><DiningIcon name="card" /></span>
              <h3>Check your official balance</h3>
              <p>Sign in to Rutgers to view meal swipes, RU Express funds, and account details.</p>
              <span className="profile-externalLabel">Managed by Rutgers</span>
            </div>
            <Link href={RU_EXPRESS_ACCOUNT_URL} target="_blank" rel="noreferrer" className="account-primaryButton profile-accountLink">Open RU Express<DiningIcon name="external" /></Link>
            <p className="profile-accountNote">KnightBite does not read private Rutgers account balances directly. Opens the official Rutgers NetID sign-in in a new tab.</p>
          </ProfileCard>

          <ProfileCard title="Data in this browser" icon="lock">
            <p className="account-cardDescription">Preferences and goals are stored only in this browser, until you clear them. Anyone using this browser profile can see them. Plates are temporary and clear on reload.</p>
            <div className="profile-dataActions">
              <Link href="/privacy">Data and privacy details<DiningIcon name="arrow" /></Link>
              <button type="button" onClick={() => { clearLocalPreferences(); plate.clearPlate(); }}><DiningIcon name="trash" />Clear local data</button>
            </div>
            <p className="profile-accountNote">Clearing removes saved KnightBite preferences and resets this plate. It does not delete hosting or analytics records.</p>
          </ProfileCard>
        </div>
      </div>
    </AccountLayout>
  );
}

function ProfileCard({ title, icon, id, trailing, children }: { title: string; icon: "leaf" | "target" | "card" | "lock"; id?: string; trailing?: ReactNode; children: ReactNode }) {
  return <section className="account-card profile-card" id={id}>
    <div className="account-cardHeading"><span className="account-cardIcon"><DiningIcon name={icon} /></span><h2>{title}</h2>{trailing}</div>
    {children}
  </section>;
}

function GoalInput({ label, nutrient, value, onChange }: { label: string; nutrient: string; value: string; onChange: (value: string) => void }) {
  return <label className={`profile-goalInput nutrient-${nutrient}`}>
    <span className="profile-goalLabel">{label}<span className="plate-nutrientDot" /></span>
    <span className="profile-goalValue">
      <input aria-label={`${label} goal in grams`} maxLength={4} inputMode="numeric" pattern="[0-9]*" value={value} onChange={(event) => onChange(event.target.value)} placeholder="—" />
      <span>g</span>
    </span>
  </label>;
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: () => void }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className="profile-toggleRow">
    <span><strong>{label}</strong><small>{description}</small></span>
    <span className="profile-switch" aria-hidden="true"><span>{checked ? <DiningIcon name="check" /> : null}</span></span>
  </button>;
}

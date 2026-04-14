"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type DietaryPreferences = {
  vegetarian: boolean;
  vegan: boolean;
  nutFree: boolean;
};

type MacroGoals = {
  protein: string;
  carbs: string;
  fat: string;
};

type ParsedMacroGoals = {
  protein?: number;
  carbs?: number;
  fat?: number;
};

type UserPreferencesContextValue = {
  dietaryPreferences: DietaryPreferences;
  macroGoals: MacroGoals;
  parsedMacroGoals: ParsedMacroGoals;
  setDietaryPreference: (key: keyof DietaryPreferences, value: boolean) => void;
  setMacroGoal: (key: keyof MacroGoals, value: string) => void;
  resetMacroGoals: () => void;
};

const STORAGE_KEY = "knightbite-user-preferences";

const DEFAULT_DIETARY_PREFERENCES: DietaryPreferences = {
  vegetarian: false,
  vegan: false,
  nutFree: false
};

const DEFAULT_MACRO_GOALS: MacroGoals = {
  protein: "",
  carbs: "",
  fat: ""
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

function sanitizeGoalValue(value: string) {
  return value.replace(/[^\d]/g, "").slice(0, 4);
}

function parsePositiveGoal(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreferences>(DEFAULT_DIETARY_PREFERENCES);
  const [macroGoals, setMacroGoals] = useState<MacroGoals>(DEFAULT_MACRO_GOALS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(STORAGE_KEY);
      if (rawValue) {
        const parsed = JSON.parse(rawValue) as {
          dietaryPreferences?: Partial<DietaryPreferences>;
          macroGoals?: Partial<MacroGoals>;
        };

        setDietaryPreferences({
          vegetarian: Boolean(parsed?.dietaryPreferences?.vegetarian),
          vegan: Boolean(parsed?.dietaryPreferences?.vegan),
          nutFree: Boolean(parsed?.dietaryPreferences?.nutFree)
        });

        setMacroGoals({
          protein: sanitizeGoalValue(String(parsed?.macroGoals?.protein ?? "")),
          carbs: sanitizeGoalValue(String(parsed?.macroGoals?.carbs ?? "")),
          fat: sanitizeGoalValue(String(parsed?.macroGoals?.fat ?? ""))
        });
      }
    } catch {
      setDietaryPreferences(DEFAULT_DIETARY_PREFERENCES);
      setMacroGoals(DEFAULT_MACRO_GOALS);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        dietaryPreferences,
        macroGoals
      })
    );
  }, [dietaryPreferences, hydrated, macroGoals]);

  const value = useMemo<UserPreferencesContextValue>(
    () => ({
      dietaryPreferences,
      macroGoals,
      parsedMacroGoals: {
        protein: parsePositiveGoal(macroGoals.protein),
        carbs: parsePositiveGoal(macroGoals.carbs),
        fat: parsePositiveGoal(macroGoals.fat)
      },
      setDietaryPreference: (key, value) => {
        setDietaryPreferences((current) => ({ ...current, [key]: value }));
      },
      setMacroGoal: (key, value) => {
        setMacroGoals((current) => ({ ...current, [key]: sanitizeGoalValue(value) }));
      },
      resetMacroGoals: () => {
        setMacroGoals(DEFAULT_MACRO_GOALS);
      }
    }),
    [dietaryPreferences, macroGoals]
  );

  return <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>;
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);

  if (!context) {
    throw new Error("useUserPreferences must be used inside UserPreferencesProvider.");
  }

  return context;
}

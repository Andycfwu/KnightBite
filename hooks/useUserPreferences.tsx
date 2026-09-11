"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
import { clearPreferences, decodePreferences, defaultPreferences, PREFERENCES_KEY, readPreferences, sanitizeGoalValue, savePreferences, SAVE_MESSAGES, type DietaryPreferences, type MacroGoals, type Preferences, type SaveStatus } from "@/lib/preferences-storage";

function parsePositiveGoal(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
type UserPreferencesContextValue = Preferences & {
  parsedMacroGoals: { protein?: number; carbs?: number; fat?: number };
  saveStatus: SaveStatus;
  saveMessage: string;
  setDietaryPreference: (key: keyof DietaryPreferences, value: boolean) => void;
  setMacroGoal: (key: keyof MacroGoals, value: string) => void;
  resetMacroGoals: () => void;
  clearLocalPreferences: () => void;
};
const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);
const browserStorage = () => window.localStorage;
export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('loading');
  const current = useRef(preferences);
  useEffect(() => {
    const loaded = readPreferences(browserStorage);
    current.current = loaded.preferences;
    setPreferences(loaded.preferences);
    setSaveStatus(loaded.status);
    const sync = (event: StorageEvent) => {
      if(event.key !== PREFERENCES_KEY && event.key !== null) return;
      let status: SaveStatus = 'unsaved';
      let next = defaultPreferences();
      if(event.newValue !== null) {
        const parsed = decodePreferences(event.newValue);
        if(!parsed) { setSaveStatus('invalid'); return; }
        next = parsed; status = 'saved';
      }
      current.current = next;
      setPreferences(next); setSaveStatus(status);
    };
    window.addEventListener('storage',sync);
    return () => window.removeEventListener('storage',sync);
  },[]);
  const value = useMemo<UserPreferencesContextValue>(() => {
    function update(change: (previous: Preferences) => Preferences) {
      // Only explicit edits write. Merge against the latest readable cross-tab value;
      // simultaneous edits use the browser's last successful whole-record write.
      const latest = readPreferences(browserStorage);
      const synchronized = saveStatus === 'saved' && (latest.status === 'saved' || latest.status === 'unsaved');
      const next = change(synchronized ? latest.preferences : current.current);
      current.current = next; setPreferences(next);
      setSaveStatus(savePreferences(browserStorage,next));
    }
    return { ...preferences, saveStatus, saveMessage: SAVE_MESSAGES[saveStatus],
      parsedMacroGoals: { protein:parsePositiveGoal(preferences.macroGoals.protein), carbs:parsePositiveGoal(preferences.macroGoals.carbs), fat:parsePositiveGoal(preferences.macroGoals.fat) },
      setDietaryPreference: (key,value) => update(previous => ({...previous,dietaryPreferences:{...previous.dietaryPreferences,[key]:value}})),
      setMacroGoal: (key,value) => update(previous => ({...previous,macroGoals:{...previous.macroGoals,[key]:sanitizeGoalValue(value)}})),
      resetMacroGoals: () => update(previous => ({...previous,macroGoals:defaultPreferences().macroGoals})),
      clearLocalPreferences: () => {
        const next = defaultPreferences(); current.current = next; setPreferences(next);
        setSaveStatus(clearPreferences(browserStorage));
      }
    };
  },[preferences,saveStatus]);
  return <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>;
}
export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if(!context) throw new Error("useUserPreferences must be used inside UserPreferencesProvider.");
  return context;
}

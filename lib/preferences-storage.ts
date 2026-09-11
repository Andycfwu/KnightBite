export const PREFERENCES_KEY = "knightbite-user-preferences";
export type DietaryPreferences = { vegetarian: boolean; vegan: boolean; nutFree: boolean };
export type MacroGoals = { protein: string; carbs: string; fat: string };
export type Preferences = { dietaryPreferences: DietaryPreferences; macroGoals: MacroGoals };
export type SaveStatus = "loading" | "unsaved" | "saved" | "unavailable" | "invalid" | "cleared" | "clear_failed";
export const defaultPreferences = (): Preferences => ({ dietaryPreferences: { vegetarian: false, vegan: false, nutFree: false }, macroGoals: { protein: "", carbs: "", fat: "" } });
export const sanitizeGoalValue = (value: string) => value.replace(/[^\d]/g, "").slice(0,4);
export const SAVE_MESSAGES: Record<SaveStatus,string> = {
  loading: "Loading saved preferences…", unsaved: "Preferences are only in this session until you edit them.",
  saved: "Preferences saved in this browser.", unavailable: "Preferences work for this session, but could not be saved in this browser.",
  invalid: "Saved preferences could not be read. Session preferences still work. Clear local data to replace the unreadable record.",
  cleared: "KnightBite preferences and this plate were cleared from this browser session. The saved preference record was removed.",
  clear_failed: "The session was reset, but saved preferences could not be removed. Use your browser’s site-data controls to clear them."
};
function record(value: unknown): value is Record<string,unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
export function decodePreferences(raw: string): Preferences | null {
  if(raw.length > 4096) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if(!record(data) || (data.version !== undefined && data.version !== 1)) return null;
    const prefs = defaultPreferences();
    for(const name of ['dietaryPreferences','macroGoals'] as const) {
      const fields = data[name];
      if(fields === undefined && data.version === undefined) continue;
      if(!record(fields)) return null;
      for(const key of Object.keys(prefs[name])) {
        const value = fields[key];
        if(value === undefined && data.version === undefined) continue;
        if(name === 'dietaryPreferences') {
          if(typeof value !== 'boolean') return null;
          prefs.dietaryPreferences[key as keyof DietaryPreferences] = value;
        } else {
          if(typeof value !== 'string' || !/^\d{0,4}$/.test(value)) return null;
          prefs.macroGoals[key as keyof MacroGoals] = value;
        }
      }
    }
    return prefs;
  } catch { return null; }
}
export type BrowserStore = Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export function readPreferences(storage: () => BrowserStore): { preferences: Preferences; status: SaveStatus } {
  try {
    const raw = storage().getItem(PREFERENCES_KEY);
    if(raw === null) return { preferences: defaultPreferences(), status: 'unsaved' };
    const preferences = decodePreferences(raw);
    return preferences ? { preferences, status:'saved' } : { preferences:defaultPreferences(),status:'invalid' };
  } catch { return { preferences:defaultPreferences(),status:'unavailable' }; }
}
export function savePreferences(storage: () => BrowserStore, preferences: Preferences): SaveStatus {
  try {
    const store = storage();
    const previous = store.getItem(PREFERENCES_KEY);
    // Preserve malformed/future data until explicit clear; never erase it on hydration.
    if(previous !== null && !decodePreferences(previous)) return 'invalid';
    store.setItem(PREFERENCES_KEY, JSON.stringify({version:1,...preferences}));
    return 'saved';
  } catch { return 'unavailable'; }
}
export function clearPreferences(storage: () => BrowserStore): SaveStatus {
  try { storage().removeItem(PREFERENCES_KEY); return 'cleared'; }
  catch { return 'clear_failed'; }
}

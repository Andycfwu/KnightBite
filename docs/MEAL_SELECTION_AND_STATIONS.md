# Meal entry and station listing evidence

September 10, 2026. This change uses existing typical hall schedules; it does not certify live operating hours or change provider parsing, caching, deadlines or source menus.

## Initial meal selection

The homepage's unchanged `SERVICE_WINDOWS` now lives in `lib/meal-schedule.ts`, shared with the hall default helper. The server computes the initial meal after retrieval and passes it to the client so hydration uses the same choice. For today's Rutgers date, choose the active meal; during a gap/before opening choose the next scheduled meal; after the final window choose the last meal. If the suggested meal was not returned, choose the next chronological available section, otherwise the last available section. For past/future dates choose the first chronological returned section. An empty menu never manufactures a section.

Selection, tabs, panel heading and items reference the same actual section. The explorer's implicit first-section fallback was removed. Manual choice survives search, filters, plate changes and same-context menu refresh; a different hall/date resets the context, and a removed selection falls back to an actually returned section. Operating-hours status stays separate from menu listing evidence.

## Stations: evidence, not invented schedules

The provider types contain no verified per-station closure or operating-hours field. The inspected provider builds items with `available: true`; this is not a station closure signal. Grouping still conserves every returned item and keeps unknown sections in More stations. Status uses the selected meal's original, unfiltered counts:

- Returned meal + positive count: N items listed for that meal; not a claim the station is open now.
- Returned meal + zero count: No items listed for that meal; muted pin/legend, visible dash marker and accessible explanation. Controls remain operable by keyboard/touch and open the explanation.
- No retrieved meal: Menu status unavailable; question marker, no zero-item or Closed inference.

**No confirmed Closed rule is added**, because the reviewed evidence does not establish an exhaustive, date-applicable closure schedule. Confirmed closure would require explicit reliable source evidence; neither emptiness nor a provider timeout meets that standard. Likewise a search/filter result count of zero must not mute a station that has listed foods.

Sources inspected September 10, 2026:

- [Official Rutgers dining hall tour](https://food.rutgers.edu/places-eat/dining-hall-tour): Livingston's specialty station and Busch/Neilson cook-to-order descriptions include breakfast omelets. Several cuisine descriptions mention particular meals, but do not establish an exclusive daily closure calendar for every mapped station. Atrium's soup/salad area changes its offering in the morning; that is not closure.
- [Official Rutgers hours](https://food.rutgers.edu/hours-of-operation): hall/retail and takeout hours, including weekend distinctions, are not an exhaustive schedule for individual illustrated stations. Existing app windows remain labeled typical; a complete hours overhaul is outside this fix.

## Verification scope

Unit regressions cover hall-specific boundaries, gaps/after-hours, UTC/New York dates, winter/DST offsets, missing/unsorted meals, absent menus, empty/listed/unavailable station evidence, correct section labels, and breakfast omelet conservation. Browser checks cover controlled 6pm Dinner entry, manual Breakfast retention across clock changes/search/plate actions, unfiltered station counts, keyboard focus and mobile empty-station selection. All automated provider data is synthetic/sanitized and external/analytics transport is blocked.

Protected Preview `/preview-check/meals` changes only the initial selection clock, with 6pm calculated for the requested New York date. Food comes through the existing real Rutgers loader, with no replacement on failure. Existing Preview middleware/page guards keep this route unavailable in Production. Analytics is omitted on Preview, and remains enabled on normal Production builds. Hosted verification must record actual returned meal availability; offline fixtures are not hosted provider evidence. Never promote a Preview-built artifact into Production.

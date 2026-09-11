# Meal entry and station listing evidence

Updated September 11, 2026 UTC. The partial-meal fix below supersedes the earlier missing-meal fallback. Existing typical hall schedules remain unverified as live operating hours. Nutrislice parsing, deadlines and source identity are retained; recovery now caches each meal independently.

## Initial meal selection

The homepage's unchanged `SERVICE_WINDOWS` now lives in `lib/meal-schedule.ts`, shared with the hall default helper. The server computes the initial meal after retrieval and passes it to the client so hydration uses the same choice. On client entry, the shared selection hook resolves that hint once against the current New York schedule; this prevents a morning server response/prefetch from fixing the page to Breakfast at 6pm. A manual selection, including a click replayed during hydration, takes precedence. This uses the device clock and does not continuously force the meal as time passes. For today's Rutgers date, choose the active meal; during a gap/before opening choose the next scheduled meal; after the final window choose the last meal. If the suggested meal was not returned, keep it selected with a meal-specific unavailable panel and retry control. Breakfast, Lunch and Dinner controls are always present. For past/future dates choose the first chronological returned section. An empty menu never manufactures a section.

Selection, tabs, panel heading and items reference the same actual section. The explorer's implicit first-section fallback was removed. Manual choice survives search, filters, plate changes and same-context menu refresh; a different hall/date resets the context, and a removed section becomes unavailable under its own selected label, with no fallback selection. Operating-hours status stays separate from menu listing evidence.

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

Unit regressions cover hall-specific boundaries, gaps/after-hours, UTC/New York dates, winter/DST offsets, missing/unsorted meals, absent menus, empty/listed/unavailable station evidence, correct section labels, and breakfast omelet conservation. Browser regressions use an 8am server response with 6pm browser entry through the actual homepage, and distinguishable breakfast omelet/lunch soup/dinner roast fixtures. They assert both section selection and displayed food (including absence of the other meals), desktop/mobile controls, direct entry and hall navigation, manual retention across clock/search/plate changes, same-menu prop refresh, and existing empty/unavailable station checks. All automated provider data is synthetic/sanitized and external/analytics transport is blocked.

Protected Preview `/preview-check/meals` supplies a controlled client-entry clock and a deliberately stale Breakfast hydration hint, with 6pm calculated for the requested New York date. The optional allowlisted hall query selects a supported hall. A rerender control clones the returned props without requesting or adding food. Food comes through the existing real Rutgers loader, with no replacement on failure. Existing Preview middleware/page guards keep this route unavailable in Production. Analytics is omitted on Preview, and remains enabled on normal Production builds. Hosted verification must record actual returned meal availability; offline fixtures are not hosted provider evidence. Never promote a Preview-built artifact into Production.

## Partial-meal retry verification

The per-meal cache preserves successful data for fifteen minutes from retrieval and failures for thirty seconds. A daily snapshot cannot outlive its earliest meal expiry. Explicit retry uses the same hall/date/meal promise, fetches only that meal, does not retry automatically and never lengthens its body-inclusive 4.5-second deadline. Successful empty responses and failures have distinct metadata; normalization-rejected or missing-date responses remain unconfirmed. Display timestamps belong to the selected real meal. Manual selection and temporary plate snapshots are not reset by retry completion.

Preview-only `/preview-check/partial?hall=livingston` (also supports Busch) masks Lunch/Dinner over one real returned menu at controlled 6pm. Its visible transport selector tests a delayed success, failure/cooldown or empty response without more upstream calls; success only reveals the correct real source section when actually retrieved. This controlled state is not evidence of a live upstream failure/empty menu. Production returns404 for this route. Offline browser transport supplies distinguishable synthetic dishes and separately tests the actual recovery endpoint. Analytics remains suppressed during Preview testing.

# KnightBite

Mobile-first Next.js app for browsing Rutgers New Brunswick dining hall menus, building a virtual plate, and viewing nutrition totals with explicit missing-data coverage.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS

## Notes

- Static dining hall metadata lives in `lib/dining-halls.ts`.
- Sample menus remain in `lib/mock-data.ts` for deliberate test/development use through `mockMenuProvider.getDailyMenu(hallId, date)` in `lib/providers/mock-provider.ts`. Use a date from the fixtures. Normal application routes never substitute these samples for Rutgers menus.
- Shared types live in `lib/types.ts`.
- Nutrition math is isolated in `lib/nutrition.ts`.
- The Rutgers provider lives in `lib/providers/`. The shared `getHallMenuForDate()` loader returns its menu unchanged on success and `null` when retrieval returns null or throws.
- The homepage waits at most 1.1 seconds for each hall's menu status. Failures and timeouts mean status is unconfirmed, not that the hall is closed or Rutgers has no menu. Its summary counts only confirmed real menus; update times appear only when supplied by those menus. Operating-hours status is separate, uses static typical hours, and is explicitly unverified; it is not a live open/closed indicator.
- The shared menu loader stops waiting after 15 seconds and returns unavailable; the homepage retains its shorter 1.1-second display deadline. Neither display deadline invents an upstream timeout or changes the provider cache. An unavailable hall page shows the requested Rutgers calendar date and an unavailable message, without food items or a retrieval timestamp. Loading screens include visible status and hall navigation; unexpected route errors include retry and home controls.
- Atrium now resolves `the-atrium` / The Atrium from Rutgers’ Nutrislice school index and uses the shared weekly ingestion path. Missing/conflicting identity, an unadvertised meal, mismatched returned meal type, or missing requested date cannot borrow another location, meal, date, FoodProNet response or sample food.
- [Atrium Nutrislice evidence and fixture notes](tests/fixtures/nutrislice/atrium/README.md) document real September 10 responses, published-interface comparisons and coverage limits. API availability does not establish inventory or allergy safety.
- Correctly dated stored-real-menu recovery is future work; this change adds no persistence or stale-data recovery and preserves provider cache lifetimes while bounding process-local retention.

## Dining hall station-map prototypes

`/hall/livingston`, `/hall/busch`, `/hall/neilson`, and `/hall/atrium` open responsive 2D illustrated station guides. Select a numbered area to browse its menu items and add to the existing plate; use search across all stations or switch to the full list. Unknown/ambiguous station labels remain accessible under **More stations**. Meal counts and food panels use only the existing menu result, including the honest unavailable state.

The artwork is approximate, not a measured floor plan. See `public/images/LIVINGSTON-MAP.md` and `public/images/BUSCH-MAP.md` for provenance, and `lib/livingston-stations.ts` / `lib/busch-stations.ts` for exact aliases. Busch now follows the user's September 9 sketch with an entrance at the bottom, a central U-shaped island, separate pasta and pizza counters, and a dessert island. Coffee and the bread/toaster face have been removed from the artwork; the taco and vegetable faces remain. Its 16 numbered areas have 18 clickable locations because all three fruit spots share one menu group. The wide map scrolls on smaller screens, with a station legend for quick access.

Rutgers describes the first entree line as typically Asian-inspired, so it is labeled **Entrees 1** with a note that offerings may vary. A rotation schedule was not established. The user identified **Entrees 2**, which now receives the exact ENTREES section. Unconfirmed physical locations—including soups, deli, rotisserie, prepared salads and takeout—remain under More stations. No upstream foods are dropped, including bread sections. No new dependencies, ingestion changes, or deployment are involved.

`HallStationExplorer` shares interactions between the halls; `lib/station-map.ts` groups exact normalized section labels without changing upstream items, IDs or nutrition. The existing `livi-*` CSS theme serves all four maps. Livingston's seven zones, coordinates, artwork and aliases are preserved.

Manual interaction checks: select map pins by touch and keyboard; search for an item in an unmapped station; switch meals; add the same item twice and inspect the plate; use Back to the station map on mobile. The automated suite checks station/item conservation, unknown-name handling, and real/unavailable/sample rendering; it does not substitute for browser interaction testing.

Busch browser checks on September 8, 2026 (earlier map): live menu rendered at desktop and 390px phone widths, with an additional 320px overflow check. Verified station selection, Enter-key activation and panel focus, empty station wording, global sushi search, list access to all 241 returned lunch items, meal changes, repeated adds (2 × 201 kcal = 402 kcal), removal, plate dismissal, and mobile return-to-map. All ten phone map buttons measured at least 44 × 44px. Testing found and fixed an existing plate backdrop that inherited `pointer-events: none`; it now receives dismissal clicks while open. Test plate contents were removed afterward. Livingston was also inspected at phone and desktop sizes: its original seven pins and artwork remain, and selecting Mongolian grill displayed the 15 returned lunch items from WOK/ MONGOLIAN GRILL. These observations establish this session's behavior, not continuing upstream availability.

Busch revision checks on September 9, 2026: inspected the new drawing-based image on desktop and at 390px, with an additional 320px overflow check. Verified horizontal panning, 18 non-overlapping 44 × 44px touch targets, keyboard activation and food-panel focus, the two entree lines, noodle and sushi menus, the entrance fruit stand, and return-to-map. All 243 returned lunch items were accessible in List view and matched the sum of the station counts; searching BREADS returned nine items. Adding two California roll servings showed 170 kcal, and those test items were removed. No browser errors or warnings were captured. Livingston retained its seven pins and displayed 15 Mongolian grill lunch items at phone width. These are observations from this session, not a guarantee of continuing upstream availability.

Livingston's September 10 revision follows the user's circular drawing, with entrances on the left and bottom. Rutgers' panorama and station guide were rechecked; the central island now includes fresh fruit alongside salad/deli, and the rear rotating counter is labelled Daily specialty. The user’s correction places section 7, Vegetables, on the lower-left arc formerly labelled Dietary needs. Its former right-hand position is a plain curved connector flush with sections 3 and 5; the Dietary needs label and provisional-location note are removed. The lower breakfast/dessert island and upper horseshoe-shaped island follow the sketch. See `public/images/LIVINGSTON-MAP.md` for evidence and limits. Changes remain local to `codex/dining-hall-overhaul`.

Neilson's September 9 map uses the supplied drawing rotated 90 degrees clockwise, placing its V-shaped entrance at the bottom. Its nine serving-area labels were checked against Rutgers' guide and current menu section names. Dietary support is an informational landmark, not an extra food station. The artwork preserves station order but stylizes some counter shapes and joins; see `public/images/NEILSON-MAP.md` for the exact differences, source notes and generation prompt. The portrait canvas scrolls on narrow screens and reuses search, List view and the existing plate controls. Tests cover source-object conservation, orientation, unknown stations and unavailable/real/sample rendering. No live browser interaction checks were performed for this revision.

Atrium's September 9 map follows the supplied drawing with the entrance at the bottom. Rutgers' panorama was explored to identify the two refrigerated grab-and-go islands, snack display, checkout row and R feature wall. The circular symbol at the left is mapped to soup/salad using the sketch and Rutgers' separate salad-counter photograph; its contour is schematic. Seven food areas have eight clickable locations, since the refrigerated displays share a menu group. Observed Nutrislice labels connect each brand's main dishes, bases, toppings and sides without changing source data. Checkout and the snack display remain in the artwork without text labels. The revised artwork adds a continuous lower walkway to Scarlet Ginger, places the entrance directly beneath Soup & salad, retains the separate exit below checkout, and removes the R wall label. The illustration's known contour differences, reference links and generation prompt are documented in `public/images/ATRIUM-MAP.md`. Automated checks cover grouping, item conservation, unknown sections, breakfast yogurt, and unavailable/real/sample states. Panorama inspection was reference research; no browser interaction tests of the local Atrium page were performed.

## Loading safeguards

All four halls use Nutrislice nutrition supplied inline with the requested food. Atrium no longer issues menu-page or nutrition-label requests to FoodProNet. Missing nutrients remain unknown, including in plate totals. No dedicated dependency was used by the removed HTML parser, so package versions and the lockfile are unchanged.

Atrium and Nutrislice portions that share a source identity but survive the existing deduplication rules receive distinct item IDs, so switching meals/search results cannot duplicate rows and different portions remain separate on the plate. Existing noncolliding IDs are preserved.

Nutrislice’s existing 4.5-second deadline covers both headers and response bodies, including Atrium. The shared 15-second caller deadline remains the final display bound; the homepage keeps its 1.1-second status wait. These waits do not cancel shared provider work or invent upstream timeout logs. Ingestion summaries emit synchronously when the daily loader exits.

Run only one Next.js development server per checkout: two servers sharing `.next` can corrupt each other’s build cache. Stop the development server before `npm run build`, then restart it. This hardening pass adds no persistence, retries, or monitoring infrastructure.

## Automated checks

Use the Node 24 LTS version in `.nvmrc` (24.21.0 for this pass), then `npm ci`. Vercel currently supplies 24.19.0; both versions must pass the full release gate. `prebuild` rejects runtimes below the reviewed floor and records build/native versions. See [runtime policy](docs/RUNTIME_POLICY.md) for the security assessment and managed-host limitations. Global Node was not changed by remediation.

- `npm test`: offline Node/tsx regressions, including controlled deadlines, single synchronous failure summaries, redirect rejection, Atrium index/date/meal matching, missing/zero nutrition, portion identity, storage faults, dietary labels, and cache/response bounds.
- `npm run typecheck`: regenerate Next route types, then TypeScript without incremental output.
- `npm run lint`: noninteractive ESLint; warnings fail the check.
- `npm run build:isolated`: copy current source to a temporary directory, perform a clean locked install, and run `npm run build` plus types there. No `.env` files or development `.next` are copied. Outbound fetch/HTTP is blocked during the build and Next telemetry is disabled. The artifact includes the normal analytics-enabled bundle. A build does not prove live Rutgers availability.
- `npx playwright install chromium webkit`, then `npm run test:browser`: serve that isolated production artifact on loopback port 3217 with a test-only synthetic provider transport. Browser traffic is restricted to loopback; analytics scripts and collection requests are intercepted locally, with no test events delivered to Vercel. The analytics regression normally uses an explicitly synthetic transport probe; `KNIGHTBITE_ANALYTICS_SCRIPT_FIXTURE=/absolute/path/to/captured-script.js` replays an approved public script captured separately, without fetching it during tests. No application demo route or mock fallback is introduced. The test server stops after the run. Results go to ignored `test-results/`; temporary artifacts can be removed after review.
- `npm run check:preview`: a separate isolated Preview build and offline browser checks for analytics suppression, request-time runtime/header diagnostics, production route guards and the explicitly controlled unavailable/date view.
- `npm run check`: tests, types, lint, isolated production/Preview builds, and browser workflows. Dependency installation/browser downloads need package-network access; application regression tests never need live providers.
- `npm audit --audit-level=moderate` and `git diff --check` complete release checks. The local GitHub workflow is defined in `.github/workflows/release-checks.yml`; branch/deployment enforcement is an external setting recorded in the current readiness report and must be re-read before release.

See [release procedure](docs/RELEASE_CHECKLIST.md), [dependency/asset notices](docs/DEPENDENCY_NOTICES.md), and the [finding-by-finding remediation status](docs/audits/production-readiness-2026-09-10/REMEDIATION_STATUS.md). Browser engines are exercised with fixtures; actual Safari/VoiceOver, production settings and approved dietary semantics still need owner review.

## Data quality, preferences and resource limits

Missing, invalid and out-of-range nutrient fields remain `null`; a supplied zero remains zero, including all-zero foods. Menus and plate items retain that distinction. Totals show known subtotals plus missing serving counts; variable/custom foods do not contribute assumed numbers. Plate items snapshot date, portion, nutrition and custom status when added. Distinct portions receive stable collision-safe IDs; reorder does not swap them, and a refreshed snapshot does not rewrite an existing plate. The user chose temporary plates: reload clears the plate. Goal bars stop at 100% and show numeric overage. Undo is not part of this pass.

Dietary/free-from labels and explicit contains/may-contain allergens are classified separately. Unrecognized labels are retained as source labels; conflicting free-from claims are excluded from filters. Missing labels never imply safety. Saved dietary preferences are informational and do not automatically filter menus; explicit menu filters remain available. Confirm allergy questions with Rutgers dining staff.

Preferences use a validated version-1 browser record. Valid legacy records are read and migrated on the next explicit edit; corrupt/future records are left untouched and use session defaults until cleared. No hydration effect writes storage. Blocked reads/writes and quota failures keep controls usable and report that changes were not saved. Other tabs adopt successful writes/deletion; explicit edits merge the latest readable record, with simultaneous whole-record writes following last-successful-write behavior. Clear local data removes KnightBite's preference key and resets the current plate without an automatic rewrite. This does not delete hosting/analytics records. Analytics remains enabled as requested; [Data and privacy](/privacy) describes the application's actual data boundaries without asserting unverified account retention or legal compliance.

Nutrislice requests use the fixed HTTPS Rutgers API origin. All redirects are rejected without following them. Atrium school and advertised meal identifiers come from the index; valid numeric identifiers are required. Returned `menu_type_id`, when supplied, must match, and the requested calendar date must match exactly. No linked nutrition URLs are followed.

Source responses are streamed with caps of 8 MiB for Nutrislice weekly responses and 2 MiB for schools. JSON retains depth (12), node (500,000 weekly; 60,000 otherwise), string (16,384 characters) and collection/key budgets. A meal permits at most 1,500 foods and 1,800 entries including headings. Excess input fails explicitly; accepted menus are never truncated. Sanitized Atrium Breakfast/Lunch/Dinner weeks fit these unchanged limits and regression tests conserve all requested-day foods. Further seasonal/peak and other-hall coverage remains incomplete.

The process-local daily cache retains at most 16 entries and an estimated 16 MiB. Obsolete Atrium HTML/label caches are removed. Each hall/Rutgers-date/meal also has a bounded shared cache (48 entries, estimated 16 MiB). Successful and explicitly empty meals retain 15 minutes from their own retrieval; failures expire after 30 seconds. A daily snapshot expires no later than its earliest meal expiry. Rebuilding a partial snapshot reuses successful sibling objects and timestamps, and requests only expired/missing meals. Schools retain a 12-hour single-entry cache, with concurrent discovery shared. Active shared loads are never evicted; admission fails if every slot is active. Capacity pressure may cause earlier settled eviction. Byte accounting estimates strings/serialized menu data, not total process RSS or Next's separate fetch cache. Local image optimization accepts only `/images/**`, uses WebP, and caps source bodies at 10 MiB and its disk cache at 100 MiB. Host-level memory, request/concurrency/rate limits require external verification.

## Menu ingestion logs

### Partial meal recovery

Lunch/Dinner timing out must not strand a cached Breakfast-only menu. The first load retains the existing three parallel 4.5-second body-inclusive meal requests (and 15-second hall / 1.1-second homepage display bounds). It does not automatically retry or raise deadlines. An explicit **Retry Breakfast/Lunch/Dinner** requests only that hall/date/meal through `/api/menu/[hallId]/[date]/[mealType]`; successful siblings and plate snapshots stay intact. Failed entries enforce a shared 30-second cooldown per process, with no automatic polling/retry loop. Concurrent daily loads and retry requests share the same in-flight meal. A retry needs at most one school lookup plus one meal request (9 seconds of existing upstream budgets); the client aborts after 12 seconds and the route declares a 15-second platform limit. The public route validates hall, meal and an actual calendar date within seven days of the Rutgers date, uses fixed Nutrislice destinations/redirect rejection/unchanged body and item limits, and returns private/no-store responses.

Current-day entry uses the existing hall-specific New York schedule even if its meal failed. Manual selection survives retries and rerenders. A missing/failed meal shows no foods or retrieval timestamp; a successfully returned explicit empty array/header-only meal says no items were returned, without implying closure. Missing dates, malformed collections or discarded invalid food are not proof of emptiness. Only real meal retrieval supplies its timestamp; recovering Dinner does not redatetime Breakfast. No fallback source, alternate date, sample menu or nutrient inference is introduced. The caches are per server process and may be cold/evicted on other function instances; this is not durable/global rate limiting or stored-menu recovery.

The Rutgers provider emits one JSON string with `event: "knightbite.menu_ingestion"` for each new daily hall/date load (`scope: "daily"`) and actual single-meal recovery attempt (`scope: "meal_retry"`, `requestedMeal`). It is visible in production through `console.info`, `console.warn`, or `console.error`. The attempt starts **after** the daily cache check: cached menus, cached unavailable results, and callers joining the same promise do not emit additional summaries. A new daily load can still use the existing school cache. Single-meal cache hits/shared retries do not duplicate recovery summaries. On a daily rebuild, `meals.*.cacheHit` distinguishes previously normalized results from newly fetched meals; normalization counters include the retained result’s original counts. Retry summaries leave unrequested siblings `not_started` and judge overall outcome only for the requested meal. Synchronous serialization and safe console handling remain unchanged.

| Field | Meaning |
| --- | --- |
| `event` | Stable event name, `knightbite.menu_ingestion`. |
| `source` | `nutrislice` for all four halls. |
| `hallId` | Supported hall identifier; invalid internal input is logged as `unknown`. |
| `requestedDate` | Requested menu calendar date (`YYYY-MM-DD`), separate from execution time; invalid internal format becomes `null`. It does not claim that every source independently validated all returned context. |
| `startedAt`, `durationMs` | UTC ISO attempt start and elapsed milliseconds until the daily loader exits. Its `finally` block synchronously builds, serializes, and emits the summary. A whole-day exception can return `null` while sibling meals remain unfinished; logging never waits for them. |
| `outcome` | Overall result and severity, defined below. |
| `schoolResolution` | `discovered` from the school response, `cached` from the school cache, `static_fallback` when discovery did not resolve the hall, `unavailable` when no usable mapping exists, `not_started` if resolution never finished. Static mapping is the existing upstream school-ID fallback, never sample food. |
| `returned` | Actual returned `meals`, `stations`, and `items`, after normalization and deduplication. All are zero when the provider returns `null`, even if individual meals parsed successfully. |
| `meals` | Fixed `breakfast`, `lunch`, and `dinner` entries. Each includes `outcome`, `parsed`, normalization progress, failures, and enrichment counts. |
| `meals.*.parsed` | Post-normalization/deduplication station and item counts before daily usability checks. `null` if not measured; zeroes only when parsing completed empty. |
| `meals.*.normalizationStarted`, `normalizationCompleted` | Whether normalization began and reached its end. An exception may leave observed counters incomplete. |
| `meals.*.enrichment` | Reserved zero-valued compatibility fields. Nutrition is inline; no enrichment requests are issued. Zero operations never proves complete nutrition. |
| `diagnostics.normalization` | Existing counters, described below; `null` if no meal reached normalization. |
| `diagnostics.normalizationComplete` | `null` if normalization never began; otherwise whether every meal that began normalization completed it. It does not mean all three meals were retrieved. |
| `diagnostics.parserWarnings` | Observed parser/validator warning count, without interpreting missing nutrition as a transport failure. Existing internal warnings used by usability rules remain unchanged. |
| `failures`, `meals.*.failures` | Attempt-wide (school/daily) or per-meal grouped failures. Each group has `category`, `endpoint`, nullable `statusCode`, nullable `reason`, and occurrence `count`. Enrichment failures stay in their own collection. |
| `omittedFailureCount` | Occurrences omitted after a collection's limit of 16 distinct failure groups; each collection has its own counter. Existing groups keep aggregating. |

Normalization counters describe the work observed, not raw response size: `processedItemsBeforeDedup` counts normalized candidates before deduplication, including existing custom placeholders, and excludes dropped entries. `droppedItems` and `deduplicatedItems` count separate events. `itemsWithMeaningfulNutritionBeforeDedup` / `itemsWithoutMeaningfulNutritionBeforeDedup` count any usable supplied nutrient, including a verified zero; `meaningfulOrCustomItemsBeforeDedup` also includes custom items. None proves complete or accurate nutrition. `blankStationHeaders`, `blankItemNames`, `fallbackStationLabels`, and `invalidNutritionFields` count existing diagnostic occurrences (not necessarily distinct items/stations). If `normalizationComplete` is false, counters represent only the observed portion; use `meals.*.parsed` to identify unavailable measurements.

| Overall outcome | Severity | Meaning |
| --- | --- | --- |
| `success` | `console.info` | A real menu returned, all requested meals parsed (three for daily scope, one for meal_retry), and no categorized retrieval/discovery issues were recorded. Normalization counters may still report corrections or missing nutrition. |
| `partial` | `console.warn` | A real menu returned with an unparsed/failed/rejected/empty meal, a discovery fallback issue, an observed shape issue, or categorized retrieval issues. |
| `unavailable` | `console.warn` | Existing loading/usability behavior returned `null`; inspect failure categories and parsed counts. |
| `error` | `console.error` | An exception escaped the daily load. The existing provider catch still returns `null`; categorized details are retained and arbitrary exception messages are excluded. |

Per-meal outcomes are `parsed` (a section normalized; daily usability can still reject it), `empty` (normalization completed without items), `rejected` (reserved legacy outcome), `failed` (retrieval/processing could not produce a section), `not_started` (an earlier failure prevented the meal from starting), and `pending` (a sibling meal was unfinished when the daily loader exited). Early-error summaries preserve pending states, `null` parsed measurements, and incomplete normalization flags. Counters reflect only work observed at exit. Later sibling completion or rejection neither changes the serialized record nor emits another summary; the existing daily `Promise.all` still handles those rejections.

| Failure category | Evidence / interpretation |
| --- | --- |
| `timeout` | The existing upstream fetch deadline aborted the request. The homepage's 1.1-second display deadline never produces this category. |
| `http_error` | Non-success HTTP response; `statusCode` records its status. |
| `request_error` | Fetch or body-read failure without an observed provider timeout or HTTP status. |
| `malformed_json` | JSON decoding raised a syntax error. |
| `unexpected_shape` | A narrowly observed collection/context shape differs from the provider's expected shape. Malformed required collections are rejected before normalization; optional issues remain categorized. |
| `parse_error` | An exception while interpreting school or menu data that lacks a more specific recorded category. |
| `requested_date_missing` | A Nutrislice `days` array provided no matching requested date. This is not a closure claim. |
| `context_rejected` | Reserved legacy category. Atrium now uses Nutrislice school/meal/date checks; obsolete HTML context validation is removed. |
| `no_items` | Parsing/normalization completed without retained items; this does not establish an intentionally empty Rutgers meal. |
| `unusable_menu` | At least one meal parsed, but the existing daily usability rules rejected the result. |
| `school_mapping_missing` | Discovery did not match the hall or the resolved school had no usable ID. `schoolResolution` shows whether existing static mapping recovered. |
| `internal_error` | An unexpected exception outside the categorized request/processing paths. |
| `destination_rejected` | Disallowed source destination or redirect; no request to the redirect target is made. |
| `response_too_large` | A declared or streamed response exceeded its byte limit. |
| `resource_limit` | A structural, item-count or active-cache admission budget was exceeded. |

Endpoints are `schools`, `menu`, `normalization`, or `ingestion`; `nutrition_label` is a reserved legacy value. Only bounded categories, valid status codes and counts enter production summaries. No upstream bodies, URLs, headers, ingredients, names, preferences or arbitrary error messages are logged. Collections keep their 16-group bound.

To investigate unavailable menus, filter by the event, hall, requested date, and attempt time. Inspect overall and per-meal failures: `timeout` / `http_error` / `request_error` identify upstream transport problems, while `requested_date_missing`, `school_mapping_missing` and `unexpected_shape` identify rejected date, school/meal mapping or payload context. `unusable_menu` plus nonzero parsed counts means data reached the existing usability check. Inspect inline nutrition coverage separately, and inspect `schoolResolution: "static_fallback"` plus attempt failures for discovery problems that recovered. These categories never establish that the hall is closed.

Sanitized illustrative logs follow. Each block is a complete record, formatted across lines for readability; actual output is one JSON string per attempt. Times/counts are examples, not evidence of live availability.

Success (`console.info`):

```json
{
  "event": "knightbite.menu_ingestion", "source": "nutrislice", "hallId": "busch", "requestedDate": "2026-09-08",
  "startedAt": "2026-09-08T16:00:00.000Z", "durationMs": 420, "outcome": "success", "schoolResolution": "discovered",
  "returned": {"meals": 3, "stations": 3, "items": 6},
  "meals": {
    "breakfast": {"outcome": "parsed", "parsed": {"stations": 1, "items": 2}, "normalizationStarted": true, "normalizationCompleted": true, "failures": [], "omittedFailureCount": 0, "enrichment": {"attemptedItems": 0, "failedItems": 0, "skippedItems": 0, "failures": [], "omittedFailureCount": 0}},
    "lunch": {"outcome": "parsed", "parsed": {"stations": 1, "items": 2}, "normalizationStarted": true, "normalizationCompleted": true, "failures": [], "omittedFailureCount": 0, "enrichment": {"attemptedItems": 0, "failedItems": 0, "skippedItems": 0, "failures": [], "omittedFailureCount": 0}},
    "dinner": {"outcome": "parsed", "parsed": {"stations": 1, "items": 2}, "normalizationStarted": true, "normalizationCompleted": true, "failures": [], "omittedFailureCount": 0, "enrichment": {"attemptedItems": 0, "failedItems": 0, "skippedItems": 0, "failures": [], "omittedFailureCount": 0}}
  },
  "diagnostics": {"normalization": {"processedItemsBeforeDedup": 6, "droppedItems": 0, "deduplicatedItems": 0, "itemsWithMeaningfulNutritionBeforeDedup": 6, "itemsWithoutMeaningfulNutritionBeforeDedup": 0, "meaningfulOrCustomItemsBeforeDedup": 6, "blankStationHeaders": 0, "blankItemNames": 0, "fallbackStationLabels": 0, "invalidNutritionFields": 0}, "normalizationComplete": true, "parserWarnings": 0},
  "failures": [], "omittedFailureCount": 0
}
```

Partial results use `console.warn` and retain surviving meals under their own labels.

Unavailable after upstream timeouts (`console.warn`):

```json
{
  "event": "knightbite.menu_ingestion", "source": "nutrislice", "hallId": "busch", "requestedDate": "2026-09-08",
  "startedAt": "2026-09-08T16:00:00.000Z", "durationMs": 4500, "outcome": "unavailable", "schoolResolution": "cached",
  "returned": {"meals": 0, "stations": 0, "items": 0},
  "meals": {
    "breakfast": {"outcome": "failed", "parsed": null, "normalizationStarted": false, "normalizationCompleted": false, "failures": [{"category": "timeout", "endpoint": "menu", "statusCode": null, "reason": null, "count": 1}], "omittedFailureCount": 0, "enrichment": {"attemptedItems": 0, "failedItems": 0, "skippedItems": 0, "failures": [], "omittedFailureCount": 0}},
    "lunch": {"outcome": "failed", "parsed": null, "normalizationStarted": false, "normalizationCompleted": false, "failures": [{"category": "timeout", "endpoint": "menu", "statusCode": null, "reason": null, "count": 1}], "omittedFailureCount": 0, "enrichment": {"attemptedItems": 0, "failedItems": 0, "skippedItems": 0, "failures": [], "omittedFailureCount": 0}},
    "dinner": {"outcome": "failed", "parsed": null, "normalizationStarted": false, "normalizationCompleted": false, "failures": [{"category": "timeout", "endpoint": "menu", "statusCode": null, "reason": null, "count": 1}], "omittedFailureCount": 0, "enrichment": {"attemptedItems": 0, "failedItems": 0, "skippedItems": 0, "failures": [], "omittedFailureCount": 0}}
  },
  "diagnostics": {"normalization": null, "normalizationComplete": null, "parserWarnings": 0},
  "failures": [], "omittedFailureCount": 0
}
```

Limits: these records describe ingestion attempts, not every page view, distinct upstream requests, usage metrics, or uptime. A homepage can stop waiting while ingestion continues; its display deadline is not an ingestion failure. Request deadlines now cover fetch and body consumption and abort timed-out work. The timer also settles the caller when a fetch implementation ignores abort. CPU-bound parsing can still delay timers; these are not process-level execution limits. Early-error summaries may include unfinished sibling work and omit its later outcomes; no follow-up summary is emitted. Process termination or a failed console sink can still prevent delivery. Logs do not expose body contents or guarantee diagnosis of every upstream schema change. No production log retention, alerting, dashboard, external monitoring, or stored-real-menu recovery was added. Correctly dated stored-real-menu recovery remains future work.

## Preview QA Checklist

Use this checklist before sharing a preview link. Follow [protected hosted verification](docs/PREVIEW_VERIFICATION.md) and leave [human signoffs](docs/RELEASE_HUMAN_SIGNOFF.md) unsigned until performed:

- Confirm `npm run check`, `npm audit --audit-level=moderate` and `git diff --check` pass using the pinned runtime.
- In production mode, exercise successful, partial, and unavailable loads with stubbed upstream responses. Verify one `knightbite.menu_ingestion` summary per new daily load, categorized failures and safe counts, and no extra summaries for cache hits/shared callers. Verify Atrium summaries identify Nutrislice and that no FoodProNet or mock requests occur.
- Open each hall, including Atrium, and verify successful Rutgers menus retain their items, meal switching, search, and nutrition.
- Verify initial meal selection against the shared typical hall schedule in America/New_York: current meal, next meal during gaps/before opening, last meal after closing; non-today dates start with the first chronological listed meal. Keep all three controls available. If the scheduled meal is missing, keep it selected and display its meal-specific unavailable message and accessible retry action; never silently switch to Breakfast. A stale server/prefetch hint must be corrected once on client entry; manual choices survive search, filters, plate changes and same-menu refreshes. Exercise homepage navigation at controlled 6pm and verify displayed content against the requested source meal; use distinguishable synthetic meals to prove all three handlers and retain genuinely identical live Lunch/Dinner lists, on desktop and mobile.
- Check muted empty stations say “No items listed for breakfast/lunch/dinner,” remain keyboard/touch selectable, and do not claim closure. Unretrieved menus say “Menu status unavailable.” Search/dietary filters must not change station availability. Do not infer breakfast cook-to-order closure: Rutgers documents omelets. See [meal and station behavior](docs/MEAL_SELECTION_AND_STATIONS.md).
- In protected Preview only, `/preview-check/meals` uses a controlled 6pm New York client entry with a stale Breakfast server hint over an actual returned Busch menu; `?hall=livingston` checks Livingston. Use “Rerender same menu” after a manual selection and confirm its displayed food stays selected. Dinner must be selected when returned; unavailable data never becomes fixture food. Confirm this route returns 404 in normal Production builds.
- Simulate stalled response bodies, an unresponsive provider, redirects and school discovery failures. Verify loading remains visible, the hall loader exits within its 15-second display deadline, and retrieved foods retain honest incomplete inline nutrition. Check same-name portion variants have separate rows and plate entries.
- For Atrium, test wrong/missing/conflicting index identity, advertised meal types and returned dates. Verify no FoodProNet, other date or mock requests occur; surviving meals still render, and all-failed days show unavailable.
- Simulate null responses and provider exceptions. Verify hall pages show “Menu unavailable right now” and no sample items, source badge, or update timestamp; the header must use the requested Rutgers date, including near UTC midnight.
- Simulate a homepage request exceeding 1.1 seconds. Verify the hall says “Menu status unavailable,” with no backup label or invented update time. Repeat for null responses and errors, during both open and closed hours.
- Check mixed homepage results: count only confirmed real menus, and show “Menu status could not be confirmed” when none are confirmed. Confirm hours remain independent of retrieval status.
- Check that real menus show an update time only if they supply one. Deliberately rendered mock menus should say “Sample menu,” never “Backup menu.”
- Add complete, partial, unknown, verified-zero and variable foods; confirm known subtotals and missing coverage update. Add 120/240-calorie portion variants separately and confirm 360 calories.
- Test blocked/full storage, legacy/malformed/future records, reload persistence, two-tab edits and clear-local-data without reappearing values.
- Open the plate by keyboard, traverse both directions, close with Escape and verify focus returns. Confirm named quantity controls and checked switch states at narrow widths and enlarged text.
- Check the nutrition disclaimer appears only when items have missing or variable nutrition.
- Verify station jump pills scroll to the correct sections on long menus.
- Test the plate sheet open/close gestures on mobile and confirm the page behind it does not move.

Atrium custom-size nutrition follows the unambiguous matching `food_sizes` entry used by the published Nutrislice interface, then passes through the unchanged nutrient normalization rules. Observed oatmeal demonstrates why: the default 6 oz size says 3g protein / 0g sugar while the top-level record says 4g / 1g. When a size table is supplied, missing or ambiguous matching records/fields remain unknown, with no aggregate or alternate-size fill; without a size table, the existing inline aggregate is normalized. Other halls retain their previous nutrient-field selection. This is portion alignment, not independent nutrient verification.

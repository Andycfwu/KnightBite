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
- Atrium FoodProNet responses must establish the returned date, location, and meal before any items or nutrition labels are accepted. Validation cross-checks the selected date text, active meal tab, enclosing nutrition-report form, and Atrium-specific menu footer; an echoed request URL or location heading alone is insufficient. Missing, malformed, ambiguous, or conflicting context rejects that meal. Other validated meals retain the existing usability rules; if none are usable, the loader returns `null` without mock fallback.
- The [FoodProNet fixture notes](tests/fixtures/foodpronet/README.md) document the actual September 8, 2026 inspection, evidence, sanitized excerpts, and synthetic test variants. Metadata agreement does not prove real-time food inventory or guarantee upstream accuracy. Source markup/footer changes may reduce Atrium availability; cache lifetimes and request deadlines remain unchanged; the resource and destination bounds below now apply.
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

Atrium's September 9 map follows the supplied drawing with the entrance at the bottom. Rutgers' panorama was explored to identify the two refrigerated grab-and-go islands, snack display, checkout row and R feature wall. The circular symbol at the left is mapped to soup/salad using the sketch and Rutgers' separate salad-counter photograph; its contour is schematic. Seven food areas have eight clickable locations, since the refrigerated displays share a menu group. Exact FoodProNet labels connect each brand's main dishes, bases, toppings and sides without changing source data. Checkout and the snack display remain in the artwork without text labels. The revised artwork adds a continuous lower walkway to Scarlet Ginger, places the entrance directly beneath Soup & salad, retains the separate exit below checkout, and removes the R wall label. The illustration's known contour differences, reference links and generation prompt are documented in `public/images/ATRIUM-MAP.md`. Automated checks cover grouping, item conservation, unknown sections, breakfast yogurt, and unavailable/real/sample states. Panorama inspection was reference research; no browser interaction tests of the local Atrium page were performed.

## Loading safeguards

Atrium starts nutrition-label requests for at most six seconds per meal, with the existing six workers and 2.5-second request limit. Requests already started can finish within that limit, so enrichment takes at most about 8.5 seconds plus processing. Remaining labels are skipped, and the retrieved items keep the existing missing/variable-nutrition presentation; no sample food or nutrition values are substituted. Skipped labels are counted separately in the ingestion summary. Context validation, meal/item conservation and cache lifetimes remain in place. Resource and nutrition-quality checks below reject unsafe input and preserve unknown values.

Atrium and Nutrislice portions that share a source identity but survive the existing deduplication rules receive distinct item IDs, so switching meals/search results cannot duplicate rows and different portions remain separate on the plate. Existing noncolliding IDs are preserved.

Nutrislice’s 4.5-second deadline and FoodProNet’s 5-second menu / 2.5-second label deadlines cover both headers and response bodies. The shared 15-second caller deadline provides a final way out if provider work still stalls. It returns an honest unavailable result; it does not cancel shared provider work or emit an invented upstream timeout. Ingestion summaries still emit synchronously when the daily loader itself exits. Detailed label errors are aggregated rather than logged once per item, including in development.

Run only one Next.js development server per checkout: two servers sharing `.next` can corrupt each other’s build cache. Stop the development server before `npm run build`, then restart it. This hardening pass adds no persistence, retries, or monitoring infrastructure.

## Automated checks

Use the Node 24 LTS version in `.nvmrc` (24.21.0 for this pass), then `npm ci`. Vercel currently supplies 24.19.0; both versions must pass the full release gate. `prebuild` rejects runtimes below the reviewed floor and records build/native versions. See [runtime policy](docs/RUNTIME_POLICY.md) for the security assessment and managed-host limitations. Global Node was not changed by remediation.

- `npm test`: offline Node/tsx regressions, including controlled deadlines, single synchronous failure summaries, SSRF rejection, returned-label context checks, missing/zero nutrition, portion identity, storage faults, dietary labels, and cache/response bounds.
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

Atrium label requests allow only HTTPS `menuportal23.dining.rutgers.edu/FoodPronet/label.aspx`, location 13, the requested date and a numeric recipe/portion. Credentials, alternate endpoints, traversal, unexpected/duplicate parameters and all redirects are rejected before any redirected request. Explicit returned recipe/date/location form fields must agree when present. The captured label excerpts do not contain independent food-identity metadata; matching a request URL alone cannot verify upstream content accuracy. A new sanitized full-label capture is needed for any additional title/identity selectors.

Source responses are streamed with caps of 8 MiB for Nutrislice weekly responses, 2 MiB for FoodProNet menu pages/schools, and 256 KiB for labels. JSON has depth (12), node (500,000 for weekly responses; 60,000 otherwise), string (16,384 characters) and collection/key budgets. A meal has at most 1,500 food candidates and 1,800 entries including headings. Excess input fails explicitly; accepted menus are not truncated. The initial shared 2 MiB/60,000-node cap rejected legitimate weekly responses during the concurrent UI task’s separate live check. Weekly budgets now account for seven days of repeated metadata; an offline response above the old limits preserves all 400 requested-day items. Captured Atrium rows (338–341) fit the per-meal cap. Representative full-week production-size calibration remains required; this pass made no live provider requests.

Process-local daily/menu-page/label caches retain at most 16/12/128 entries and estimated 16/8/8 MiB, respectively. Settled entries expire at the existing TTLs (15 minutes; unavailable daily results 2 minutes); schools retain the existing 12-hour single-entry cache. Active shared loads are never evicted; admission fails if every slot is active. Capacity pressure may cause earlier settled eviction. Byte accounting estimates strings/serialized menu data, not total process RSS or Next's separate fetch cache. Local image optimization accepts only `/images/**`, uses WebP, and caps source bodies at 10 MiB and its disk cache at 100 MiB. Host-level memory, request/concurrency/rate limits require external verification.

## Menu ingestion logs

The Rutgers provider emits one JSON string with `event: "knightbite.menu_ingestion"` for each new daily hall/date load. It is visible in production through `console.info`, `console.warn`, or `console.error`. The attempt starts **after** the daily cache check: cached menus, cached unavailable results, and callers joining the same promise do not emit additional summaries. A new daily load can still use the existing school, menu-page, or nutrition-label caches. No cache keys, TTLs, request deadlines, concurrency limits, acceptance rules, or menu results were changed for logging.

| Field | Meaning |
| --- | --- |
| `event` | Stable event name, `knightbite.menu_ingestion`. |
| `source` | `nutrislice` for Busch/Livingston/Neilson; `foodpronet` for Atrium. |
| `hallId` | Supported hall identifier; invalid internal input is logged as `unknown`. |
| `requestedDate` | Requested menu calendar date (`YYYY-MM-DD`), separate from execution time; invalid internal format becomes `null`. It does not claim that every source independently validated all returned context. |
| `startedAt`, `durationMs` | UTC ISO attempt start and elapsed milliseconds until the daily loader exits. Its `finally` block synchronously builds, serializes, and emits the summary. A whole-day exception can return `null` while sibling meals remain unfinished; logging never waits for them. |
| `outcome` | Overall result and severity, defined below. |
| `schoolResolution` | `discovered` from the school response, `cached` from the school cache, `static_fallback` when discovery did not resolve the hall, `unavailable` when no usable mapping exists, `not_started` if resolution never finished, or `not_applicable` for Atrium. Static mapping is the existing upstream school-ID fallback, never sample food. |
| `returned` | Actual returned `meals`, `stations`, and `items`, after normalization and deduplication. All are zero when the provider returns `null`, even if individual meals parsed successfully. |
| `meals` | Fixed `breakfast`, `lunch`, and `dinner` entries. Each includes `outcome`, `parsed`, normalization progress, failures, and enrichment counts. |
| `meals.*.parsed` | Post-normalization/deduplication station and item counts before daily usability checks. `null` if not measured; zeroes only when parsing completed empty. |
| `meals.*.normalizationStarted`, `normalizationCompleted` | Whether normalization began and reached its end. An exception may leave observed counters incomplete. |
| `meals.*.enrichment` | `attemptedItems`, `failedItems`, `skippedItems`, grouped `failures`, and `omittedFailureCount` for nutrition-label enrichment. `skippedItems` counts labels not started because the meal’s enrichment budget elapsed; these are not failed requests. Counts are affected item operations, including duplicate items before deduplication; shared label promises mean these are **not distinct HTTP request counts**. Zero attempted operations does not establish nutrition completeness. |
| `diagnostics.normalization` | Existing counters, described below; `null` if no meal reached normalization. |
| `diagnostics.normalizationComplete` | `null` if normalization never began; otherwise whether every meal that began normalization completed it. It does not mean all three meals were retrieved. |
| `diagnostics.parserWarnings` | Observed parser/validator warning count, excluding failed label-enrichment operations. Existing internal warnings used by usability rules remain unchanged. |
| `failures`, `meals.*.failures` | Attempt-wide (school/daily) or per-meal grouped failures. Each group has `category`, `endpoint`, nullable `statusCode`, nullable `reason`, and occurrence `count`. Enrichment failures stay in their own collection. |
| `omittedFailureCount` | Occurrences omitted after a collection's limit of 16 distinct failure groups; each collection has its own counter. Existing groups keep aggregating. |

Normalization counters describe the work observed, not raw response size: `processedItemsBeforeDedup` counts normalized candidates before deduplication, including existing custom placeholders, and excludes dropped entries. `droppedItems` and `deduplicatedItems` count separate events. `itemsWithMeaningfulNutritionBeforeDedup` / `itemsWithoutMeaningfulNutritionBeforeDedup` count any usable supplied nutrient, including a verified zero; `meaningfulOrCustomItemsBeforeDedup` also includes custom items. None proves complete or accurate nutrition. `blankStationHeaders`, `blankItemNames`, `fallbackStationLabels`, and `invalidNutritionFields` count existing diagnostic occurrences (not necessarily distinct items/stations). If `normalizationComplete` is false, counters represent only the observed portion; use `meals.*.parsed` to identify unavailable measurements.

| Overall outcome | Severity | Meaning |
| --- | --- | --- |
| `success` | `console.info` | A real menu returned, all three meals parsed, and no categorized retrieval/discovery/enrichment issues were recorded. Normalization counters may still report corrections or missing nutrition. |
| `partial` | `console.warn` | A real menu returned with an unparsed/failed/rejected/empty meal, a discovery fallback issue, an observed shape issue, or failed/skipped nutrition enrichment. |
| `unavailable` | `console.warn` | Existing loading/usability behavior returned `null`; inspect failure categories and parsed counts. |
| `error` | `console.error` | An exception escaped the daily load. The existing provider catch still returns `null`; categorized details are retained and arbitrary exception messages are excluded. |

Per-meal outcomes are `parsed` (a section normalized; daily usability can still reject it), `empty` (normalization completed without items), `rejected` (Atrium context failed validation), `failed` (retrieval/processing could not produce a section), `not_started` (an earlier failure prevented the meal from starting), and `pending` (a sibling meal was unfinished when the daily loader exited). Early-error summaries preserve pending states, `null` parsed measurements, and incomplete normalization flags. Counters reflect only work observed at exit. Later sibling completion or rejection neither changes the serialized record nor emits another summary; the existing daily `Promise.all` still handles those rejections.

| Failure category | Evidence / interpretation |
| --- | --- |
| `timeout` | The existing upstream fetch deadline aborted the request. The homepage's 1.1-second display deadline never produces this category. |
| `http_error` | Non-success HTTP response; `statusCode` records its status. |
| `request_error` | Fetch or body-read failure without an observed provider timeout or HTTP status. |
| `malformed_json` | JSON decoding raised a syntax error. |
| `unexpected_shape` | A narrowly observed collection/context shape differs from the provider's expected shape. Malformed required collections are rejected before normalization; optional issues remain categorized. |
| `parse_error` | An exception while interpreting school data, menu data, or a nutrition label that lacks a more specific recorded category. |
| `requested_date_missing` | A Nutrislice `days` array provided no matching requested date. This is not a closure claim. |
| `context_rejected` | Atrium's validator rejected the returned page before items/labels were accepted. `reason` contains its controlled concise reason; an unrecognized future reason is reduced to `unrecognized_context_reason`. |
| `no_items` | Parsing/normalization completed without retained items; this does not establish an intentionally empty Rutgers meal. |
| `unusable_menu` | At least one meal parsed, but the existing daily usability rules rejected the result. |
| `school_mapping_missing` | Discovery did not match the hall or the resolved school had no usable ID. `schoolResolution` shows whether existing static mapping recovered. |
| `internal_error` | An unexpected exception outside the categorized request/processing paths. |
| `destination_rejected` | Disallowed source destination or redirect; no request to the redirect target is made. |
| `response_too_large` | A declared or streamed response exceeded its byte limit. |
| `resource_limit` | A structural, item-count or active-cache admission budget was exceeded. |

Endpoints are `schools`, `menu`, `nutrition_label`, `normalization`, or `ingestion`. Only bounded categories, valid HTTP status codes, controlled Atrium reasons, and counts enter production summaries. There are no upstream bodies, full URLs, headers, ingredients, item names, user preferences, or arbitrary exception messages. Each summary has three meal entries and at most 16 groups per failure collection; repeated enrichment failures increase counts instead of producing one log per label. Development retains useful detailed diagnostics; its redundant old normalization-count summary was removed.

To investigate unavailable menus, filter by the event, hall, requested date, and attempt time. Inspect overall and per-meal failures: `timeout` / `http_error` / `request_error` identify upstream transport problems, while `context_rejected` identifies a retrieved Atrium page whose date/location/meal evidence was not accepted. `unusable_menu` plus nonzero parsed counts means data reached the existing usability check. Inspect enrichment separately, and inspect `schoolResolution: "static_fallback"` plus attempt failures for discovery problems that recovered. These categories never establish that the hall is closed.

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

Partial result with rejected Atrium breakfast (`console.warn`):

```json
{
  "event": "knightbite.menu_ingestion", "source": "foodpronet", "hallId": "atrium", "requestedDate": "2026-09-08",
  "startedAt": "2026-09-08T16:00:00.000Z", "durationMs": 850, "outcome": "partial", "schoolResolution": "not_applicable",
  "returned": {"meals": 2, "stations": 2, "items": 4},
  "meals": {
    "breakfast": {"outcome": "rejected", "parsed": null, "normalizationStarted": false, "normalizationCompleted": false, "failures": [{"category": "context_rejected", "endpoint": "menu", "statusCode": null, "reason": "missing or ambiguous selected date", "count": 1}], "omittedFailureCount": 0, "enrichment": {"attemptedItems": 0, "failedItems": 0, "skippedItems": 0, "failures": [], "omittedFailureCount": 0}},
    "lunch": {"outcome": "parsed", "parsed": {"stations": 1, "items": 2}, "normalizationStarted": true, "normalizationCompleted": true, "failures": [], "omittedFailureCount": 0, "enrichment": {"attemptedItems": 2, "failedItems": 0, "skippedItems": 0, "failures": [], "omittedFailureCount": 0}},
    "dinner": {"outcome": "parsed", "parsed": {"stations": 1, "items": 2}, "normalizationStarted": true, "normalizationCompleted": true, "failures": [], "omittedFailureCount": 0, "enrichment": {"attemptedItems": 2, "failedItems": 0, "skippedItems": 0, "failures": [], "omittedFailureCount": 0}}
  },
  "diagnostics": {"normalization": {"processedItemsBeforeDedup": 4, "droppedItems": 0, "deduplicatedItems": 0, "itemsWithMeaningfulNutritionBeforeDedup": 4, "itemsWithoutMeaningfulNutritionBeforeDedup": 0, "meaningfulOrCustomItemsBeforeDedup": 4, "blankStationHeaders": 0, "blankItemNames": 0, "fallbackStationLabels": 0, "invalidNutritionFields": 0}, "normalizationComplete": true, "parserWarnings": 1},
  "failures": [], "omittedFailureCount": 0
}
```

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
- In production mode, exercise successful, partial, and unavailable loads with stubbed upstream responses. Verify one `knightbite.menu_ingestion` summary per new daily load, categorized failures and safe counts, and no extra summaries for cache hits/shared callers. Check nutrition-label failures under enrichment, independently of menu-fetch failures.
- Open each hall, including Atrium, and verify successful Rutgers menus retain their items, meal switching, search, and nutrition.
- Verify initial meal selection against the shared typical hall schedule in America/New_York: current meal, next meal during gaps/before opening, last meal after closing; non-today dates start with the first chronological listed meal. If the expected meal is missing, show the next listed meal or the last available meal under its own label. Manual choices survive search, filters, plate changes and same-menu refreshes.
- Check muted empty stations say “No items listed for breakfast/lunch/dinner,” remain keyboard/touch selectable, and do not claim closure. Unretrieved menus say “Menu status unavailable.” Search/dietary filters must not change station availability. Do not infer breakfast cook-to-order closure: Rutgers documents omelets. See [meal and station behavior](docs/MEAL_SELECTION_AND_STATIONS.md).
- In protected Preview only, `/preview-check/meals` uses a controlled 6pm New York entry over an actual returned Busch menu. Dinner must be selected when returned; unavailable data never becomes fixture food. Confirm this route returns 404 in normal Production builds.
- Simulate stalled response bodies, an unresponsive provider, and successive slow Atrium label batches. Verify loading remains visible, the hall loader exits within its 15-second display deadline, and retrieved foods retain honest incomplete nutrition when labels are skipped. Check same-name portion variants have separate rows and plate entries.
- For Atrium, test wrong/missing/conflicting returned date, location, and meal context. Verify rejected meals fetch no nutrition labels and contribute no items; other validated usable meals still render, and all-rejected days show unavailable.
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

from pathlib import Path
import json, collections, re
base=Path('docs/audits/production-readiness-2026-09-10')
# Each tuple is ID, applicability, status, priority, observation, evidence, actions.
rows=[]
def row(id,status,priority,actual,evidence,actions='—',app='YES'):
 rows.append((id,app,status,priority,actual,evidence,actions))
def excluded(id,reason,evidence): row(id,'UNKNOWN','—','Not assessed: out of scope. '+reason,evidence,app='NO')
row('ARC-01','PASS','—','One Next.js web release; menu browsing, station maps, plate and preferences have real entry points.','app/page.tsx:106-117; app/hall/[hallId]/page.tsx:14-25; package.json:5-11')
row('ARC-02','PARTIAL','P2','Live and unavailable states are real; sample fallback is isolated. Profile filters remain a labeled placeholder; operating hours are static.','lib/menu.ts:13-30; components/profile/ProfileScreen.tsx:17-35; app/page.tsx:15-26','A014')
row('ARC-03','FAIL','P1','Hall IDs are allowlisted, but upstream HTML can choose an outbound label host.','lib/menu.ts:9-10; lib/providers/rutgers-provider.ts:528-529,777-800,865; evidence/audit-probes.json','A002')
row('ARC-04','PARTIAL','P1','Public upstreams and cache policy are identifiable; operating owner, hosting and recovery expectations are not evidenced.','lib/providers/rutgers-provider.ts:6-19; README.md:169; no deployment configuration in initial inventory','A011')
row('ARC-05','PARTIAL','P1','Failure scenarios have tests; malicious links, resource exhaustion and storage denial were not covered by the existing suite. This audit supplies a threat map.','tests/menu-ingestion-logs.test.tsx:31-61; evidence/audit-probes.json','A002 A005 A007 A012')
row('DATA-01','PARTIAL','P1','Browser preferences, transient plate, public menus and logs are mapped below; provider analytics/account retention is unknown.','hooks/useUserPreferences.tsx:32,71-112; hooks/usePlate.tsx:31-32; app/layout.tsx:20','A009 A011')
row('DATA-02','PARTIAL','P1','Preferences are plaintext origin storage. No app credentials or server user database observed; HTTPS/cloud access and at-rest protection remain unverified.','hooks/useUserPreferences.tsx:73-111; lib/providers/rutgers-provider.ts:6-7; evidence/runtime-results.json','A009 A011')
row('DATA-03','FAIL','P1','Preference reads recover, but writes can throw without handling. Plate is memory only.','hooks/useUserPreferences.tsx:71-112; hooks/usePlate.tsx:31-32; evidence/audit-probes.json','A005 A013')
row('DATA-04','FAIL','P1','Range checks exist, but nutrition presence is lost and Nutrislice portion IDs can collide; schemas rely substantially on casts.','lib/providers/rutgers-provider.ts:293-330,410-412,1080-1126; evidence/audit-probes.json','A003 A004 A007')
row('DATA-05','PARTIAL','P2','Cache TTL prevents fresh reads of expired entries but does not evict old date/URL keys; preferences have no expiry.','lib/providers/rutgers-provider.ts:174-178,532-550,1380-1409; hooks/useUserPreferences.tsx:100-112','A007 A009')
row('DATA-06','PARTIAL','P1','Clear plate and reset goals exist; no unified clear-preferences control, export policy or analytics deletion scope is documented.','components/plate/PlateScreen.tsx:88-94; hooks/useUserPreferences.tsx:123-131; components/profile/ProfileScreen.tsx:42-52','A009 A013')
row('DATA-07','PARTIAL','P2','Functional state updates avoid ordinary click races. Two tabs can overwrite the shared preferences record; no account isolation is promised.','hooks/usePlate.tsx:34-69; hooks/useUserPreferences.tsx:100-131; no storage-event subscription in this module','A013 A009')
excluded('DATA-08','No irreplaceable server records; menus can be refetched, plate is a temporary calculation and goals can be re-entered. No enterprise backup requirement inferred.','hooks/usePlate.tsx:31-32; hooks/useUserPreferences.tsx:34-44; README.md:22')
row('SEC-01','PASS','—','No secret-pattern matches in the scoped local scan: 95 workspace text files, 181 reachable Git text blobs (10 commits), 52 existing build files. Not a universal absence claim.','evidence/secret-scan.json; evidence/initial-snapshot.json')
row('SEC-02','PARTIAL','P2','App has no provider API secrets; common env files are ignored. Deployment credentials and rotation/access policy are unknown; other .env variants are not ignored.','.gitignore:1-6; lib/providers/rutgers-provider.ts:6-7,494; no credential injection in app inventory','A011 A012')
row('SEC-03','PASS','—','Current operations are intentionally public and browser local; account balance navigation leaves the app for Rutgers CAS. No pretend login.','components/profile/ProfileScreen.tsx:75-104; app/plate/page.tsx:1-5; app/profile/page.tsx:1-5')
row('SEC-04','PASS','—','Within app scope, no private remote objects/actions exist. Hall path is resolved against four known halls before fetch.','app/hall/[hallId]/page.tsx:14-23; lib/menu.ts:9-10; lib/dining-halls.ts:3-8')
excluded('SEC-05','No application sessions, invitations, password recovery or privileged account operations.','components/profile/ProfileScreen.tsx:75-104; app route inventory; no middleware or use-server actions')
row('SEC-06','UNKNOWN','P1','Host, deployer, log-reader and analytics-dashboard privileges have not been supplied. Source-only debug guards are present.','lib/menu.ts:33-40; lib/providers/rutgers-provider.ts:1413-1416; missing hosting/IAM evidence','A011')
excluded('SEC-07','No authenticated roles/tenants/credentials to test. Public route behavior is assessed under SEC-03/04 and SERVICE-01.','app route inventory; evidence/fresh-artifact.json (zero server actions)')
row('INT-01','PARTIAL','P1','Hall/date selection is server controlled and numbers have limits; upstream body bytes, collection lengths and complete JSON schemas are not bounded.','app/hall/[hallId]/page.tsx:14-23; lib/providers/rutgers-provider.ts:439-478,634-663,1187-1209','A007')
row('INT-02','FAIL','P1','React text rendering avoids executable upstream markup; concrete server-side request forgery path exists through label links.','components/menu/HallStationExplorer.tsx:280-288; lib/providers/rutgers-provider.ts:528-529,777-800; evidence/audit-probes.json','A002')
row('INT-03','FAIL','P1','Primary menu URLs use HTTPS, but accepted absolute label URLs may use HTTP or another host; fetch follows redirects by default.','lib/providers/rutgers-provider.ts:6-7,480-505,528-529; evidence/audit-probes.json','A002 A011')
row('INT-04','PARTIAL','P1','Atrium validates date, meal and location; Nutrislice selects exact date. Label origin/identity and full schema validation remain incomplete.','lib/providers/atrium-menu-context.ts:84-151; lib/providers/rutgers-provider.ts:579-605,1194-1209','A002 A003 A007')
row('INT-05','PARTIAL','P1','Abortable body deadlines, 6 label workers per meal and a 6-second launch budget exist. No body/item/cache caps or verified edge abuse limits.','lib/providers/rutgers-provider.ts:480-510,608-625,855-865; lib/menu.ts:18-20','A007 A011')
row('INT-06','PASS','—','Upstream operations are reads; concurrent same-hall/date calls share a promise and do not repeat consequential external writes.','lib/providers/rutgers-provider.ts:1380-1409; tests/menu-ingestion-logs.test.tsx; evidence/npm-test.txt')
row('INT-07','PASS','—','Production ingestion uses allowlisted error categories and bounded aggregate summaries; hall error UI hides raw error details.','lib/providers/menu-ingestion-log.ts:10-14,57-76,110-158; app/hall/[hallId]/error.tsx:5-18; tests/menu-ingestion-logs.test.tsx:31-61')
row('RLY-01','FAIL','P1','Menu context/date correctness is tested; missing macros and ID collisions can make plate totals misleading or incorrect.','evidence/npm-test.txt; evidence/audit-probes.json; hooks/usePlate.tsx:34-45','A003 A004 A006')
row('RLY-02','PARTIAL','P1','Timeouts and null results fail visibly without fake menus; recovery is refetch after TTL, without persisted fallback. Operational availability target is unknown.','lib/menu.ts:13-30; lib/providers/rutgers-provider.ts:1380-1409; README.md:22,169','A007 A011')
row('RLY-03','PARTIAL','P2','Server restart loses only refetchable caches. Browser reload loses the plate without a visible lifecycle notice.','hooks/usePlate.tsx:31-32; components/plate/PlateScreen.tsx:15-95; README.md:22','A013')
row('RLY-04','FAIL','P1','Functional updates and request coalescing work; portion-ID collisions merge distinct quantities and tabs can overwrite preferences.','hooks/usePlate.tsx:34-69; hooks/useUserPreferences.tsx:100-112; evidence/audit-probes.json','A004 A013')
row('RLY-05','FAIL','P1','Storage-denied writes escape the preference effect; upstream byte/collection limits are missing.','hooks/useUserPreferences.tsx:105-111; lib/providers/rutgers-provider.ts:439-478; evidence/audit-probes.json','A005 A007')
row('RLY-06','UNKNOWN','P1','Local HTTP smoke timings and bundle size are recorded; no supported traffic, mobile performance or memory budget is evidenced.','evidence/runtime-results.json; evidence/build.txt; missing deployed load/browser measurements','A007 A011 A012')
row('RLY-07','PARTIAL','P1','178 tests pass with no skips and TypeScript/build pass. Tests lack real browser/storage/keyboard and the five reproduced regression scenarios.','evidence/npm-test.txt; evidence/typecheck.txt; evidence/build.txt; evidence/audit-probes.json','A002 A003 A004 A005 A006 A010 A012')
row('PRV-01','PARTIAL','P1','Preferences and plate have a clear local purpose. Analytics is mounted globally; user-facing purpose/minimization choices are not documented.','app/layout.tsx:3,20; hooks/useUserPreferences.tsx:71-112; components/profile/ProfileScreen.tsx:17-40','A009')
row('PRV-02','UNKNOWN','P1','No privacy notice or release-jurisdiction decision is present; required consent cannot be decided from source alone.','app route inventory; components/home/HomeScreen.tsx:115-124; missing product/privacy owner decision','A009')
row('PRV-03','UNKNOWN','P1','Nutrislice, Rutgers FoodProNet and analytics integration identified; hosting/analytics regions, access and retention are unverified.','lib/providers/rutgers-provider.ts:6-7; app/layout.tsx:20; missing account configuration','A009 A011')
row('PRV-04','PARTIAL','P1','App production logs exclude raw menu bodies, URLs and errors in tests. Host logs and deployed analytics payloads/retention are not verified.','lib/providers/menu-ingestion-log.ts:57-76,110-158; tests/menu-ingestion-logs.test.tsx:31-61','A009 A011')
row('PRV-05','UNKNOWN','P1','No published app policy or deletion/support commitment available to compare to implementation.','app route inventory; README.md:1-22; missing publication requirements','A009')
row('OPS-01','PARTIAL','P1','Per-attempt structured logs expose provider failures; they are not uptime monitoring and do not cover browser failures.','lib/providers/menu-ingestion-log.ts:110-158; README.md:169','A011')
row('OPS-02','UNKNOWN','P1','No deployed alert routing, responder or alert exercise is available.','README.md:169; no monitoring configuration in initial snapshot','A011')
row('OPS-03','PARTIAL','P1','Refetch/unavailable behavior and local setup are documented; outage, rollback and incident procedures need an owner and exercise.','README.md:18-22,54,169','A011 A012')
excluded('OPS-04','No application administrative/security event stream is needed for public reads. Hosting administrative audit access is assessed under SEC-06.','app route inventory; evidence/fresh-artifact.json')
row('OPS-05','UNKNOWN','P1','No demonstrated deployed rollback or emergency provider-disable procedure; source absence is not proof the hosting platform lacks rollback.','README.md:169; missing hosting/release records','A011 A012')
row('REL-01','PARTIAL','P1','Lockfile and isolated build establish current source buildability; runtime is not pinned and deployed commit/build linkage is unknown.','package.json:5-28; package-lock.json:1909-1944; evidence/build-metadata.json; evidence/fresh-artifact.json','A011 A012')
row('REL-02','FAIL','P1','Next 15.5.15, sharp 0.34.5 and PostCSS 8.5.9/8.4.31 lag relevant security fixes. Reachability varies; see advisory triage.','package-lock.json:1910,1962,2073,2376; evidence/public-advisories.json; external sources below','A001')
row('REL-03','UNKNOWN','P1','No repository CI configuration; branch protection, deployment credentials and release approvals are inaccessible.','initial inventory (.github absent); package.json:5-11; missing repository/hosting settings','A012 A011')
row('REL-04','PARTIAL','P1','Existing tests stub network and the audit build was isolated. Staging/live environment separation is not evidenced.','tests/atrium-menu-context.test.tsx:64-76; tests/menu-ingestion-logs.test.tsx:31-61; evidence/build-metadata.json','A011 A012')
row('REL-05','PARTIAL','P1','Fresh build has zero server actions and no searched mock/debug symbols in client JS; deployed artifact/secrets remain unverified.','evidence/fresh-artifact.json; lib/menu.ts:33-40; evidence/secret-scan.json','A011 A012')
row('REL-06','PARTIAL','P1','Small web release has no server database migrations; local preferences have no schema version and rollout/rollback is untested.','hooks/useUserPreferences.tsx:75-90,105-110; evidence/build.txt','A005 A012 A013')
row('REL-07','PARTIAL','P2','Detailed ingestion/fixture notes exist. Setup lint is interactive; supported browsers, maintainership/support and release license decisions need documentation.','README.md:54-60,169; package.json:1-28; no root LICENSE/CI in initial inventory','A012 A014')
row('UX-01','PARTIAL','P1','Unavailable/loading/added-item states are clear; partial nutrition and denied preference saves are not represented truthfully.','app/hall/[hallId]/error.tsx:9-15; components/menu/HallStationExplorer.tsx:277-284; hooks/useUserPreferences.tsx:105-111','A003 A005')
row('UX-02','PARTIAL','P2','Clear/remove affect only an ephemeral plate; actions have no undo and can lose calculation work. No server-destructive action exists.','components/plate/PlateScreen.tsx:53-58,88-94; hooks/usePlate.tsx:50-73','A013')
row('UX-03','PARTIAL','P2','Menus have explicit empty/error states; storage behavior and inactive saved dietary preferences need clearer explanation.','components/profile/ProfileScreen.tsx:17-35; components/plate/PlateScreen.tsx:71-94','A005 A013 A014')
row('UX-04','FAIL','P1','Map controls have names/focus support; plate drawer lacks modal focus handling and profile switches lack a programmatic state.','components/plate/PlateDrawer.tsx:55-69,157-168; components/profile/ProfileScreen.tsx:159-170; components/plate/PlateScreen.tsx:37-59','A010')
row('UX-05','PARTIAL','P2','Maps disclose approximate placement and live status is separated from source availability; static open-hours and uncapped goal bars can mislead.','components/menu/HallStationExplorer.tsx:199; app/page.tsx:15-84; components/plate/MacroTotals.tsx:69-78','A013 A014')
row('WEB-01','PARTIAL','P2','Upstream fields are React text; no unsafe HTML/eval sinks found. Fresh local HTTP responses lack CSP, framing, nosniff and referrer headers.','components/menu/HallStationExplorer.tsx:280-288; next.config.ts:1-9; evidence/runtime-results.json','A008')
excluded('WEB-02','No app cookies/session authentication or cross-origin mutation API. There is no account action requiring CSRF/CORS enforcement.','app route inventory; evidence/fresh-artifact.json; hooks/usePlate.tsx:31-73')
row('WEB-03','PARTIAL','P1','Only public shells/menus are server-rendered and cacheable. Dietary preferences are visible to the next person using the same browser profile; analytics runtime access is unverified.','hooks/useUserPreferences.tsx:32,71-112; evidence/runtime-results.json; app/layout.tsx:20','A009 A013')
row('WEB-04','FAIL','P1','Map focus/labels and some reduced motion support are implemented; drawer, profile toggles and plate controls remain incomplete.','components/menu/HallStationExplorer.tsx:89-109,190-191; app/livingston.css:302; components/plate/PlateDrawer.tsx:157-168; components/profile/ProfileScreen.tsx:159-170','A010')
row('WEB-05','PARTIAL','P2','Build and isolated HTTP smoke pass. Real-browser workflows, device/browser coverage, live links, and trustworthy hours still need validation.','evidence/build.txt; evidence/runtime-results.json; README.md:34,38,44; app/page.tsx:15-26','A010 A012 A014')
row('SERVICE-01','PASS','—','Public pages are /, /hall/[hallId], /plate and /profile; no app API/Server Action mutation routes. Unsupported halls short-circuit before upstream retrieval.','app/hall/[hallId]/page.tsx:14-23; evidence/fresh-artifact.json; evidence/runtime-results.json')
excluded('SERVICE-02','No app database, object store, upload or signed-link implementation. Local images are public assets.','app route inventory; lib/providers/rutgers-provider.ts:6-7; public/images inventory')
row('SERVICE-03','PARTIAL','P1','Per-process coalescing and fetch limits exist; global request/resource budgets, edge rate limits and readiness checks are unverified.','lib/providers/rutgers-provider.ts:608-625,1380-1409; README.md:169','A007 A011')
excluded('SERVICE-04','No distributed transactions, write queues, callbacks or consequential remote writes. Read-cache behavior is assessed under INT-06.','lib/providers/rutgers-provider.ts:439-570,1380-1409')
row('SERVICE-05','UNKNOWN','P1','Live origin, hosting OS, network rules, deployed version, IAM and recovery evidence are unavailable.','no hosting/IaC/project environment files in initial inventory; evidence/build-metadata.json is local only','A011')
row('PIPELINE-01','FAIL','P1','Request-triggered ingestion tracks source/date and validates Atrium context; missing nutrient fields and icon semantics are corrupted during normalization.','lib/providers/atrium-menu-context.ts:84-151; lib/providers/rutgers-provider.ts:293-330,368-394; evidence/audit-probes.json','A003 A006 A007')
row('PIPELINE-02','PARTIAL','P1','Read-only refresh, same-key coalescing and dedupe exist; Nutrislice portion IDs collide. No batch checkpoint is needed for these reproducible reads.','lib/providers/rutgers-provider.ts:1119-1126,1380-1409; evidence/audit-probes.json','A004')
row('PIPELINE-03','PARTIAL','P2','No scheduler; Rutgers timezone and per-key in-flight sharing work. Cache entries accumulate across dates and coalescing does not span instances.','lib/utils.ts:57-89; lib/providers/rutgers-provider.ts:532-550,1380-1409','A007 A011')
row('PIPELINE-04','PARTIAL','P1','Rejected meals and error counts are isolated without retaining sensitive raw logs; raw HTML caching, body size and item count are unbounded.','lib/providers/menu-ingestion-log.ts:57-71; lib/providers/rutgers-provider.ts:439-478,532-550,833-852','A007')
row('PIPELINE-05','PARTIAL','P1','No external write side effects; production summaries include counts/outcomes. Stale/failure alert delivery is not established.','lib/providers/menu-ingestion-log.ts:125-155; README.md:169','A011')
for id,reason in [('NATIVE','Browser-only app; no native project, permissions or OS bridge.'),('PACKAGE','private:true web app, no distributed library/CLI entrypoints.'),('AI','Static map images and prompts exist, but no runtime inference, retrieval or model API.'),('INFRA','No IaC, containers or deployment provisioning in inspected repository; hosted state remains SERVICE-05 UNKNOWN.')]:
 excluded(id,reason,'package.json:1-28; app/lib inventory; evidence/initial-snapshot.json')
row('SPECIAL-01','FAIL','P1','Nutrition completeness must survive normalization and total calculation; current zero substitution loses that distinction.','lib/types.ts:5-12,60-65; lib/providers/rutgers-provider.ts:293-330; components/plate/PlateScreen.tsx:12,79-85','A003')
row('SPECIAL-02','FAIL','P1','Positive gluten-free icons can be placed under Listed allergens and dropped from dietary filters; absence of allergen data is not proof of safety.','lib/providers/rutgers-provider.ts:56-57,368-394; lib/menu-filters.ts:15-20; evidence/audit-probes.json','A006')
row('SPECIAL-03','UNKNOWN','P1','App is a general dining aid. Any allergy-safety, clinical or institutional assurance requires explicit product scope and qualified review; no such use is established.','README.md:3,21; components/ui/NutritionDisclaimer.tsx:5-9; missing product/domain decision','A006 A009')

findings=[
('001','P1','FAIL','Security maintenance is behind current framework/native-image fixes','High for installed versions; deployment exploitability varies.',
'package-lock.json:1910,1962,2073,2257,2376; evidence/fresh-artifact.json; advisory table below.',
'Publicly expose this build with a vulnerable feature/configuration. Next is 15.5.15; sharp is 0.34.5. React is 19.2.5. Default image optimization is enabled with remotePatterns empty; only repository PNG assets and no upload route were observed.',
'Framework availability/cache risks need patching. Critical AVIF RCE needs attacker-controlled AVIF input, which was not established here; the Windows mixed-router RCE prerequisites are absent from the inspected macOS/App-Router-only build. Do not report a confirmed RCE or breach.',
'Upgrade Next to at least the verified 15.5.24 maintenance release or a later supported patched release, then re-resolve and inspect sharp/native image and PostCSS advisories. Do not assume a Next update automatically fixes every transitive dependency.',
'Locked and installed versions match; relevant advisories are patched or documented as unreachable using effective production configuration. Build/tests pass, maps render, no new mock fallback. Recheck advisory feeds on implementation date.',
'Frontend/platform maintainer; medium (roughly 0.5–2 engineering days, assuming normal compatibility); deploy access needed only for release verification.'),
('002','P1','FAIL','Upstream nutrition links can choose arbitrary server destinations','High; reproduced with fetch stubs, no real network.',
'lib/providers/rutgers-provider.ts:528-529,558-570,777-800,855-865; lib/providers/atrium-menu-context.ts:68-76; evidence/audit-probes.json.',
'A changed or compromised FoodProNet page retains valid date/meal/form context but changes a label href to another HTTP(S) host. Two mock requests to loopback were attempted. The context helper checks form/selector origins, not label URLs. Default fetch redirects also cross the boundary.',
'The server can issue requests to unintended public/private services and consume their responses. Visitors cannot directly submit these links through the current UI; upstream content control is a prerequisite, and cloud egress protections were not inspected.',
'Parse links relative to FoodProNet and enforce exact HTTPS origin, permitted path, credentials/port rules and expected recipe/context parameters. Reject or validate every redirect; prefer rejecting redirects if the source does not require them. Validate returned label identity where available.',
'Local fixture tests prove off-origin, HTTP, credentialed, deceptive-host, traversal and redirect cases cause zero disallowed requests. Expected relative label URLs still enrich menus; rejected enrichment keeps truthful unknown values. No live private-address probe required.',
'Backend maintainer; small/medium (0.5–1.5 days); independent of UI work.'),
('003','P1','FAIL','Missing nutrition fields become real-looking zeros','High; reproduced with a calorie-only synthetic menu.',
'lib/providers/rutgers-provider.ts:293-330,885-892; lib/types.ts:5-12,60-65; lib/nutrition.ts:3-24,54-65; hooks/usePlate.tsx:21-28; components/menu/HallStationExplorer.tsx:277-284; components/plate/PlateScreen.tsx:12,79-85.',
'A food has 120 calories but omits protein/carbs/fat, or a label partially fails. Normalization writes zero for each missing field. hasMeaningfulNutrition returns true from any nonzero nutrient, so rows show 0g and plate warnings may disappear. Plate conversion also drops custom/provenance flags.',
'Users cannot distinguish known zero from incomplete data, and totals can understate nutrition. A generic disclaimer for wholly empty nutrition does not cover partially populated foods.',
'Preserve per-field presence/quality and custom state across provider, MenuItem, PlateItem and totals. Show known subtotals and incomplete coverage; handle a verified all-zero food distinctly from missing values. Reconcile label identity with requested food.',
'Fixtures for complete, calorie-only, genuine-zero, invalid/out-of-range, missing-label and custom foods render truthful field states and incomplete totals. Adding/removing unknown foods updates coverage; no missing field silently becomes a known zero.',
'Full-stack maintainer with product nutrition review; medium (1–3 days); coordinate A002 and A006.'),
('004','P1','FAIL','Distinct Nutrislice portions share one plate identity','High; reproduced with two serving sizes.',
'lib/providers/rutgers-provider.ts:410-412,415-437,1080-1126; hooks/usePlate.tsx:34-45; evidence/audit-probes.json. Atrium already disambiguates variants at lib/providers/rutgers-provider.ts:949-956.',
'Two entries in one station have the same upstream food ID but different portions/nutrition. Conservative dedupe retains both, yet buildItemId assigns the same ID. Adding either variant finds the same plate row and keeps the first nutrition snapshot.',
'The selected portion can use another portion’s calories/macros and shared React keys/quantity indicators can be wrong. This is an identity/correctness defect, not cross-user authorization.',
'Apply deterministic collision-safe identity to Nutrislice variants, preserving noncolliding IDs. Define how current plate items behave when refreshed source data changes.',
'One-cup/120-cal and two-cup/240-cal fixtures remain separate when each is added; one of each totals 360 calories. Identical duplicate entries still collapse; source order/refresh does not swap variant identities.',
'Backend/frontend maintainer; small (0.5–1 day); add fixture regression before implementation.'),
('005','P1','FAIL','Preference storage writes fail outside error handling','High for thrown effect; full browser recovery not exercised.',
'hooks/useUserPreferences.tsx:71-112; components/layout/AppShell.tsx:17-34; evidence/audit-probes.json.',
'localStorage.setItem throws SecurityError or quota failure after hydration or an edit. Read errors are caught, but the subsequent write effect is not. This provider wraps the whole application.',
'The save failure is uncaught and can trigger a React error boundary/app error instead of keeping usable in-memory preferences; the actual browser fallback needs verification.',
'Guard writes, continue with in-memory preferences, expose accurate save/unavailable status and use an explicit validated/versioned storage schema. Preserve malformed or older stored values safely according to a documented migration decision.',
'Synthetic SecurityError, QuotaExceededError, corrupt JSON, wrong types and legacy records do not break any route or falsely report a successful persistent save. Normal reload persistence still works; no network is required.',
'Frontend maintainer; small (0.5–1 day); coordinate privacy/storage lifecycle with A009/A013.'),
('006','P1','FAIL','Dietary icon classification confuses positive labels with allergens','High for reproduced classification; medical/product scope is unknown.',
'lib/providers/rutgers-provider.ts:56-57,368-394,1460-1462; lib/menu-filters.ts:15-20; components/menu/HallStationExplorer.tsx:278-288; components/profile/ProfileScreen.tsx:17-35; evidence/audit-probes.json.',
'A Nutrislice icon named Gluten Free matches ALLERGEN_PATTERN, is removed from tags and is inserted in allergens. It then fails the gluten-free filter and appears under Listed allergens. Profile Nut-Free is stored but does not filter menus; the UI calls this future work.',
'The meaning of provider labels is corrupted and dietary controls may confuse users. Current tag-only filtering correctly avoids inferring safety from absent allergen data; preserve that conservative behavior.',
'Define provider-specific explicit mappings for contains/allergen versus dietary/free-from labels. Validate real sanitized source examples and preserve unknown labels without interpreting them as medical assurances. State clearly that saved preferences do not yet filter, or implement only an agreed, independently validated scope.',
'Positive and negative gluten/milk/nut labels, unknown labels and missing icons remain semantically distinct through provider/UI tests. No absent data creates a free-from claim. Product owner documents informational scope; qualified dining/allergy reviewer approves any safety claims before use.',
'Full-stack/product owner; medium (1–2 days plus source/domain review); A003 shares data-quality metadata.'),
('007','P1','PARTIAL','Resource bounds stop at timers and worker counts','High for missing local bounds; production scale impact unknown.',
'lib/providers/rutgers-provider.ts:174-178,439-510,532-550,608-625,855-865,1380-1409; README.md:169.',
'An upstream returns a very large/complex body or long item arrays; response.json/text buffers it and synchronous parsing can delay timers. Long-lived processes accumulate old date/label cache entries because TTL only checks reads. Each process independently performs cold upstream loads.',
'Possible memory/CPU growth and upstream load amplification; no direct user-selected date/URL route was found, limiting attacker-driven key cardinality. Six workers are per meal, allowing up to 18 concurrent Atrium label requests per daily load.',
'Bound streamed response bytes, validated arrays/strings, overall per-load work and retained cache entries; evict expired keys. Keep shared in-flight caching. Establish platform-level traffic limits and measure representative cold/cache-hit behavior before deciding whether any shared cache is needed.',
'Local oversized/chunked/malformed fixtures fail within a documented byte/item budget and do not block other hall loads. A multi-day cache soak plateaus. Proposed starting test targets: 2 MiB/menu response, 256 KiB/label, 1,500 items/meal; calibrate against approved fixtures before treating as requirements.',
'Backend/platform maintainer; medium (1–3 days); depends on A002 for destination control and A011 for deployed limits.'),
('008','P2','PARTIAL','Browser security headers lack a configured baseline','High for isolated server; deployed edge headers unknown.',
'next.config.ts:1-9; evidence/runtime-results.json; components/menu/HallStationExplorer.tsx:280-288.',
'Isolated production responses contain no CSP, X-Frame-Options/frame-ancestors, X-Content-Type-Options or Referrer-Policy. React text rendering already provides the main output-encoding defense; no exploitable app XSS sink was found.',
'Defense in depth and framing isolation are incomplete. Lack of CSP alone is not evidence of an XSS vulnerability. HSTS cannot be judged on the local HTTP test.',
'Add an appropriate production header policy through the app or hosting edge, with CSP compatible with Next scripts, inline styles, image assets and analytics. Start CSP validation/report-only as appropriate; verify real HTTPS settings.',
'Header inspection and real browser navigation show intended framing restriction, nosniff/referrer behavior, and no broken hydration, maps or analytics caused by CSP. Verify HSTS/redirects at the actual HTTPS edge after host evidence is available.',
'Frontend/platform maintainer; small/medium (0.5–1.5 days); patch Next first (A001), then coordinate analytics A009.'),
('009','P1','PARTIAL','Privacy notice, browser data controls and analytics evidence are incomplete','High for source behavior; provider account settings unknown.',
'hooks/useUserPreferences.tsx:32,71-112; hooks/usePlate.tsx:31-32; app/layout.tsx:3,20; components/profile/ProfileScreen.tsx:42-52; no privacy route in app inventory.',
'A person enters dietary preferences/goals on a shared browser, or visits a deployed build with analytics enabled. Preferences persist as plaintext origin storage with no expiry or unified delete control; analytics is mounted globally with no visible app notice.',
'People lack a clear account of where data lives and how to clear it. Same-origin scripts could read local storage; there is no evidence the analytics package actually sends dietary values. No legal violation or consent requirement is inferred without jurisdiction/scope.',
'Document local-only preferences and transient plate, add clear-local-data controls, decide any export/retention promises, and inspect deployed analytics payloads/settings with synthetic data. Name the service owner and obtain product/privacy review of required notices and consent.',
'Clearing local data removes the preference key and resets relevant UI without restoring it from a late write. Synthetic dietary canaries do not appear in analytics/log payloads. Retention, region, dashboard access and any consent choice match actual account settings and published notice.',
'Product/privacy owner and frontend maintainer; medium (1–2 days engineering plus account/policy decision); coordinate A005/A013 and A011.'),
('010','P1','FAIL','Plate and preference controls lack complete accessible semantics','High for source defects; full assistive-technology test unknown.',
'components/plate/PlateDrawer.tsx:55-69,157-168; components/profile/ProfileScreen.tsx:159-170; components/plate/PlateScreen.tsx:37-59; components/plate/PlateItemRow.tsx:29-43.',
'Open the plate drawer by keyboard, tab through it, or ask a screen reader whether a dietary toggle is on. Drawer has an aside and Escape handling but no dialog name/modal semantics, focus placement/trap/return or inert background. Toggles do not expose aria-pressed/checked; +/-/remove symbols lack item-specific names.',
'Core workflows are harder to discover and operate with keyboard or screen reader. Map navigation has useful focus support, but it does not establish app-wide accessibility.',
'Implement an accessible drawer/dialog pattern and named quantity/remove controls. Use native checkboxes or correctly stateful switches. Verify focus indicators, contrast, zoom, small screens and reduced motion throughout plate/profile workflows.',
'Keyboard open/Tab/Shift+Tab/Escape/close returns focus correctly; background is unavailable while modal. Screen reader announces item-specific controls and checked states. Test Safari/VoiceOver and one Chromium browser at 320px and 200% zoom with synthetic menus.',
'Frontend/accessibility reviewer; medium (1–2 days); run after nutrition and identity UI changes.'),
('011','P1','UNKNOWN','Production access, monitoring and recovery have not been verified','High confidence in evidence gap, no claim deployed controls are absent.',
'README.md:169; app/layout.tsx:20; no hosting configuration in initial inventory; evidence/build-metadata.json is local.',
'Broad release or an outage occurs without a known deployed commit, host OS, administrator list, HTTPS/edge policy, analytics/log retention, alert destination or tested rollback record available to this audit.',
'This review cannot establish the actual deployment is secure or recoverable. Structured ingestion logs are a useful foundation, but no notification or response process is demonstrated.',
'Identify production/staging origins and provider/project; collect sanitized read-only evidence of deployed commit/build, runtime/OS, IAM/MFA/deploy rights, TLS and edge limits, log/analytics access/retention, and release history. Assign an operational owner and practice failure detection/rollback in staging.',
'An evidence pack links the deployed release to a reviewed source hash, shows intended access and resource limits, and records one synthetic upstream-outage alert plus rollback exercise. Proposed targets: alert on sustained all-hall unavailability within 5 minutes, restore known-good release within 30 minutes; owner must accept or revise.',
'Platform/operator with product owner; medium (0.5–2 days once access is available); no implementation or production mutation authorized by this audit.'),
('012','P1','PARTIAL','Release verification is not yet a repeatable gate','High for local lint failure; CI/repository access controls unknown.',
'package.json:5-28; README.md:54-60; evidence/lint.txt; evidence/npm-test.txt; evidence/build.txt; no .github workflow or runtime pin in initial snapshot.',
'npm run lint exits 1 at interactive ESLint setup. A passing build prints lint/type-check stages but cannot substitute for an independently configured linter. A deploy can bypass tests unless repository/hosting checks enforce them.',
'There is no demonstrated repeatable lint/CI/release workflow despite strong ingestion tests. Browser interactions and the audit regressions are not in the existing automated suite.',
'Configure a noninteractive linter, pin a supported Node runtime, enforce test/typecheck/build gates with isolated data, and establish code review/branch protection/deploy provenance. Extend tests to the concrete findings; document dependency update and rollback procedure. Review .env.* ignore coverage and dependency/license notices.',
'A clean isolated checkout can perform a documented locked install and checks without prompts/live upstream calls; required CI checks prevent release on failure. Actual host settings and deployed commit match. Controlled browser smoke covers menus, portions, plate and preferences.',
'Maintainer/platform owner; medium (1–2 days); A001 first, regression fixtures alongside A002–A006, browser smoke after A010.'),
('013','P2','PARTIAL','Plate and preference lifecycle behavior needs explicit product decisions','High for observed source behavior; desired persistence is a product choice.',
'hooks/usePlate.tsx:31-73; hooks/useUserPreferences.tsx:100-112; components/plate/PlateScreen.tsx:88-94; components/plate/MacroTotals.tsx:69-78.',
'Reload closes the in-memory plate, clear has no undo, two tabs write whole preference records, or a plate exceeds a small macro goal. The progress bar ratio has no upper clamp and can extend outside its track.',
'Temporary calculation work can disappear and saved edits can conflict; goal visualization can overflow. There is no requirement to add accounts or cloud storage for this lightweight use case.',
'Decide whether plate state should remain temporary or be locally persisted with a date/schema boundary. Communicate the lifecycle, consider undo, define last-write/cross-tab behavior, and cap visual progress at the track while showing numeric overage.',
'Reload behavior matches the documented decision; clear/undo and storage reset behave consistently. Two-tab edits follow the chosen rule. 0/100/250% goal cases remain within layout while numeric values stay accurate.',
'Product/frontend owner; small/medium (0.5–1.5 days); A005/A009 determine storage/deletion behavior.'),
('014','P2','PARTIAL','Static operating hours and unfinished preferences need clearer product status','High for static calculation; current official hours not fetched.',
'app/page.tsx:15-84; README.md:18; components/profile/ProfileScreen.tsx:17-35; components/menu/HallStationExplorer.tsx:199.',
'Homepage applies one schedule every day, with no weekend/holiday/service-exception model, and presents Open now/Serving now. Saved dietary settings do not influence filters. Current map positions are appropriately labeled approximate.',
'Operating status may be mistaken for a verified live schedule and preference effects may be misunderstood. This audit did not assert the hardcoded hours are wrong on a particular day.',
'Label schedule status as typical/unverified and link an authoritative hours source, or use a verified schedule with exceptions. Clarify saved-preference scope. Record supported environments, release stage, owner/support contact and relevant asset/license decisions.',
'Weekend, holiday, between-meal and unavailable-menu scenarios show the intended qualified status. A user can tell which preferences actively filter. Existing precise live/unavailable/source-time distinctions and approximate map notice remain intact.',
'Product/frontend owner; small (0.5–1 day plus source decision); no upstream probing required for the immediate copy improvement.')
]
counts=collections.Counter(r[2] for r in rows if r[1]=='YES')
excluded_ids=[r[0] for r in rows if r[1]=='NO']
refs={f[0]:[r[0] for r in rows if 'A'+f[0] in r[6].split()] for f in findings}

intro='''# KnightBite production readiness and security audit

Audit date: September 10, 2026. Assessment only; no remediation applied.

## Executive assessment

**Broad public release: Not ready. Controlled real-use pilot: Conditional. Local synthetic demo: Ready within the tested scope.** The app has useful engineering foundations and a small data footprint, but confirmed outbound-request, nutrition/identity, browser-storage and accessibility defects remain. Dependency updates and a review of actual hosting settings should precede a broader release. Production deployment itself is **Undetermined** because no live origin/account configuration was supplied or inspected.

What is solid:

- The app collects no Rutgers password, processes no payments and implements no account database. Menus are public; goals/preferences stay in browser storage and plate items stay in memory in the inspected source.
- Real menus are not silently replaced with samples. Atrium verifies returned date/location/meal; Nutrislice selects the requested date. Station mapping conserves items and marks approximate physical placement.
- Fetch deadlines include response bodies, shared callers coalesce, label work has a bounded launch window, and production ingestion logs exclude raw upstream errors/data in tested cases.
- **178/178 existing tests pass, TypeScript passes, and an isolated production build passes.** The HTTP smoke test handles unavailable upstreams without sample substitution. Local secret-pattern scanning found no matches in its stated coverage.

What needs work first: patch dependencies and establish deployed exposure; restrict Atrium nutrition destinations and redirects; preserve unknown nutrition and unique portion identities; catch preference writes; repair accessible plate/profile controls. The passing suite does not cover several of these defects. See F-001 through F-014 and [the sequenced plan](REMEDIATION_PLAN.md).

**No confirmed P0 breach, exposed privileged credential or directly exploitable remote-code-execution path was established.** This does not clear the old framework/native-image versions for public deployment. Critical advisories are conditional on features/input exposure; if deployment evidence establishes those conditions, escalate patching to P0 immediately. No compliance certification or allergy-safety assurance is made.

## Profile, requirements and scope

- Repository: `/Users/andywu/Desktop/Codex/Nutrition`; actual editable application repository, not a reference mirror.
- Snapshot: branch `codex/dining-hall-overhaul`, HEAD `1fbe14b7805c95d69bffda11913b4739f8ce8db5`, plus **21 modified tracked files and 12 untracked project files already present**. Every source citation refers to this labeled working-tree snapshot, not HEAD alone. The 105-file hash inventory is [initial-snapshot.json](evidence/initial-snapshot.json).
- Type/release unit: single private Next.js App Router web application, TypeScript strict mode, React/Tailwind; Node server plus browser JS. Installed and locked Next 15.5.15, React/React DOM 19.2.5, sharp 0.34.5; audit runtime Node 24.14.1 and npm 11.11.0. No production runtime pin is established.
- Implemented: public live menu ingestion for Busch/Livingston/Neilson through Nutrislice and Atrium through Rutgers FoodProNet; station maps/list/search/tag filters; plate arithmetic; saved dietary switches and macro goals; external official account link. Analytics component is mounted globally.
- Local-only: plate state; saved browser preferences. Mock menus are explicitly separate. Static map art is not runtime AI. Dietary settings are stored but do not automatically filter menus. Static hours are not verified live operating status.
- Intended users inferred from README.md:3: Rutgers diners. Actual release stage, traffic, uptime promise, supported browsers and jurisdiction are **not documented requirements**. Proposed acceptance targets below are recommendations, not pre-existing commitments. Consequences primarily concern availability, misleading dining/nutrition information, browser privacy and lost temporary work.
- Modules: WEB, SERVICE, request-triggered PIPELINE and three SPECIAL nutrition/domain checks apply. NATIVE, PACKAGE, AI and INFRA triggers are absent in the inspected project. Hosted infrastructure is still an explicit SERVICE-05 evidence gap, not presumed nonexistent.
- The attached audit brief was used as assessment/reference structure. Its example prompt was not treated as a separate request to change the app. Source text and external pages were treated as evidence, not as authorization to expand work.
- No applicable AGENTS.md was found in the project or inspected ancestor locations. No delegated agents, installs, migrations, credential checks, production probes or external scanning uploads were used.

### Methods and executed checks

All commands below were executed September 10, 2026. Working directory is the repository root unless otherwise stated. Read-only discovery included `git status --short`, `git branch --show-current`, `git rev-parse HEAD`, `git ls-files`, `rg --files`, numbered source reads and searches across app/components/hooks/lib/tests/config/README for fetch, storage, secrets, injection sinks, authentication, telemetry and deployment. App-owned server inputs were followed through route, provider, normalizer and UI; not merely searched by name.

| Check | Exact invocation / location | Exit / result | Evidence and limits |
| --- | --- | --- | --- |
| Tests | `npm test` | 0; 178 pass, 0 fail, 0 skipped | [npm-test.txt](evidence/npm-test.txt); existing tests use HTTP/provider stubs and fake timers; not live browser tests |
| Types | `./node_modules/.bin/tsc --noEmit --incremental false` | 0 | [typecheck.txt](evidence/typecheck.txt), empty output; disables incremental file writes |
| Lint | `NEXT_TELEMETRY_DISABLED=1 npm run lint </dev/null` | 1; interactive configuration required | [lint.txt](evidence/lint.txt); no selection/install/configuration made |
| Additional probes | `./node_modules/.bin/tsx --tsconfig tsconfig.test.json docs/audits/production-readiness-2026-09-10/evidence/audit-probes.cjs` | 0; five defect assertions confirmed | [harness](evidence/audit-probes.cjs), [results](evidence/audit-probes.json); all fetches replaced, storage effect simulated. First harness attempt exited 1 because the synthetic link replacement assumed double quotes; corrected the evidence harness to support actual single-quoted fixture links and reran. App source never changed. |
| Production build | `node /Users/andywu/Desktop/Codex/Nutrition/node_modules/next/dist/bin/next build` in the isolated path recorded in metadata | 0 | [build.txt](evidence/build.txt), [build-metadata.json](evidence/build-metadata.json); copied source, symlinked existing dependencies, no install, telemetry disabled and fetch/http/https guarded. This is buildability with installed dependencies, not a fresh-install test. |
| Local HTTP smoke | `python3 docs/audits/production-readiness-2026-09-10/evidence/runtime-check.py` | 0 | [runtime-results.json](evidence/runtime-results.json), [harness](evidence/runtime-check.py); separate loopback-only production process, outbound requests disabled; process stopped afterward |
| Secret patterns | Local Python regex scan using Git `rev-list --objects --all` and `cat-file` plus workspace/build text | 0; no matches | [secret-scan.json](evidence/secret-scan.json); private-key headers, common provider tokens and quoted credential assignments. No values printed or tested. Dependencies, binary/image content, unreachable Git objects, cloud secrets and live logs excluded; no exhaustive/entropy-based guarantee. |
| Dependencies | Local package-lock/installed-package inspection; public GitHub repository advisory metadata downloads | 0; 165 locked package entries, 77 public advisory records | [dependencies.json](evidence/dependencies.json), [public-advisories.json](evidence/public-advisories.json). Only public repository URLs sent; project manifest/code never uploaded. Advisory matching is a triage aid, not an exploit count. |
| Artifacts | Existing .next metadata and fresh isolated client JS/manifest inspection | Completed | [artifact-inventory.json](evidence/artifact-inventory.json), [fresh-artifact.json](evidence/fresh-artifact.json); original .next lacked BUILD_ID and was not treated as a production release. Fresh build ID `M3i2ysXVZzl0rLdZfgzDl`; symbol scans have minification limits. |

Fresh build reports 102 kB shared first-load JS and 128 kB first-load JS for the hall route. These are compiler estimates, not measured phone performance. Local smoke durations were 6–488 ms with upstream requests failing immediately; they are not production latency estimates. Unsupported hall path returned HTTP 200 in this streamed response test; source calls `notFound()` before menu fetch. Do not use HTTP 200 alone as proof of a valid hall or of successful ingestion. Analytics initializes client-side; the absence of its script in a raw HTTP body does not prove analytics is disabled.

Inaccessible evidence: deployed commit/host/OS; TLS and edge rules; IAM/deploy/log permissions; analytics enablement, payloads, retention/region; real-browser interactions; live source availability; traffic/resource measurements; alert and rollback records; branch protection. The remaining dependency ecosystem was inventoried but not exhaustively matched against every registry/native advisory. No fresh dependency install, live denial-of-service, live SSRF, allergy validation or customer-data test was performed.

## Architecture, workflows and threat boundaries

Browser → public Next page rendering → Rutgers provider → HTTPS Nutrislice/FoodProNet. FoodProNet HTML additionally supplies label destinations, which currently cross the intended fixed-origin boundary. React renders normalized fields as text. Client plate arithmetic never sends plate records to an app server; preferences write one browser localStorage record. The Analytics component may add a separate browser-to-provider flow when deployed/enabled; exact payload is unverified.

1. **Browse a hall:** route resolves hall ID against fixed metadata; date uses America/New_York. Provider shares an in-flight hall/date promise, discovers/falls back to static school IDs, selects exact Nutrislice day or validates Atrium form/date/tab/footer, normalizes data and returns live metadata. Null/error/deadline shows unavailable. Atlas/map grouping keeps unknown sections available. Risks: poisoned label link, oversized source, schema drift, no live source freshness guarantee.
2. **Build a plate:** client adds the menu item snapshot and quantity, updates totals with functional state changes, renders drawer/summary and permits clear. Risks: duplicate IDs select the wrong nutrition snapshot, unknown fields become zeros, reload discards plate, dialog semantics are incomplete.
3. **Save preferences/goals:** provider reads and sanitizes storage during hydration; effect writes the complete record after changes. Goals inform macro visualization; dietary switches do not affect filters. Risks: uncaught write errors, same-browser exposure, stale cross-tab writes and goal-bar overflow.
4. **Check meal balance:** fixed external HTTPS Rutgers CAS link opens account management with noreferrer; KnightBite does not collect credentials or balances. No purchase/payment flow exists.
5. **Operate the service:** per-process caches and structured logs support public reads. Hosting deployment, access, detection and rollback form a separate trust boundary that this repository cannot establish.

### Data lifecycle map

| Data / sensitivity / purpose | Creation and source of truth | Copies/locations | Access/protection/key owner | Retention/deletion | Recovery/context changes | Evidence / unknowns |
| --- | --- | --- | --- | --- | --- | --- |
| Public menus, nutrition, ingredients, tags | Nutrislice/FoodProNet; normalized snapshot is app interpretation | Server promises/raw Atrium HTML, RSC/browser state; public content | Fixed HTTPS sources except F-002; no provider credential | Successful daily cache 15 min; unavailable 2 min; school cache 12 h; stale map keys not actively evicted | Refetch on expiry/restart; partial meals permitted, no stored-real-menu fallback | lib/providers/rutgers-provider.ts:6-19,532-570,1280-1307,1380-1409; upstream freshness/retention not controlled |
| Plate selections/quantities and totals; personal dietary behavior | Browser user actions | React state in current app instance | Browser process and same-origin JS; no app encryption/account key | Clears on reload/provider unmount or clear action | No recovery across reload; no server copy or cross-device account | hooks/usePlate.tsx:21-85 |
| Dietary switches and macro goals; potentially sensitive preferences | Browser user input | localStorage key `knightbite-user-preferences`; hydrated React state | Plaintext origin-scoped browser profile, user/OS controls; same-origin JS can read | Indefinite until overwritten/site data cleared; goals reset only; no unified key-removal UI | Reload persists if storage works; last full-record writer wins across tabs | hooks/useUserPreferences.tsx:32,71-131; A005/A009/A013 |
| Hall/date/status operational logs; low-sensitivity public metadata | App ingestion attempt | console → unknown host log sink | Allowlisted counts/reasons; sink access/keys unknown | App output bounded; host retention/deletion unknown | Logs can be lost on process/sink failure; no proven alert routing | lib/providers/menu-ingestion-log.ts:57-76,110-158; README.md:169 |
| Analytics page/visitor telemetry; actual fields unknown | Browser Analytics integration when enabled | Browser/provider; no custom event calls found | Provider/account configuration not inspected; do not infer diet data transfer | Retention, regions, access and deletion unverified | No app account switch/logout boundary; link to notice needed | app/layout.tsx:3,20; A009/A011 |
| Public maps, fixture excerpts and source/config | Repository maintainer; fixtures distinguish observed/synthetic | Git, public/images, static assets, installed/build outputs | Public assets intended; local OS/repository controls | Versioned Git history; release/cache retention unknown | Git can recover committed assets; current uncommitted work must be preserved | initial-snapshot.json; tests/fixtures/foodpronet/README.md |
| Deployment credentials and framework-generated build key | App has no authored API secrets; Next generates server-reference key | Existing/fresh .next manifests; host credentials unknown | Build key value was not printed/copied; server/client separation inspected | Build/host lifecycle unknown; no server actions in fresh manifest | Rotation not required by evidence of a leak; validate host only | artifact-inventory.json; fresh-artifact.json; SEC-06 |

### Advisory triage as of September 10, 2026

Version presence and exploitability are different conclusions. The [Next August security release](https://nextjs.org/blog/august-2026-security-release) identifies 15.5.24 as the patched maintenance target. The following primary sources were checked on the audit date; they establish upstream conditions, not the state of a production deployment.

| Advisory/group | Project assessment and action |
| --- | --- |
| [AVIF image RCE, GHSA-2xp9-vwfh-vxw4](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) | Next 15.5.15 is in the affected version range. Exploit requires attacker-controlled AVIF input reaching optimization. Fresh config has no remote patterns; repo images are PNG and there is no upload route. That prerequisite was not established. Patch to 15.5.24+; validate actual deployed inputs/loader. |
| [Windows mixed-router RCE, GHSA-p293-qw3h-jr36](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36) | Inspected environment is macOS and application routes are App Router only; advisory requires Windows plus both router types. No matching local exploit path established; live OS/build remains unknown. |
| [RSC denial of service, GHSA-8h8q-6873-q5fj](https://github.com/vercel/next.js/security/advisories/GHSA-8h8q-6873-q5fj) | Installed Next is below 15.5.16 and uses App Router. Fresh manifest has zero app Server Actions; no crafted request was attempted. Patch rather than infer immunity from missing authored actions. |
| [Local image response memory limit, GHSA-h64f-5h5j-jqjh](https://github.com/vercel/next.js/security/advisories/GHSA-h64f-5h5j-jqjh) | Default image optimization/local patterns match source configuration. Self-hosted exposure depends on assets/load; official advisory excludes Vercel-hosted optimization. Actual host unknown. Update and bound local image inputs. |
| [RSC cache poisoning, GHSA-wfc6-r584-vfw7](https://github.com/vercel/next.js/security/advisories/GHSA-wfc6-r584-vfw7) | Affected version; improper shared-cache variant handling is required. Local dynamic routes return private/no-store; real CDN behavior unknown. Patch and inspect deployed caching/Vary behavior. |
| [July Next security release](https://nextjs.org/blog/july-2026-security-release) | Many issues require Server Actions, custom servers, controlled rewrites, i18n/Turbopack, remote SVGs or fetch request bodies. Those features were not found here. Still update the framework; do not count every version match as a distinct reachable app vulnerability. |
| [sharp/libheif GHSA-rgj7-g3m4-5g8c](https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c), [sharp/libvips GHSA-f88m-g3jw-g9cj](https://github.com/lovell/sharp/security/advisories/GHSA-f88m-g3jw-g9cj) | sharp 0.34.5 is below fixes. Conditions involve processing untrusted image formats; current repository PNGs do not establish such an attacker path. Official sharp guidance identifies 0.35.4/libheif 1.23.2 for the later issue. Check native binaries and compatibility after Next upgrade; do not assume changing an unrelated top-level package patches bundled copies. |
| [PostCSS previous-map issue, GHSA-fxqj-rqcc-2cmp](https://github.com/postcss/postcss/security/advisories/GHSA-fxqj-rqcc-2cmp), [CSS stringify XSS, GHSA-qx2v-qp2m-jg93](https://github.com/postcss/postcss/security/advisories/GHSA-qx2v-qp2m-jg93) | Root PostCSS 8.5.9 and Next-nested 8.4.31 are old. App processes checked-in CSS at build time, with no user CSS ingestion service. Treat as build-chain maintenance unless untrusted CSS/build access is introduced. |

Public advisory metadata sometimes uses broad ranges with separate patched-version fields. The candidate JSON is **not a vulnerability count**: e.g. older Next cache advisories and the March image-cache fix are already superseded for this version. This audit does not claim exhaustive clearance of all 165 locked package entries. No automated external scanner received this manifest.

Relevant implementation guidance: [Next CSP documentation](https://nextjs.org/docs/app/guides/content-security-policy), [Next self-hosting guidance](https://nextjs.org/docs/app/guides/self-hosting), and [Vercel Analytics privacy documentation](https://vercel.com/docs/analytics/privacy-policy), checked September 10. Generic vendor privacy claims do not establish this account’s payloads or retention, and no mandatory consent/legal conclusion is drawn from them.

## Checklist results

PASS is scoped to evidence stated in the row, not a global production certification. Priority applies to the gap/action; excluded checks use UNKNOWN with applicability NO and are removed from applicable totals. Each A-number maps to the corresponding F-number below.

'''
table='| ID | Applicability | Status | Priority / gate | Actual behavior | Exact evidence or evidence gap | Finding/action ID |\n| --- | --- | --- | --- | --- | --- | --- |\n'
for r in rows: table+='| '+' | '.join(r)+' |\n'
body='\n## Detailed findings\n\nAll priorities are release recommendations; no risk exception has been approved by this audit. P1 items gate broad release. F-001/F-002 should be addressed before exposing this build as a real-use pilot. Findings group shared root causes instead of multiplying one defect by checklist references.\n'
for num,priority,status,title,confidence,evidence,trigger,impact,action,acceptance,owner in findings:
 body+=f'''\n### F-{num} — {title}\n\n- Related checks: {', '.join(refs[num])}.\n- Status / priority / confidence: **{status} / {priority}**. {confidence}\n- Scope: inspected working tree and isolated local build; deployed impact is unverified unless explicitly stated.\n- Current behavior and evidence: {evidence}\n- Trigger: {trigger}\n- Impact / remaining limits: {impact}\n- Action **A{num}**: {action}\n- Acceptance / verification: {acceptance}\n- Proposed owner / effort / dependencies: {owner}\n'''
scenarios='''
## Scenario and test matrix

RUN is an executed check; EXISTING EVIDENCE is a dated earlier observation, not repeated validation. PROPOSED/BLOCKED rows were not run. All regression fixtures must remain synthetic or approved sanitized excerpts.

| Scenario / expected result | Execution state | Observed result or missing evidence | IDs / reproducible procedure |
| --- | --- | --- | --- |
| Existing local install/build works without live calls | RUN | Types and isolated build exit 0; current dependencies reused. Lint exits 1 at setup prompt. | REL-01/03; commands above; locked fresh install still PROPOSED under A012 |
| Core menu happy path, null/error and samples | RUN | 178 tests include real-provider fixtures, explicit samples and unavailable behavior; no production mock fallback | ARC-02, RLY-01/07; `npm test` |
| Wrong returned date/hall/meal must reject | RUN | Existing Atrium context suite rejects conflicting/missing/ambiguous context before labels; current-date Nutrislice selection tested | INT-04, PIPELINE-01; tests/atrium-menu-context.test.tsx, menu-ingestion-logs.test.tsx |
| Anonymous pages / unsupported hall must not expose private data or fetch arbitrary halls | RUN | Public routes return shells, invalid hall short-circuits in code; streamed invalid response was HTTP 200. No user-account data in server shells | SEC-03/04, SERVICE-01; runtime-check.py and source route |
| Wrong user/tenant, expired/revoked app credentials | OUT OF SCOPE | App has no accounts, tenants or credentialed operations | SEC-05/07; revisit if accounts are added |
| Malicious label origin must cause zero outbound attempts | RUN | Failed control: off-origin HTTP loopback link reached mocked fetch twice; no real connection made | INT-02/03; audit-probes.cjs; future A002 regression must reject |
| Malformed/oversized upstream response must fail boundedly | RUN / PROPOSED | Malformed response cases run in existing suite. Byte/item caps and large-body/CPU soak not implemented or run | INT-01/05, RLY-05; A007 local chunked/oversized fixtures |
| Upstream timeout/disconnect including stalled body | RUN | Existing fake-timer tests pass; isolated runtime with all outbound requests denied displays unavailable | RLY-02; npm test, runtime-check.py |
| Commit succeeds but acknowledgment lost | OUT OF SCOPE | No server-side consequential writes/jobs | INT-06, SERVICE-04 |
| Concurrent same-hall/date requests share work | RUN | Existing shared-load tests pass; no global cross-instance proof | INT-06, PIPELINE-03; menu-ingestion-logs.test.tsx |
| Distinct portions keep distinct IDs/totals | RUN | Failed control: two retained portion variants have one plate ID | DATA-04, RLY-04; audit-probes.cjs; A004 expected 360-cal fixture total |
| Partial nutrients remain unknown and dietary labels retain meaning | RUN | Failed controls: calorie-only food yields protein=0 with meaningful=true; Gluten Free becomes allergen and misses filter | SPECIAL-01/02; audit-probes.cjs |
| Storage disabled/full/corrupt | RUN / PROPOSED | Write SecurityError escapes isolated hook effect. Actual browser behavior and quota/corruption combination tests remain proposed | DATA-03, RLY-05; audit-probes.cjs and A005 browser tests |
| Crash/reload preserves work or declares temporary scope | PROPOSED | Source establishes memory-only plate and persistent preferences; browser/restart UX not exercised | RLY-03, A013; add items, navigate, reload and compare chosen contract |
| Clear data while another tab writes | PROPOSED | No storage-event conflict/delete protocol; test chosen product semantics with two tabs | DATA-06/07, A009/A013 |
| Older preference schema / upgrade / rollback | PROPOSED | No schema version or migration evidence; no database migration applies | REL-06; A005/A012 synthetic legacy records and staging rollback |
| Keyboard, screen reader, touch, zoom and reduced motion | PROPOSED | Source defects established; no full browser/AT pass in this audit | WEB-04, UX-04; A010 workflow |
| Prior map browser checks | EXISTING EVIDENCE | README reports September 9 Busch/Livingston checks (390px/320px etc.); not rerun, not proof of current app-wide accessibility; Atrium browser checks explicitly absent | README.md:34,38,44 |
| Release artifacts match intended source and omit mocks | RUN / BLOCKED | Fresh isolated build inspected; original .next is dev/incomplete. Deployed artifact identity inaccessible | REL-05, A011/A012; manifests and current source imports |
| Restore/recovery and notification | PROPOSED / BLOCKED | Public menu caches are refetchable; staging rollback, alert delivery and owner acceptance require environment access | OPS-02/03/05; A011 proposed 5-minute detection/30-minute rollback exercise |
| Official account link and live-source truth | PROPOSED | Fixed HTTPS external account link source reviewed; no login or live dining service probed | SEC-03, SPECIAL-03; owner validates destinations/source with approved access |

## Unknowns, decisions and release gates

| Evidence/decision | Owner role | Priority / gate | Exact resolution |
| --- | --- | --- | --- |
| Actual deployment origin, project, OS/runtime and reviewed source identity | Operator | P1, before exposing new build | Supply read-only deployment metadata and image-loader/edge configuration; verify critical advisory prerequisites. If reachable RCE is established, elevate to P0 and patch immediately. A001/A011 |
| Host/repository deploy rights, MFA, secret/log access and rollback | Operator/repository maintainer | P1 broad release | Sanitized access policy and required-check/release settings; staging rollback record. A011/A012 |
| Usage scale, upstream tolerance and resource budgets | Product/operator | P1 broad release | Accept/adjust proposed A007 limits using representative fixtures and a synthetic staging load/soak. No live provider stress test. |
| Analytics actual enablement/payload, region, retention and notice/consent requirements | Product/privacy owner | P1 broad release | Inspect account settings and client requests with synthetic canaries; publish matching user notice. A009 |
| Informational dining scope versus allergy/medical claims | Product + qualified domain reviewer | P1 before any such claim | Document permitted wording/use and source semantic mappings. If safety-critical use is intended, require specialist standards review before that use. A003/A006/A009 |
| Plate persistence, clear/undo, preference cross-tab rules | Product/frontend owner | P2 | Choose a modest browser-local contract; no account/database is required by this audit. A013 |
| Typical versus authoritative operating hours | Product owner | P2 | Qualify static schedule or establish official exception-aware source. A014 |
| Supported devices/browsers and accessibility target | Product/frontend reviewer | P1 broad release | Document support and perform A010 keyboard/AT/browser acceptance tests. |

Release gates:

- **Local synthetic demo:** existing tests/build establish basic functionality; do not portray it as verified allergy/medical advice or expose deliberately adversarial fixtures outside isolation.
- **Controlled pilot:** complete dependency/exposure triage and outbound-origin restriction (A001/A002), fix misleading nutritional/portion behavior (A003/A004/A006), catch storage failure (A005), and establish owner/privacy/accessibility limits for that pilot. Document any time-bound exception explicitly; this audit approves none.
- **Broad public release:** resolve all P1 actions, including browser workflows, privacy notice/data controls, repeatable release checks and deployed access/monitoring/rollback evidence. P2 may follow under the product owner’s normal prioritization.
- **Allergy-safety or clinical use:** not established as intended or validated; requires a separate qualified scope review, not a generic checklist PASS.

## Totals and readiness limits

'''
scenarios+=f"Applicable checks: **{sum(counts.values())}** — "+', '.join(f'**{s} {counts[s]}**' for s in ['PASS','PARTIAL','FAIL','UNKNOWN'])+'.\n\n'
scenarios+=f"Excluded: **{len(excluded_ids)} rows** ({', '.join(excluded_ids)}), including 4 module-level exclusions covering 20 conditional checks. Unresolved applicability: **0**; environment unknowns remain visible within applicable checks. Core coverage: all 56 IDs; all 5 WEB, 5 SERVICE, 5 PIPELINE and 3 added SPECIAL IDs are accounted for.\n\n"
fc=collections.Counter(f[1] for f in findings)
scenarios+=f"Unique findings/actions: **14** — **P0 0, P1 {fc['P1']}, P2 {fc['P2']}**. Advisory conditions can change this priority if live exposure is established. Checklist statuses are not averaged into a security score. The five successful probe assertions confirm defects; they do not mean the affected controls pass.\n"
scenarios+='''
## Workspace integrity

The initial Git state was recorded before any check that could write project output. Report-only files and sanitized evidence were created under this new audit directory; no existing report was overwritten. Implementation, repository tests/configuration/dependencies/lockfiles and the attached reference were not edited. Builds ran in an isolated temporary source copy using already installed dependencies; the audit HTTP process was terminated. The original .next directory was inspected but not used for the production build.

Final verification is recorded in [final-integrity.json](evidence/final-integrity.json): compare all 105 original file hashes, branch, HEAD and pre-existing Git status; inspect newly added paths. Ignored live developer artifacts/node_modules were not comprehensively hashed and are excluded from that integrity claim. No commit, push, PR, deployment, credential rotation or external app modification was performed.
'''
(base/'PRODUCTION_READINESS_AUDIT.md').write_text(intro+table+body+scenarios)

plan='''# KnightBite remediation plan

Prepared September 10, 2026 against working tree on `codex/dining-hall-overhaul` at `1fbe14b7805c95d69bffda11913b4739f8ce8db5` plus the recorded pre-existing edits. This is a plan; no fixes were applied. Read [the audit](PRODUCTION_READINESS_AUDIT.md) for exact evidence and boundaries.

**First objective:** reduce public exposure risk and make food/plate information truthful, then finish browser and operational readiness. Keep the current architecture. No accounts, database, replacement framework or new vendor are required by these findings.

## Priority and dependency order

- P0: no currently confirmed P0 finding. If actual image/OS exposure establishes a critical reachable advisory, urgently promote A001; collect access evidence through A011 now.
- P1 implementation: A001 dependency updates → A002 outbound request policy → A003 nutrition completeness, A004 portion identity, A005 storage resilience and A006 dietary semantics. A007 resource bounds may proceed alongside data correctness. Finish A010 accessibility after component behavior settles.
- P1 verification/operations: A011 evidence/ownership and A009 privacy decisions can begin immediately. A012 release gates should capture regressions as each fix lands, then validate the completed build.
- P2: A008 browser-header hardening after framework/privacy choices; A013 plate/data lifecycle and goal-bar polish; A014 status/documentation clarity. Qualifying static hours need not wait for a new integration.

Proposed owners below are roles, not assigned people. Effort ranges are low/medium-confidence estimates of focused engineering work with the existing stack; they exclude access delays, external review and provider changes. Rollouts refer to future separately authorized work.

'''
deps={'001':'Start now; A011 establishes deployed exposure.','002':'Independent code fix; do before any new public deployment.','003':'Coordinate data model with A002/A006; land before final UI/accessibility validation.','004':'Add failing fixture before modifying identity; integrate with A003 plate snapshot changes.','005':'Decide record/deletion contract with A009/A013.','006':'Requires sanitized provider semantic examples and product scope decision; coordinate A003.','007':'A002 destination checks first; A011 provides actual edge/runtime budgets.','008':'After A001; align script policy with A009 analytics decision and A011 edge.','009':'Begin decisions/read-only account inspection now; A005/A013 implement storage behavior.','010':'After A003/A004/A005/A006 changes; add keyboard/browser checks to A012.','011':'Start immediately; requires production/staging/repository read access and an owner.','012':'A001 first; regression tests accompany each fix; final smoke after A010.','013':'Product decision with A005/A009; no server schema needed.','014':'Independent copy/source decision; preserve existing live-menu honesty.'}
for num,priority,status,title,confidence,evidence,trigger,impact,action,acceptance,owner in findings:
 plan+=f'''## A{num} — {title}\n\n- Related finding/checks: [F-{num}](PRODUCTION_READINESS_AUDIT.md#f-{num}--{re.sub(r'[^a-z0-9 -]','',title.lower()).replace(' ','-')}), {', '.join(refs[num])}.\n- Priority / outcome / gate: **{priority}**. {action} {'Required before broad release; A001/A002 also precede a newly exposed real-use build.' if priority=='P1' else 'May follow core release safeguards unless the product makes this a required promise.'}\n- Proposed owner / effort: {owner}\n- Existing files/modules/evidence: {evidence}\n- Sequence/dependencies: {deps[num]}\n- Observable acceptance: {acceptance}\n'''
 if num in ['011']:
  plan+='- Validation/environment: collect read-only production settings; use a separate staging environment and synthetic outages for alert/recovery exercises. Evidence collection has no rollout. Any staging/production setting change requires its own implementation task.\n- Rollout/rollback: not applicable to read-only evidence; record and rehearse the chosen release rollback in staging.\n'
 elif num=='001':
  plan+='- Validation/environment: run locked dependency resolution in a future isolated update branch, inspect transitive/native versions and advisory conditions, then `npm test`, TypeScript, production build and browser map smoke. A clean install is proposed, not already tested.\n- Rollout/rollback: stage first; retain a known-good patched artifact. Do not silently roll back to a version with a reachable critical flaw. No database migration.\n'
 else:
  plan+='- Validation/environment: local synthetic fixtures and isolated browser/staging checks as described above. Proposed regression files belong under `tests/` or a documented browser-test directory; these paths are proposed, not files changed in this audit. Existing read-only probes are under `evidence/` and must be converted to assertions for the intended corrected behavior.\n- Rollout/rollback: release through a reviewed isolated branch and staged smoke test; revert that focused change if necessary while retaining earlier security fixes. '
  plan+=('Version and safely migrate any changed browser record; preserve a compatible read path and prevent deleted data from returning. No server database migration.\n' if num in ['003','004','005','009','013'] else 'No server database migration; coordinate any edge policy with the deployed application version.\n')
plan+='''
## Release evidence checklist

A release candidate needs a reviewed source/build identity; matching locked/runtime dependency versions; green noninteractive tests/types/lint/build; representative complete/partial/failed menus; separate portion totals; guarded storage; keyboard and screen-reader plate/preferences; intentional analytics and clear-local-data behavior; verified HTTPS/edge and deployment access; and an owned alert/rollback exercise. Each requirement maps to the A-actions above. Passing a compiler or receiving an HTTP 200 does not satisfy the user-workflow gates.

Proposed acceptance budgets require owner approval, not blind enforcement: A007 starting menu/label/item caps must be calibrated with realistic sanitized fixtures; A011’s five-minute sustained-outage detection and thirty-minute rollback targets should match release scale. There is no need to back up public menu caches as if they were irreplaceable customer records. If product scope adds accounts, uploads, payments or clinical/allergy guarantees, reopen the applicable audit modules before that release.

## Next five concrete actions

1. **Verification + implementation — A011/A001:** identify deployed version/host/image-loader exposure, then update Next and triage its actual sharp/PostCSS dependency tree against current patches. [F-001](PRODUCTION_READINESS_AUDIT.md#f-001--security-maintenance-is-behind-current-frameworknative-image-fixes)
2. **Implementation — A002:** restrict Atrium label URLs and redirect destinations to the intended HTTPS FoodProNet endpoint; prove rejection with mocked malicious links. [F-002](PRODUCTION_READINESS_AUDIT.md#f-002--upstream-nutrition-links-can-choose-arbitrary-server-destinations)
3. **Implementation — A003/A004:** preserve unknown nutrient fields and assign unique stable Nutrislice portion IDs; verify that one 120-cal and one 240-cal portion remain separate and total 360. [Audit findings](PRODUCTION_READINESS_AUDIT.md#detailed-findings)
4. **Implementation — A005:** catch blocked/full localStorage writes and keep the app usable with truthful save status; establish the record/reset contract with A009/A013. [Audit findings](PRODUCTION_READINESS_AUDIT.md#detailed-findings)
5. **Product decision + validation — A006/A009:** agree on informational nutrition/allergen wording, map provider icons correctly, and specify browser-data/analytics notice and deletion behavior. Then finish A010/A012 before broad release. [Audit findings](PRODUCTION_READINESS_AUDIT.md#detailed-findings)
'''
(base/'REMEDIATION_PLAN.md').write_text(plan)
(base/'evidence/checklist.json').write_text(json.dumps([dict(zip(['id','applicability','status','priority','actual','evidence','actions'],r)) for r in rows],indent=2))
print(json.dumps({'applicable':dict(counts),'excluded':excluded_ids,'findings':dict(fc),'reportBytes':(base/'PRODUCTION_READINESS_AUDIT.md').stat().st_size,'planBytes':(base/'REMEDIATION_PLAN.md').stat().st_size},indent=2))

# KnightBite remediation plan

Prepared September 10, 2026 against working tree on `codex/dining-hall-overhaul` at `1fbe14b7805c95d69bffda11913b4739f8ce8db5` plus the recorded pre-existing edits. This is a plan; no fixes were applied. Read [the audit](PRODUCTION_READINESS_AUDIT.md) for exact evidence and boundaries.

**First objective:** reduce public exposure risk and make food/plate information truthful, then finish browser and operational readiness. Keep the current architecture. No accounts, database, replacement framework or new vendor are required by these findings.

## Priority and dependency order

- P0: no currently confirmed P0 finding. If actual image/OS exposure establishes a critical reachable advisory, urgently promote A001; collect access evidence through A011 now.
- P1 implementation: A001 dependency updates → A002 outbound request policy → A003 nutrition completeness, A004 portion identity, A005 storage resilience and A006 dietary semantics. A007 resource bounds may proceed alongside data correctness. Finish A010 accessibility after component behavior settles.
- P1 verification/operations: A011 evidence/ownership and A009 privacy decisions can begin immediately. A012 release gates should capture regressions as each fix lands, then validate the completed build.
- P2: A008 browser-header hardening after framework/privacy choices; A013 plate/data lifecycle and goal-bar polish; A014 status/documentation clarity. Qualifying static hours need not wait for a new integration.

Proposed owners below are roles, not assigned people. Effort ranges are low/medium-confidence estimates of focused engineering work with the existing stack; they exclude access delays, external review and provider changes. Rollouts refer to future separately authorized work.

## A001 — Security maintenance is behind current framework/native-image fixes

- Related finding/checks: [F-001](PRODUCTION_READINESS_AUDIT.md#f-001--security-maintenance-is-behind-current-frameworknative-image-fixes), REL-02.
- Priority / outcome / gate: **P1**. Upgrade Next to at least the verified 15.5.24 maintenance release or a later supported patched release, then re-resolve and inspect sharp/native image and PostCSS advisories. Do not assume a Next update automatically fixes every transitive dependency. Required before broad release; A001/A002 also precede a newly exposed real-use build.
- Proposed owner / effort: Frontend/platform maintainer; medium (roughly 0.5–2 engineering days, assuming normal compatibility); deploy access needed only for release verification.
- Existing files/modules/evidence: package-lock.json:1910,1962,2073,2257,2376; evidence/fresh-artifact.json; advisory table below.
- Sequence/dependencies: Start now; A011 establishes deployed exposure.
- Observable acceptance: Locked and installed versions match; relevant advisories are patched or documented as unreachable using effective production configuration. Build/tests pass, maps render, no new mock fallback. Recheck advisory feeds on implementation date.
- Validation/environment: run locked dependency resolution in a future isolated update branch, inspect transitive/native versions and advisory conditions, then `npm test`, TypeScript, production build and browser map smoke. A clean install is proposed, not already tested.
- Rollout/rollback: stage first; retain a known-good patched artifact. Do not silently roll back to a version with a reachable critical flaw. No database migration.
## A002 — Upstream nutrition links can choose arbitrary server destinations

- Related finding/checks: [F-002](PRODUCTION_READINESS_AUDIT.md#f-002--upstream-nutrition-links-can-choose-arbitrary-server-destinations), ARC-03, ARC-05, INT-02, INT-03, INT-04, RLY-07.
- Priority / outcome / gate: **P1**. Parse links relative to FoodProNet and enforce exact HTTPS origin, permitted path, credentials/port rules and expected recipe/context parameters. Reject or validate every redirect; prefer rejecting redirects if the source does not require them. Validate returned label identity where available. Required before broad release; A001/A002 also precede a newly exposed real-use build.
- Proposed owner / effort: Backend maintainer; small/medium (0.5–1.5 days); independent of UI work.
- Existing files/modules/evidence: lib/providers/rutgers-provider.ts:528-529,558-570,777-800,855-865; lib/providers/atrium-menu-context.ts:68-76; evidence/audit-probes.json.
- Sequence/dependencies: Independent code fix; do before any new public deployment.
- Observable acceptance: Local fixture tests prove off-origin, HTTP, credentialed, deceptive-host, traversal and redirect cases cause zero disallowed requests. Expected relative label URLs still enrich menus; rejected enrichment keeps truthful unknown values. No live private-address probe required.
- Validation/environment: local synthetic fixtures and isolated browser/staging checks as described above. Proposed regression files belong under `tests/` or a documented browser-test directory; these paths are proposed, not files changed in this audit. Existing read-only probes are under `evidence/` and must be converted to assertions for the intended corrected behavior.
- Rollout/rollback: release through a reviewed isolated branch and staged smoke test; revert that focused change if necessary while retaining earlier security fixes. No server database migration; coordinate any edge policy with the deployed application version.
## A003 — Missing nutrition fields become real-looking zeros

- Related finding/checks: [F-003](PRODUCTION_READINESS_AUDIT.md#f-003--missing-nutrition-fields-become-real-looking-zeros), DATA-04, INT-04, RLY-01, RLY-07, UX-01, PIPELINE-01, SPECIAL-01.
- Priority / outcome / gate: **P1**. Preserve per-field presence/quality and custom state across provider, MenuItem, PlateItem and totals. Show known subtotals and incomplete coverage; handle a verified all-zero food distinctly from missing values. Reconcile label identity with requested food. Required before broad release; A001/A002 also precede a newly exposed real-use build.
- Proposed owner / effort: Full-stack maintainer with product nutrition review; medium (1–3 days); coordinate A002 and A006.
- Existing files/modules/evidence: lib/providers/rutgers-provider.ts:293-330,885-892; lib/types.ts:5-12,60-65; lib/nutrition.ts:3-24,54-65; hooks/usePlate.tsx:21-28; components/menu/HallStationExplorer.tsx:277-284; components/plate/PlateScreen.tsx:12,79-85.
- Sequence/dependencies: Coordinate data model with A002/A006; land before final UI/accessibility validation.
- Observable acceptance: Fixtures for complete, calorie-only, genuine-zero, invalid/out-of-range, missing-label and custom foods render truthful field states and incomplete totals. Adding/removing unknown foods updates coverage; no missing field silently becomes a known zero.
- Validation/environment: local synthetic fixtures and isolated browser/staging checks as described above. Proposed regression files belong under `tests/` or a documented browser-test directory; these paths are proposed, not files changed in this audit. Existing read-only probes are under `evidence/` and must be converted to assertions for the intended corrected behavior.
- Rollout/rollback: release through a reviewed isolated branch and staged smoke test; revert that focused change if necessary while retaining earlier security fixes. Version and safely migrate any changed browser record; preserve a compatible read path and prevent deleted data from returning. No server database migration.
## A004 — Distinct Nutrislice portions share one plate identity

- Related finding/checks: [F-004](PRODUCTION_READINESS_AUDIT.md#f-004--distinct-nutrislice-portions-share-one-plate-identity), DATA-04, RLY-01, RLY-04, RLY-07, PIPELINE-02.
- Priority / outcome / gate: **P1**. Apply deterministic collision-safe identity to Nutrislice variants, preserving noncolliding IDs. Define how current plate items behave when refreshed source data changes. Required before broad release; A001/A002 also precede a newly exposed real-use build.
- Proposed owner / effort: Backend/frontend maintainer; small (0.5–1 day); add fixture regression before implementation.
- Existing files/modules/evidence: lib/providers/rutgers-provider.ts:410-412,415-437,1080-1126; hooks/usePlate.tsx:34-45; evidence/audit-probes.json. Atrium already disambiguates variants at lib/providers/rutgers-provider.ts:949-956.
- Sequence/dependencies: Add failing fixture before modifying identity; integrate with A003 plate snapshot changes.
- Observable acceptance: One-cup/120-cal and two-cup/240-cal fixtures remain separate when each is added; one of each totals 360 calories. Identical duplicate entries still collapse; source order/refresh does not swap variant identities.
- Validation/environment: local synthetic fixtures and isolated browser/staging checks as described above. Proposed regression files belong under `tests/` or a documented browser-test directory; these paths are proposed, not files changed in this audit. Existing read-only probes are under `evidence/` and must be converted to assertions for the intended corrected behavior.
- Rollout/rollback: release through a reviewed isolated branch and staged smoke test; revert that focused change if necessary while retaining earlier security fixes. Version and safely migrate any changed browser record; preserve a compatible read path and prevent deleted data from returning. No server database migration.
## A005 — Preference storage writes fail outside error handling

- Related finding/checks: [F-005](PRODUCTION_READINESS_AUDIT.md#f-005--preference-storage-writes-fail-outside-error-handling), ARC-05, DATA-03, RLY-05, RLY-07, REL-06, UX-01, UX-03.
- Priority / outcome / gate: **P1**. Guard writes, continue with in-memory preferences, expose accurate save/unavailable status and use an explicit validated/versioned storage schema. Preserve malformed or older stored values safely according to a documented migration decision. Required before broad release; A001/A002 also precede a newly exposed real-use build.
- Proposed owner / effort: Frontend maintainer; small (0.5–1 day); coordinate privacy/storage lifecycle with A009/A013.
- Existing files/modules/evidence: hooks/useUserPreferences.tsx:71-112; components/layout/AppShell.tsx:17-34; evidence/audit-probes.json.
- Sequence/dependencies: Decide record/deletion contract with A009/A013.
- Observable acceptance: Synthetic SecurityError, QuotaExceededError, corrupt JSON, wrong types and legacy records do not break any route or falsely report a successful persistent save. Normal reload persistence still works; no network is required.
- Validation/environment: local synthetic fixtures and isolated browser/staging checks as described above. Proposed regression files belong under `tests/` or a documented browser-test directory; these paths are proposed, not files changed in this audit. Existing read-only probes are under `evidence/` and must be converted to assertions for the intended corrected behavior.
- Rollout/rollback: release through a reviewed isolated branch and staged smoke test; revert that focused change if necessary while retaining earlier security fixes. Version and safely migrate any changed browser record; preserve a compatible read path and prevent deleted data from returning. No server database migration.
## A006 — Dietary icon classification confuses positive labels with allergens

- Related finding/checks: [F-006](PRODUCTION_READINESS_AUDIT.md#f-006--dietary-icon-classification-confuses-positive-labels-with-allergens), RLY-01, RLY-07, PIPELINE-01, SPECIAL-02, SPECIAL-03.
- Priority / outcome / gate: **P1**. Define provider-specific explicit mappings for contains/allergen versus dietary/free-from labels. Validate real sanitized source examples and preserve unknown labels without interpreting them as medical assurances. State clearly that saved preferences do not yet filter, or implement only an agreed, independently validated scope. Required before broad release; A001/A002 also precede a newly exposed real-use build.
- Proposed owner / effort: Full-stack/product owner; medium (1–2 days plus source/domain review); A003 shares data-quality metadata.
- Existing files/modules/evidence: lib/providers/rutgers-provider.ts:56-57,368-394,1460-1462; lib/menu-filters.ts:15-20; components/menu/HallStationExplorer.tsx:278-288; components/profile/ProfileScreen.tsx:17-35; evidence/audit-probes.json.
- Sequence/dependencies: Requires sanitized provider semantic examples and product scope decision; coordinate A003.
- Observable acceptance: Positive and negative gluten/milk/nut labels, unknown labels and missing icons remain semantically distinct through provider/UI tests. No absent data creates a free-from claim. Product owner documents informational scope; qualified dining/allergy reviewer approves any safety claims before use.
- Validation/environment: local synthetic fixtures and isolated browser/staging checks as described above. Proposed regression files belong under `tests/` or a documented browser-test directory; these paths are proposed, not files changed in this audit. Existing read-only probes are under `evidence/` and must be converted to assertions for the intended corrected behavior.
- Rollout/rollback: release through a reviewed isolated branch and staged smoke test; revert that focused change if necessary while retaining earlier security fixes. No server database migration; coordinate any edge policy with the deployed application version.
## A007 — Resource bounds stop at timers and worker counts

- Related finding/checks: [F-007](PRODUCTION_READINESS_AUDIT.md#f-007--resource-bounds-stop-at-timers-and-worker-counts), ARC-05, DATA-04, DATA-05, INT-01, INT-04, INT-05, RLY-02, RLY-05, RLY-06, SERVICE-03, PIPELINE-01, PIPELINE-03, PIPELINE-04.
- Priority / outcome / gate: **P1**. Bound streamed response bytes, validated arrays/strings, overall per-load work and retained cache entries; evict expired keys. Keep shared in-flight caching. Establish platform-level traffic limits and measure representative cold/cache-hit behavior before deciding whether any shared cache is needed. Required before broad release; A001/A002 also precede a newly exposed real-use build.
- Proposed owner / effort: Backend/platform maintainer; medium (1–3 days); depends on A002 for destination control and A011 for deployed limits.
- Existing files/modules/evidence: lib/providers/rutgers-provider.ts:174-178,439-510,532-550,608-625,855-865,1380-1409; README.md:169.
- Sequence/dependencies: A002 destination checks first; A011 provides actual edge/runtime budgets.
- Observable acceptance: Local oversized/chunked/malformed fixtures fail within a documented byte/item budget and do not block other hall loads. A multi-day cache soak plateaus. Proposed starting test targets: 2 MiB/menu response, 256 KiB/label, 1,500 items/meal; calibrate against approved fixtures before treating as requirements.
- Validation/environment: local synthetic fixtures and isolated browser/staging checks as described above. Proposed regression files belong under `tests/` or a documented browser-test directory; these paths are proposed, not files changed in this audit. Existing read-only probes are under `evidence/` and must be converted to assertions for the intended corrected behavior.
- Rollout/rollback: release through a reviewed isolated branch and staged smoke test; revert that focused change if necessary while retaining earlier security fixes. No server database migration; coordinate any edge policy with the deployed application version.
## A008 — Browser security headers lack a configured baseline

- Related finding/checks: [F-008](PRODUCTION_READINESS_AUDIT.md#f-008--browser-security-headers-lack-a-configured-baseline), WEB-01.
- Priority / outcome / gate: **P2**. Add an appropriate production header policy through the app or hosting edge, with CSP compatible with Next scripts, inline styles, image assets and analytics. Start CSP validation/report-only as appropriate; verify real HTTPS settings. May follow core release safeguards unless the product makes this a required promise.
- Proposed owner / effort: Frontend/platform maintainer; small/medium (0.5–1.5 days); patch Next first (A001), then coordinate analytics A009.
- Existing files/modules/evidence: next.config.ts:1-9; evidence/runtime-results.json; components/menu/HallStationExplorer.tsx:280-288.
- Sequence/dependencies: After A001; align script policy with A009 analytics decision and A011 edge.
- Observable acceptance: Header inspection and real browser navigation show intended framing restriction, nosniff/referrer behavior, and no broken hydration, maps or analytics caused by CSP. Verify HSTS/redirects at the actual HTTPS edge after host evidence is available.
- Validation/environment: local synthetic fixtures and isolated browser/staging checks as described above. Proposed regression files belong under `tests/` or a documented browser-test directory; these paths are proposed, not files changed in this audit. Existing read-only probes are under `evidence/` and must be converted to assertions for the intended corrected behavior.
- Rollout/rollback: release through a reviewed isolated branch and staged smoke test; revert that focused change if necessary while retaining earlier security fixes. No server database migration; coordinate any edge policy with the deployed application version.
## A009 — Privacy notice, browser data controls and analytics evidence are incomplete

- Related finding/checks: [F-009](PRODUCTION_READINESS_AUDIT.md#f-009--privacy-notice-browser-data-controls-and-analytics-evidence-are-incomplete), DATA-01, DATA-02, DATA-05, DATA-06, DATA-07, PRV-01, PRV-02, PRV-03, PRV-04, PRV-05, WEB-03, SPECIAL-03.
- Priority / outcome / gate: **P1**. Document local-only preferences and transient plate, add clear-local-data controls, decide any export/retention promises, and inspect deployed analytics payloads/settings with synthetic data. Name the service owner and obtain product/privacy review of required notices and consent. Required before broad release; A001/A002 also precede a newly exposed real-use build.
- Proposed owner / effort: Product/privacy owner and frontend maintainer; medium (1–2 days engineering plus account/policy decision); coordinate A005/A013 and A011.
- Existing files/modules/evidence: hooks/useUserPreferences.tsx:32,71-112; hooks/usePlate.tsx:31-32; app/layout.tsx:3,20; components/profile/ProfileScreen.tsx:42-52; no privacy route in app inventory.
- Sequence/dependencies: Begin decisions/read-only account inspection now; A005/A013 implement storage behavior.
- Observable acceptance: Clearing local data removes the preference key and resets relevant UI without restoring it from a late write. Synthetic dietary canaries do not appear in analytics/log payloads. Retention, region, dashboard access and any consent choice match actual account settings and published notice.
- Validation/environment: local synthetic fixtures and isolated browser/staging checks as described above. Proposed regression files belong under `tests/` or a documented browser-test directory; these paths are proposed, not files changed in this audit. Existing read-only probes are under `evidence/` and must be converted to assertions for the intended corrected behavior.
- Rollout/rollback: release through a reviewed isolated branch and staged smoke test; revert that focused change if necessary while retaining earlier security fixes. Version and safely migrate any changed browser record; preserve a compatible read path and prevent deleted data from returning. No server database migration.
## A010 — Plate and preference controls lack complete accessible semantics

- Related finding/checks: [F-010](PRODUCTION_READINESS_AUDIT.md#f-010--plate-and-preference-controls-lack-complete-accessible-semantics), RLY-07, UX-04, WEB-04, WEB-05.
- Priority / outcome / gate: **P1**. Implement an accessible drawer/dialog pattern and named quantity/remove controls. Use native checkboxes or correctly stateful switches. Verify focus indicators, contrast, zoom, small screens and reduced motion throughout plate/profile workflows. Required before broad release; A001/A002 also precede a newly exposed real-use build.
- Proposed owner / effort: Frontend/accessibility reviewer; medium (1–2 days); run after nutrition and identity UI changes.
- Existing files/modules/evidence: components/plate/PlateDrawer.tsx:55-69,157-168; components/profile/ProfileScreen.tsx:159-170; components/plate/PlateScreen.tsx:37-59; components/plate/PlateItemRow.tsx:29-43.
- Sequence/dependencies: After A003/A004/A005/A006 changes; add keyboard/browser checks to A012.
- Observable acceptance: Keyboard open/Tab/Shift+Tab/Escape/close returns focus correctly; background is unavailable while modal. Screen reader announces item-specific controls and checked states. Test Safari/VoiceOver and one Chromium browser at 320px and 200% zoom with synthetic menus.
- Validation/environment: local synthetic fixtures and isolated browser/staging checks as described above. Proposed regression files belong under `tests/` or a documented browser-test directory; these paths are proposed, not files changed in this audit. Existing read-only probes are under `evidence/` and must be converted to assertions for the intended corrected behavior.
- Rollout/rollback: release through a reviewed isolated branch and staged smoke test; revert that focused change if necessary while retaining earlier security fixes. No server database migration; coordinate any edge policy with the deployed application version.
## A011 — Production access, monitoring and recovery have not been verified

- Related finding/checks: [F-011](PRODUCTION_READINESS_AUDIT.md#f-011--production-access-monitoring-and-recovery-have-not-been-verified), ARC-04, DATA-01, DATA-02, SEC-02, SEC-06, INT-03, INT-05, RLY-02, RLY-06, PRV-03, PRV-04, OPS-01, OPS-02, OPS-03, OPS-05, REL-01, REL-03, REL-04, REL-05, SERVICE-03, SERVICE-05, PIPELINE-03, PIPELINE-05.
- Priority / outcome / gate: **P1**. Identify production/staging origins and provider/project; collect sanitized read-only evidence of deployed commit/build, runtime/OS, IAM/MFA/deploy rights, TLS and edge limits, log/analytics access/retention, and release history. Assign an operational owner and practice failure detection/rollback in staging. Required before broad release; A001/A002 also precede a newly exposed real-use build.
- Proposed owner / effort: Platform/operator with product owner; medium (0.5–2 days once access is available); no implementation or production mutation authorized by this audit.
- Existing files/modules/evidence: README.md:169; app/layout.tsx:20; no hosting configuration in initial inventory; evidence/build-metadata.json is local.
- Sequence/dependencies: Start immediately; requires production/staging/repository read access and an owner.
- Observable acceptance: An evidence pack links the deployed release to a reviewed source hash, shows intended access and resource limits, and records one synthetic upstream-outage alert plus rollback exercise. Proposed targets: alert on sustained all-hall unavailability within 5 minutes, restore known-good release within 30 minutes; owner must accept or revise.
- Validation/environment: collect read-only production settings; use a separate staging environment and synthetic outages for alert/recovery exercises. Evidence collection has no rollout. Any staging/production setting change requires its own implementation task.
- Rollout/rollback: not applicable to read-only evidence; record and rehearse the chosen release rollback in staging.
## A012 — Release verification is not yet a repeatable gate

- Related finding/checks: [F-012](PRODUCTION_READINESS_AUDIT.md#f-012--release-verification-is-not-yet-a-repeatable-gate), ARC-05, SEC-02, RLY-06, RLY-07, OPS-03, OPS-05, REL-01, REL-03, REL-04, REL-05, REL-06, REL-07, WEB-05.
- Priority / outcome / gate: **P1**. Configure a noninteractive linter, pin a supported Node runtime, enforce test/typecheck/build gates with isolated data, and establish code review/branch protection/deploy provenance. Extend tests to the concrete findings; document dependency update and rollback procedure. Review .env.* ignore coverage and dependency/license notices. Required before broad release; A001/A002 also precede a newly exposed real-use build.
- Proposed owner / effort: Maintainer/platform owner; medium (1–2 days); A001 first, regression fixtures alongside A002–A006, browser smoke after A010.
- Existing files/modules/evidence: package.json:5-28; README.md:54-60; evidence/lint.txt; evidence/npm-test.txt; evidence/build.txt; no .github workflow or runtime pin in initial snapshot.
- Sequence/dependencies: A001 first; regression tests accompany each fix; final smoke after A010.
- Observable acceptance: A clean isolated checkout can perform a documented locked install and checks without prompts/live upstream calls; required CI checks prevent release on failure. Actual host settings and deployed commit match. Controlled browser smoke covers menus, portions, plate and preferences.
- Validation/environment: local synthetic fixtures and isolated browser/staging checks as described above. Proposed regression files belong under `tests/` or a documented browser-test directory; these paths are proposed, not files changed in this audit. Existing read-only probes are under `evidence/` and must be converted to assertions for the intended corrected behavior.
- Rollout/rollback: release through a reviewed isolated branch and staged smoke test; revert that focused change if necessary while retaining earlier security fixes. No server database migration; coordinate any edge policy with the deployed application version.
## A013 — Plate and preference lifecycle behavior needs explicit product decisions

- Related finding/checks: [F-013](PRODUCTION_READINESS_AUDIT.md#f-013--plate-and-preference-lifecycle-behavior-needs-explicit-product-decisions), DATA-03, DATA-06, DATA-07, RLY-03, RLY-04, REL-06, UX-02, UX-03, UX-05, WEB-03.
- Priority / outcome / gate: **P2**. Decide whether plate state should remain temporary or be locally persisted with a date/schema boundary. Communicate the lifecycle, consider undo, define last-write/cross-tab behavior, and cap visual progress at the track while showing numeric overage. May follow core release safeguards unless the product makes this a required promise.
- Proposed owner / effort: Product/frontend owner; small/medium (0.5–1.5 days); A005/A009 determine storage/deletion behavior.
- Existing files/modules/evidence: hooks/usePlate.tsx:31-73; hooks/useUserPreferences.tsx:100-112; components/plate/PlateScreen.tsx:88-94; components/plate/MacroTotals.tsx:69-78.
- Sequence/dependencies: Product decision with A005/A009; no server schema needed.
- Observable acceptance: Reload behavior matches the documented decision; clear/undo and storage reset behave consistently. Two-tab edits follow the chosen rule. 0/100/250% goal cases remain within layout while numeric values stay accurate.
- Validation/environment: local synthetic fixtures and isolated browser/staging checks as described above. Proposed regression files belong under `tests/` or a documented browser-test directory; these paths are proposed, not files changed in this audit. Existing read-only probes are under `evidence/` and must be converted to assertions for the intended corrected behavior.
- Rollout/rollback: release through a reviewed isolated branch and staged smoke test; revert that focused change if necessary while retaining earlier security fixes. Version and safely migrate any changed browser record; preserve a compatible read path and prevent deleted data from returning. No server database migration.
## A014 — Static operating hours and unfinished preferences need clearer product status

- Related finding/checks: [F-014](PRODUCTION_READINESS_AUDIT.md#f-014--static-operating-hours-and-unfinished-preferences-need-clearer-product-status), ARC-02, REL-07, UX-03, UX-05, WEB-05.
- Priority / outcome / gate: **P2**. Label schedule status as typical/unverified and link an authoritative hours source, or use a verified schedule with exceptions. Clarify saved-preference scope. Record supported environments, release stage, owner/support contact and relevant asset/license decisions. May follow core release safeguards unless the product makes this a required promise.
- Proposed owner / effort: Product/frontend owner; small (0.5–1 day plus source decision); no upstream probing required for the immediate copy improvement.
- Existing files/modules/evidence: app/page.tsx:15-84; README.md:18; components/profile/ProfileScreen.tsx:17-35; components/menu/HallStationExplorer.tsx:199.
- Sequence/dependencies: Independent copy/source decision; preserve existing live-menu honesty.
- Observable acceptance: Weekend, holiday, between-meal and unavailable-menu scenarios show the intended qualified status. A user can tell which preferences actively filter. Existing precise live/unavailable/source-time distinctions and approximate map notice remain intact.
- Validation/environment: local synthetic fixtures and isolated browser/staging checks as described above. Proposed regression files belong under `tests/` or a documented browser-test directory; these paths are proposed, not files changed in this audit. Existing read-only probes are under `evidence/` and must be converted to assertions for the intended corrected behavior.
- Rollout/rollback: release through a reviewed isolated branch and staged smoke test; revert that focused change if necessary while retaining earlier security fixes. No server database migration; coordinate any edge policy with the deployed application version.

## Release evidence checklist

A release candidate needs a reviewed source/build identity; matching locked/runtime dependency versions; green noninteractive tests/types/lint/build; representative complete/partial/failed menus; separate portion totals; guarded storage; keyboard and screen-reader plate/preferences; intentional analytics and clear-local-data behavior; verified HTTPS/edge and deployment access; and an owned alert/rollback exercise. Each requirement maps to the A-actions above. Passing a compiler or receiving an HTTP 200 does not satisfy the user-workflow gates.

Proposed acceptance budgets require owner approval, not blind enforcement: A007 starting menu/label/item caps must be calibrated with realistic sanitized fixtures; A011’s five-minute sustained-outage detection and thirty-minute rollback targets should match release scale. There is no need to back up public menu caches as if they were irreplaceable customer records. If product scope adds accounts, uploads, payments or clinical/allergy guarantees, reopen the applicable audit modules before that release.

## Next five concrete actions

1. **Verification + implementation — A011/A001:** identify deployed version/host/image-loader exposure, then update Next and triage its actual sharp/PostCSS dependency tree against current patches. [F-001](PRODUCTION_READINESS_AUDIT.md#f-001--security-maintenance-is-behind-current-frameworknative-image-fixes)
2. **Implementation — A002:** restrict Atrium label URLs and redirect destinations to the intended HTTPS FoodProNet endpoint; prove rejection with mocked malicious links. [F-002](PRODUCTION_READINESS_AUDIT.md#f-002--upstream-nutrition-links-can-choose-arbitrary-server-destinations)
3. **Implementation — A003/A004:** preserve unknown nutrient fields and assign unique stable Nutrislice portion IDs; verify that one 120-cal and one 240-cal portion remain separate and total 360. [Audit findings](PRODUCTION_READINESS_AUDIT.md#detailed-findings)
4. **Implementation — A005:** catch blocked/full localStorage writes and keep the app usable with truthful save status; establish the record/reset contract with A009/A013. [Audit findings](PRODUCTION_READINESS_AUDIT.md#detailed-findings)
5. **Product decision + validation — A006/A009:** agree on informational nutrition/allergen wording, map provider icons correctly, and specify browser-data/analytics notice and deletion behavior. Then finish A010/A012 before broad release. [Audit findings](PRODUCTION_READINESS_AUDIT.md#detailed-findings)

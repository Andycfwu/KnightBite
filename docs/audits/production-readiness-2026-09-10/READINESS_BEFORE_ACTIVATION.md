# Historical readiness report before release activation

Archived without rewriting its evidence. The personal-MFA finding below is superseded by the fresh verification in [NEXT_RELEASE_READINESS_STATUS.md](NEXT_RELEASE_READINESS_STATUS.md). Earlier dates/results remain historical.

# KnightBite next release-readiness status

September 10, 2026. Evidence collected in UTC; GitHub inspection began around 19:56, authenticated Vercel inspection around 20:09. Per-artifact timestamps are recorded in [next-release-evidence](next-release-evidence/). This pass preserved pre-existing/concurrent work and made no deployment, push, repository/hosting setting change, credential rotation, paid-service activation, direct Rutgers request or live menu smoke test.

**Verdict: local release verification is substantially stronger; broad release remains blocked.** The actual public deployment is identified and is still the older source. Required release checks, owner MFA, accountable operations/privacy/dietary review, and a staging recovery rehearsal remain unresolved. Nothing in this report authorizes deployment automatically.

## Verified current state

### GitHub and the real deployment path

Read-only authenticated GitHub inspection of `Andycfwu/KnightBite` confirms:

- Public repository; default branch `main` at `70166c4fd04bb0d5ca25b792283924eff36c1f31`. Main is unprotected, its protection endpoint reports “Branch not protected,” and there are no rulesets.
- **Zero remote workflows, zero check runs on main.** Its successful combined status contains only `Vercel`. The release workflow remains local and cannot currently block a merge or deployment.
- GitHub `Production` has no protection rules or branch policy. Actions permissions are read-only by default and cannot approve PR reviews; all actions are allowed and organization-wide SHA pinning is not enforced. The local workflow itself pins its two actions.
- Dependabot alerts and security updates are both disabled. Secret scanning/push protection are enabled. There is only one collaborator with write/admin access; requiring a separate approving review today would prevent that person's own PRs from merging.

Evidence: [github-current.json](next-release-evidence/github-current.json). GitHub Actions app ID `15368` was verified with read-only `GET /apps/github-actions`.

Authenticated Vercel UI confirms the mapping that GitHub metadata alone could not prove:

| Property | Observed value |
| --- | --- |
| Team / plan / project | `andycfwus-projects` / **Hobby** / `knight-bite` |
| Project ID | `prj_9YAmvm8vdwwNn8hdgLhl4ZqomKDw` |
| Production alias | `knightbitenb.vercel.app` |
| Current deployment | `dpl_BT9hARabzozdRpqMutPju4P2xF5F`, Ready/Current, created 2026-09-10 03:19:13 UTC |
| Generated URL | `knight-bite-91ztd8vhb-andycfwus-projects.vercel.app` |
| Source | `main`, full SHA `70166c4fd04bb0d5ca25b792283924eff36c1f31` |
| Public Next build ID | `jdlvZvs26JKotB4wyx-C5` |
| Production promotion | **Auto-assign custom production domains ON; no Deployment Checks configured** |
| Git integration | Connected to `Andycfwu/KnightBite`; no deploy hooks; verified commits inherit Disabled |
| Runtime | Node **24.x**; Fluid Compute; `iad1`; 1 vCPU/2 GB; project default duration **300 seconds** |
| Other controls | Standard Vercel Authentication ON for protected deployment URLs; public alias accessible. Skew protection, failover and rolling releases OFF. |

The integration builds on Git pushes and promotes successful production builds without the local release check. The GitHub environment does not control this Vercel promotion path. A Vercel “success” status proves deployment success, not the test gate. [Vercel Git integration](https://vercel.com/docs/git/vercel-for-github)

### Deployed versus local remediation

The deployed build log explicitly detects **Next 15.5.15** and mentions **sharp 0.34.5**. Its source lockfile resolves React/DOM 19.2.5, root PostCSS 8.5.9 and Next's PostCSS 8.4.31. The local remediation resolves Next 15.5.25, React/DOM 19.2.8, sharp 0.35.4 and PostCSS 8.5.28. The deployed source's `next.config.ts` contains only the old typed-routes setting: the new image restrictions and browser headers are not there. See [remote source package](next-release-evidence/remote-package.json), [lockfile](next-release-evidence/remote-package-lock.json), [config](next-release-evidence/remote-next.config.ts.txt) and [Vercel inspection](next-release-evidence/vercel-current.json).

The exact deployed Node patch, native-library versions/architecture and per-function timeout overrides were not exposed by the inspected resource/source UI. They must be captured from an authorized release artifact/build log; local Linux native evidence is not proof of the old deployment's binaries. The earlier advisory/reachability assessment remains in [REMEDIATION_STATUS.md](REMEDIATION_STATUS.md): affected package versions are not proof that an exploit's input/runtime prerequisites are reachable.

Safe GET/HEAD checks of `/profile` and an observed CSS asset confirm HTTP→HTTPS **308**, a hostname-valid certificate (expires November 27), HSTS, a cached static profile with `public, max-age=0, must-revalidate`, and immutable one-year caching for hashed CSS. The local CSP, framing, nosniff, referrer and permissions headers are absent from the public profile response. No live hall route, malicious optimizer URL, or cache-bypass/load probe was used. No effective dynamic hall-cache behavior or transformed-image/native vulnerability was certified. The generated deployment URL redirects unauthenticated requests to Vercel login; login-page headers in the evidence are explicitly not deployment headers. [HTTP evidence](next-release-evidence/deployment-http.json), [HTTPS/cache evidence](next-release-evidence/https-cache.json)

### IAM, data and monitoring

The sole visible Vercel owner is returned by the **2FA Disabled** member filter and not by **2FA Enabled**. Team 2FA enforcement is disabled. Standard deployment authentication protects generated URLs, but an owner can still promote, force-promote or change project settings. A complete token, GitHub App permission and historical share/bypass-link inventory was not extracted, and no credential value was read.

Web Analytics is enabled, as requested; the dashboard shows no custom events and project Speed Insights is not enabled. Project Drains and Alerts offer an upgrade to Pro and are not configured. Deployment retention is 30 days for canceled, errored, pre-production and production builds. Team IP visibility is on for dashboard and drains; no drain is configured. AI training/data sharing is disabled globally at team level.

The current plan's documented limits are **one hour of runtime logs** and **one month of analytics reporting**. These are service limits, not a verified deletion schedule for every backup/derived record. Function region `iad1` does not establish analytics/log residency. [Runtime logs](https://vercel.com/docs/logs/runtime), [analytics reporting window](https://vercel.com/docs/analytics/limits-and-pricing)

## Local changes and verification

Only release tooling/tests, a sanitized fixture and documentation changed in this pass. Application menus, cache budgets/deadlines, provider parsing, identities, station maps, design, temporary plates and explicit unavailable behavior were not changed.

| Files | Purpose |
| --- | --- |
| `.github/workflows/release-checks.yml` | Unique `KnightBite release verification` job; Ubuntu 24.04; checkout credentials not persisted. Existing least-privilege permissions, SHA pins, PR/main triggers and complete check sequence retained. |
| `.github/dependabot.yml` | Proposed npm and GitHub Actions weekly update PRs, Monday 05:00 America/New_York, five open PRs per ecosystem, no auto-merge. It is local, not active remotely. |
| `scripts/isolated-build.mjs`, `scripts/synthetic-server.mjs` | Build with analytics enabled, record that fact, verify build identity before serving, preserve blocked provider network and synthetic test-only transport. |
| `tests/weekly-payload.test.tsx`, `tests/fixtures/nutrislice/*` | Calibrate the unchanged limits with an existing sanitized full week; assert all seven requested dates' accepted items and unique IDs are conserved. |
| `tests/browser/release-evidence.spec.ts`, `tests/browser/workflows.spec.ts` | Intercept analytics and verify CSP/payload canaries; complete forward/backward dialog keyboard cycles, named quantity actions and switch/save status. |
| README, release checklist, operations/accessibility handoffs, this report/evidence | Current release workflow, exact settings, coverage boundaries and ownership actions. Prior audit evidence retained. |

The previous verified application-source fingerprint matched the starting working tree, so its evidence was reviewed before new checks. One new analytics-enabled isolated build was needed for Linux/platform parity and CSP verification.

Checks completed on **Ubuntu 24.04/Linux x64**, locally emulated on the Mac, using official Playwright `v1.63.0-noble` image digest `sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27` and checksum-verified Node **24.21.0**:

- Clean `npm ci`; `npm test`: **242 passed** with provider network blocked.
- `npm run typecheck` and `npm run lint`: **passed**, zero lint warnings.
- `npm run build:isolated` → clean install, **`npm run build` passed**, isolated types passed. Build ID **`0ieWqu8yMrbGYWaa4lbI8`**; full source digest in [linux-build-manifest.json](next-release-evidence/linux-build-manifest.json).
- `npm run test:browser`: **20 passed** across Chromium/WebKit. A subsequent run with the captured Vercel script: **4 passed** (two analytics/CSP and two keyboard checks).
- `npm audit --audit-level=moderate`: **zero vulnerabilities**. Installed Linux sharp reports 0.35.4, libheif 1.23.2, libvips 8.18.6 and aom 3.15.0.
- Official `actionlint` 1.7.12 validates the workflow, with its downloaded binary SHA verified. Dependabot YAML parses with the expected ecosystems. `git diff --check`: **passed**. A final macOS `npm test` also passes **242 tests**. See [final verification/scope](next-release-evidence/final-verification.json).

Commands were completed in phases: the first attempt linted a temporary vendor-script file accidentally placed inside the disposable Linux source directory; it was moved outside lint scope. The first new keyboard assertion mistakenly included the `tabindex=-1` backdrop; only the test selector was corrected. The same compiled app was reused for the passing browser rerun. The manifest preserves the pre-correction test file hash; final test-source hashes are recorded separately. No product change or build failure was hidden. Next 15 still emits its legacy ESLint plugin-detection warning; standalone lint is green and configured with Next rules.

This verifies Linux command compatibility, not a GitHub-hosted run, Actions token behavior or Vercel deployment enforcement. The workflow must still produce a real check on the reviewed commit. [Linux build/check output](next-release-evidence/linux-verification.txt), [final browser/audit/native output](next-release-evidence/linux-browser-verification.txt)

### Payload calibration and analytics evidence

The existing Livingston lunch week is 6,551,705 bytes, 270,517 nodes, depth 10, maximum 226 array entries and 203 food candidates on one day. Sanitization/reserialization produces a 7,065,491-byte fixture, still under 8 MiB/500,000 nodes. Exact food counts 179/192/192/203/195/178/176 survive all requested dates; full-week and isolated-day normalized meals are equal. The limits were **not increased and nothing was truncated**. [Payload metrics/provenance](next-release-evidence/weekly-payload.json), [fixture limitations](../../../tests/fixtures/nutrislice/README.md)

Missing evidence is specific: independent Busch/Neilson weeks; Livingston breakfast/dinner and another peak/seasonal week; full schools response; full Atrium menu/label captures with transport sizes and independent recipe/date/location identity. Replaying one lunch body across three meal requests is not independent breakfast/dinner coverage. Its source filename and schema identify its intended use; original acquisition headers/command are absent. Existing FoodProNet excerpts and synthetic oversized/stress cases do not establish every production maximum.

The public Vercel script was downloaded as an asset only, decoded and replayed locally (SHA-256 **`0bd2ad276f13ba1712f7444a40f1313df6399b920a64ede78922deeddc5d3408`**, 3,106 bytes). Browser automation detection was disabled only inside the intercepted loopback context so the script actually executed. Script requests and collector requests were fulfilled locally, no analytics events were delivered by these tests, no CSP violations occurred, and plate/preferences canaries were absent from the captured pageview payloads. [Intercepted evidence](next-release-evidence/analytics-intercepts.json) records four Chromium and three WebKit pageviews. Ordinary CI uses a clearly labeled synthetic transport probe; it does not fetch the mutable vendor script. This is sampled compatibility evidence, not a guarantee about future scripts, every URL/query/referrer or the unpatched deployed CSP.

## Exact proposed shared settings — approval required, not applied

### GitHub

1. Publish the reviewed workflow through a separately authorized feature-branch/PR action, never by an unreviewed push to main. Observe a green **`KnightBite release verification`** check from GitHub Actions on the exact candidate SHA. Do not add a nonexistent required check and mistake a blocked branch for a broken workflow.
2. After a second authorized reviewer is available, apply [proposed-main-protection.json](next-release-evidence/proposed-main-protection.json) to **`Andycfwu/KnightBite`, branch `main`**: PR required, one approval from someone other than the last pusher, stale approvals dismissed, resolved conversations, strict up-to-date GitHub Actions check (app ID 15368), linear/squash history, administrators included, no force pushes or deletion. Do not require a successful Production deployment before merging: that creates a cycle with main-triggered deployment. Do not add a redundant overlapping ruleset.
3. **Lockout:** currently only one writer/admin exists. They cannot approve their own PR. Reviewer selection/access is a blocking owner decision; no collaborator was invited. If the owner explicitly chooses a temporary sole-maintainer policy, the exact interim JSON changes are `required_approving_review_count: 0` and `require_last_push_approval: false`; all other protections stay. That is a documented review exception, not the recommended broad-release state.
4. Keep Actions default token read-only, cannot approve PRs. Enable required full-SHA action pinning if available for this repository; restrict allowed actions to GitHub-authored actions plus repository-local actions, retaining the two pinned workflow actions. Keep auto-merge off; use squash merges and delete merged feature branches. Enable dependency graph, Dependabot alerts and security updates; publish the prepared weekly version-update config. Security-update PRs must pass the same check/review gate; weekly scheduling does not replace security alerts.
5. GitHub **Production** environment: propose branch policy `main` only, prevent self-review, one named release reviewer and no admin bypass if an Actions deployment job is introduced. No such job exists now, so these rules are defense in depth only and must not be represented as protecting Vercel. A reviewer name is still required; do not invent one or create a deployment job in this pass.

Unique job names matter for required checks. Enforcing admin restrictions and independent review requires deliberate recovery planning. [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

### Vercel

| Setting | Exact proposed state and workflow effect |
| --- | --- |
| Repository / production branch | Keep `Andycfwu/KnightBite` / `main`. Keep standard Next.js build (`npm run build`), normal analytics enabled, Node 24.x; require release evidence of the actual Node patch/native artifact matching the supported range. Do not deploy the isolated test artifact. |
| Deployment Checks | In `knight-bite → Settings → Build and Deployment → Deployment Checks → Add Checks`, select GitHub and require **`KnightBite release verification`** from the reviewed repository/commit. A Vercel build may finish, but production domains must wait for that same SHA's successful check. Do not select the `Vercel` deployment status as its own gate. |
| Automatic domain assignment | Final gated state **ON**, because GitHub-backed Vercel checks require it. Freeze main merges/promotions during setup. If the check cannot yet be selected or enforcement cannot be demonstrated, propose a temporary **OFF** hold instead; builds/previews continue and existing production remains, but new domains require owner-controlled promotion. Restore ON only as part of configuring/verifying the gate. The temporary hold is not itself automatic check enforcement. |
| Bypass | Limit Force Promote, direct CLI `--prod`, alias changes and rollback to the accountable owner; record an exceptional bypass with SHA/reason/approver. The Hobby owner can still change controls; no technical elimination of owner bypass is claimed. Keep generated deployment authentication ON and do not create automation bypass secrets or public preview exceptions. |
| MFA | Owner enrolls 2FA and validates recovery **personally first**, then confirms existing token owners/integrations. Only afterward enable team **Two-Factor Authentication Enforcement**. Current disabled-MFA owner would otherwise lose access; user-owned pipeline tokens/builds may fail. No credentials were changed. |
| Resources / region | Retain observed Fluid Compute, `iad1`, 1 vCPU/2 GB and 300-second project default for now. Do not lower host deadlines or expand resources without a measured need. Record effective per-function limits, managed concurrency/rate limits and resource alarms before release-scale traffic. |
| Analytics / logs / retention | Keep analytics enabled and temporary plates. Retain current 30-day deployment retention pending owner approval; do not promise longer rollback history. Alerts/Drains/extra retention require a separate plan/budget decision, not an upgrade here. IP visibility/redaction and data residency/retention decisions remain below. |

Vercel documents both the auto-alias prerequisite and Force Promote bypass. GitHub environment protection is insufficient for this integration. Verify the first blocked/passed production-check transition only in a separately authorized deployment exercise; changing settings alone is not that evidence. [Vercel Deployment Checks](https://vercel.com/docs/deployment-checks)

**Activation sequence:** owner 2FA/recovery and reviewer decision → separately authorized workflow PR/check → freeze production mutations → approve/apply GitHub and Vercel gates (or temporary promotion hold) → verify selected check identity/settings → separately authorize reviewed patch release and gate/rollback exercise. No workflow publishing, settings change or release is included in the approval implicitly.

## Remaining owners and evidence, by audit finding

The first implementation details and tests remain in [REMEDIATION_STATUS.md](REMEDIATION_STATUS.md). This is the follow-up disposition of every finding:

| Finding | Current disposition / next action |
| --- | --- |
| F-001 dependencies | **Fixed locally**, now Linux-native verified; **remaining deployed** older packages. Release reviewed patch and capture deployed artifact/runtime. |
| F-002 destinations | **Fixed locally**, offline rejection tests retained; deployed patch and full independently identifying Atrium label evidence still needed. |
| F-003 missing nutrition | **Fixed locally**, browser/unit coverage green; deployed patch and domain review remain. |
| F-004 portions | **Fixed locally**, unique identities and totals retained; deployment remains. |
| F-005 storage | **Fixed locally**, browser workflows pass Linux; Safari spoken feedback review remains. |
| F-006 dietary/allergens | **Fixed technical classification locally**; requires named qualified reviewer/Rutgers source-semantic confirmation, with no allergy-safety guarantee. |
| F-007 bounds | **Fixed locally**, captured weekly conservation added; missing payload matrix and host rate/concurrency evidence remain. |
| F-008 headers | **Fixed locally**, analytics-enabled CSP passes; public alias still lacks headers. Verify edge after authorized release; full nonce CSP remains deferred. |
| F-009 privacy | **Local mechanics verified**, analytics enabled and sampled payloads intercepted; owner/contact, retention/deletion, region, access and notice decisions remain. |
| F-010 accessibility | **Automated keyboard/semantics verified**, full modal cycles added; actual Safari/VoiceOver, system zoom and full composited contrast remain manual. |
| F-011 operations | **Host/provenance/IAM inspected**, actionable runbook prepared; owner MFA, actual alert coverage and an approved rollback rehearsal remain blockers. |
| F-012 release gates | **Local Linux workflow commands verified**; remote workflow, required check/merge/Vercel gate enforcement remain unapplied. |
| F-013 plate/goals | **Fixed chosen behavior**, temporary plates and goal semantics retained; no new persistence decision needed. |
| F-014 wording/scope | **Fixed locally**; release stage, support owner, hours exceptions and asset/license approval remain owner decisions. |

The privacy owner must specifically decide and record: who can view/export analytics and raw logs; whether IP visibility should remain enabled for diagnosis; allowed URLs/query/referrers and redaction rules; retention/deletion periods for runtime logs, analytics aggregates/identifiers, incident exports and backups; actual processing/storage regions and subprocessors; public service identity/contact and notice/consent requirements; and how clear-local-data is explained without promising deletion of hosting records. Neither the 24-hour visitor-session description nor a reporting-window limit is a universal deletion guarantee. [Vercel analytics data guidance](https://vercel.com/docs/analytics/privacy-policy)

## Prioritized release blockers and next action

1. **P0:** reviewed security/truthful-menu remediation is not deployed; the old public release and missing effective headers are verified. Identify the exact reviewed patch commit and authorize its release only through verified gates.
2. **P0:** no enforced merge/deploy checks and the current Vercel owner lacks MFA. Approve the staged settings, complete personal MFA/recovery and decide independent review before activating lockout-sensitive rules.
3. **P1:** no accountable service/backup/privacy/dietary owners, no verified automated menu-outage detection, and no patched rollback rehearsal. Use [OPERATIONS_RUNBOOK.md](../../OPERATIONS_RUNBOOK.md); Hobby cannot supply the native alarm currently proposed without a plan decision.
4. **P1:** complete actual Safari/VoiceOver and contrast review using [ACCESSIBILITY_QA.md](../../ACCESSIBILITY_QA.md), domain/privacy/asset signoff, missing payload calibration and deployed-native/host limits evidence before broad use.

The next reviewable action is approval of the staged shared-settings proposal and owner prerequisites, followed by a separately authorized workflow publication and release. **Correctly dated stored-real-menu recovery remains future work**; no durable snapshots, stale recovery, scheduler, database, accounts or new vendor were introduced.

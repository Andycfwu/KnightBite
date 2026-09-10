# KnightBite Vercel operations handoff

Prepared September 10, 2026. This is an actionable procedure for an authorized operator, not a claim that alerting or rollback was rehearsed. No actions below were executed against hosting settings or deployments in the readiness pass.

## Identify the service before acting

- GitHub: `Andycfwu/KnightBite`, production branch `main`.
- Vercel: Hobby team `andycfwus-projects`, project `knight-bite`, project ID `prj_9YAmvm8vdwwNn8hdgLhl4ZqomKDw`.
- Public alias: `knightbitenb.vercel.app`. At inspection it served `dpl_BT9hARabzozdRpqMutPju4P2xF5F`, commit `70166c4fd04bb0d5ca25b792283924eff36c1f31`. Recheck the [project overview](https://vercel.com/andycfwus-projects/knight-bite) each time; this is historical identity, not a permanently designated rollback target.
- Runtime shown: Node 24.x, Fluid Compute, `iad1`, 1 vCPU/2 GB; project default duration 300 seconds. App deadlines and per-process caches are separate.

The inspected production deployment predates the remediation, including its structured ingestion summaries. Do not expect the new log schema until a reviewed patched release is actually deployed.

## Ownership and coverage to fill before broad release

Name one service/release owner, a backup with approved access, an incident contact channel, and a person responsible for monitoring during releases. Separately name the privacy/notice owner and the Rutgers/dietary-label reviewer. Repository ownership does not establish acceptance of these duties. Record contact details privately; do not commit personal emergency contact information to this public repository.

The Hobby dashboard offers an upgrade for Alerts and Drains; neither is configured. There is **no verified automated menu-outage alarm**. Vercel documents only one hour of Hobby runtime-log history; visible dashboard history is not a deletion or data-residency guarantee. Preserve a minimal sanitized incident record promptly. [Runtime log limits](https://vercel.com/docs/logs/runtime)

For a limited, explicitly attended release, the assigned operator can keep [project Logs](https://vercel.com/andycfwus-projects/knight-bite/logs) open, filter Environment = Production and the exact deployment ID, and review the following signals every five minutes for the first 30 minutes and after a user report. This manual watch does not provide unattended coverage. The owner must decide whether that limitation is acceptable; five-minute detection and thirty-minute restoration are proposed targets, not promises.

## Alert specification for review

Use the existing hosting platform only if its available plan supports the required signal and notification destination. Do not upgrade, add a drain/vendor or create a paid monitor without separate approval.

| Signal | Proposed trigger and response |
| --- | --- |
| Navigation/runtime outage | Any repeatable blank/error page, or at least five failed function requests and a 5xx rate of at least 20% over five minutes: notify the service owner and start triage. Native error-anomaly alerts, if later enabled, supplement this; they are not exact threshold or menu-health alerts. |
| Real-menu ingestion outage | For each hall/requested Rutgers date, three distinct completed attempts in five minutes with `outcome` `unavailable` or `error`, with no intervening returned menu: notify the operator. Escalate as all-hall impact only when there is affirmative evidence for all four halls. |
| Partial/source-quality degradation | Three distinct `partial` attempts in fifteen minutes, especially label enrichment failures or rising unknown nutrition: investigate without claiming the entire menu is absent. |
| Rejected destination or resource budget | Any `destination_rejected`, `response_too_large` or `resource_limit`: examine sanitized counts/context before changing a validator or limit. Never follow the rejected URL. |
| No observations | No logs/traffic is an evidence gap, not a success or outage. A periodic synthetic check would be a separately scoped operational decision, not something this pass installed. |

Use `event = knightbite.menu_ingestion`, hall/date, `startedAt`, outcome and bounded failure groups. Count attempts, not request rows, meal subrecords or homepage card timeouts. A 200 response can contain an unavailable menu. A 1.1-second homepage status timeout does not prove provider failure. Cached menus and shared loads suppress new attempts; a fifteen-minute positive TTL and two-minute null TTL mean this log-based trigger cannot promise detection within five minutes of the upstream outage itself. Vercel's [native alerts](https://vercel.com/docs/alerts) concern platform anomalies; the semantic ingestion trigger still needs an approved implementation or human inspection.

Example human escalation, to be sent only by the assigned operator: “KnightBite menu retrieval is degraded for [hall(s)] for Rutgers date [date], first observed [UTC time], deployment [ID/SHA], category [bounded category]. Menu availability is unconfirmed. Owner [name] is investigating; next update [time].” Do not include bodies, ingredients, preference/plate values, IP addresses, secrets or arbitrary exception strings.

## Triage

1. Record UTC time and the separately calculated Rutgers calendar date, affected route/hall, deployment ID/SHA, and browser symptom. Check the production alias in Vercel before attributing a report to a local fix.
2. Inspect the production logs and build identity. Search the event name, then inspect hall/date, outcomes, per-meal states and failure groups. Missing summaries may mean the old release, cache hits, no traffic or a logging failure; they do not prove healthy ingestion.
3. `durationMs` ends when the daily loader exits. An early error may show siblings still `pending`, with null measurements and incomplete normalization. Later sibling completion does not rewrite that record or emit a second summary.
4. Separate network/HTTP/deadline failures from malformed structure, wrong requested date/context, rejected destinations and enrichment failures. Preserve `DailyMenu | null` and the explicit unavailable state. Do not label failures “closed,” invent an update time, or use sample food.
5. Compare with the last reviewed source change. Reproduce using sanitized fixtures locally. If a representative accepted week exceeds a bound, preserve the whole requested-day menu while measuring a revised budget; never silently slice it. Do not run load tests or malicious URL probes against Rutgers or production.
6. If a normal live smoke is separately authorized, make only the minimal ordinary route requests, accounting for the existing cache TTLs. Do not refresh continuously or bypass caches merely to generate logs. Keep analytics test payloads intercepted.

## Rollback and recovery

Before a release, record its approved source SHA/check run, deployment ID, public domains, normal build settings, and the previous **patched and verified** production artifact. Verify eligibility in the dashboard. The currently inspected older deployment is not an approved security fallback.

For an incident, the authorized release owner opens the project overview, chooses **Rollback**, verifies the target deployment/SHA, and confirms only after checking that it retains the security and truthful-menu fixes. On Hobby, only the immediately previous production deployment is eligible; if it is vulnerable or unsuitable, do not select an arbitrary older preview. A forward fix or other release action needs explicit release authorization. [Vercel Instant Rollback](https://vercel.com/docs/instant-rollback)

Rollback restores the prior build/configuration, not newly edited environment values. Vercel disables automatic production domain assignment after rollback. Record that state, keep the incident open, and re-establish the required deployment checks before a separately approved promotion/Undo Rollback restores automatic assignment. Do not bypass a failing check with Force Promote as a routine recovery step.

After restoration, verify alias-to-deployment mapping, HTTPS/headers, navigation, truthful unavailable output, portion/unknown totals and preference saving/clearing. Record the target, approver, elapsed time, residual impact and next action. Never infer upstream menu availability from a successful build or HTTP 200.

The required rehearsal remains open: an isolated/staging synthetic ingestion outage, detection acknowledgement, and an authorized rollback between two reviewed patched artifacts, followed by domain/check verification. No staging deployment, alert notification or rollback was performed in this pass.

**Correctly dated stored-real-menu recovery remains future work.** No snapshots, database, scheduler or plate persistence were added.

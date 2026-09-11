# Human release signoffs — unsigned

Record reviewer name, date, exact approved commit and supporting evidence for each acceptance. Technical checks do not authorize production or supply these decisions. Andy, as the sole maintainer, must either accept each ownership role explicitly or appoint a reviewer; repository ownership alone is not acceptance.

| Owner to appoint | Required decision / observation | Status |
| --- | --- | --- |
| Accessibility reviewer | Execute actual Safari/VoiceOver procedure in [ACCESSIBILITY_QA.md](ACCESSIBILITY_QA.md), including spoken quantity/removal feedback, focus return, 200% zoom, and measured map/photo contrast. Record failures and accepted limitations. Browser keyboard/DOM tests are supporting evidence only. | Unsigned |
| Privacy/service owner | Approve named service/contact and accurate notices; decide analytics/log retention and deletion (including derived data/backups), regions/subprocessors, dashboard/drain access and IP visibility, consent obligations and incident-record retention. Analytics remains enabled by product direction; no legal assurance is implied. | Unsigned |
| Dietary/source reviewer | Review unknown versus zero, dietary/allergen wording, portion identities and representative source captures. Missing labels must never imply allergy safety. Confirm asset permissions. | Unsigned |
| Release/incident operator and backup | Accept exact candidate, attended release window, five-minute log reviews for 30 minutes, incident contact and outage triage. Acknowledge unavailable automated Hobby alerting and choose whether first-patch recovery without secure Instant Rollback is acceptable, or defer until an eligible patched artifact/rehearsal exists. | Unsigned |
| Production approver (Andy) | Separately authorize the exact main-driven production procedure after blockers are resolved/accepted. A merge can automatically build and assign the production domain. Require the successful check's actual main checkout SHA to match the deployment; do not force-promote or treat a Preview check as proof of that lifecycle. | Not requested / not approved |

No signoff was inferred from earlier approval of Preview deployments, temporary zero PR approvals, analytics enabled, personal/team 2FA, or temporary plates. Correctly dated stored-real-menu recovery remains future work.

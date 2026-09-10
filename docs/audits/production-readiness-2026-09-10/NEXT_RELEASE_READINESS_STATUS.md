# KnightBite protected hosted verification — in progress

September 10, 2026. Production remains unapproved on `70166c4fd04bb0d5ca25b792283924eff36c1f31`. PR #1 remains draft. This pass preserves the original dirty UI worktree and changes only the isolated release branch. [Previous publication/runtime report](READINESS_BEFORE_HOSTED_VERIFICATION.md).

The candidate adds Preview-only analytics suppression and protected runtime/header/unavailable diagnostic views. Production analytics stays enabled, plates temporary, and normal menu retrieval has no mock fallback. See [verification procedure](../../PREVIEW_VERIFICATION.md). A Preview-built artifact must never be promoted as the Production artifact; rebuild the approved source under Production.

Local `npm run check` passed on Node 24.19.0 and 24.21.0: each 249 units, 28 browser checks, types, lint, isolated Production and Preview builds. Audit found zero dependency vulnerabilities; actionlint and diff whitespace checks passed. [Exact source digest and results](hosted-evidence/local-verification.json). Prior component advisory assessment still applies; these checks are not upstream or function-runtime evidence.

GitHub still requires the strict named check from app 15368, with accepted temporary zero approvals and remaining protections unchanged. Vercel still lists the GitHub check as Production / Blocking and team 2FA enforced. [GitHub settings](hosted-evidence/branch-protection.json), [Vercel read-back](hosted-evidence/hosting-controls.json). No production gate lifecycle has been exercised.

The actual current Hobby rollback picker offers only pre-remediation `906b5fd20433acb16b848a3eaf536cba9795a47b` / `dpl_Cw8UgwpjjaqwStBK9FTqus6tn33D`; it was cancelled. This is distinct from 70166c4, which would be the predecessor after the first patched release. Neither is approved as a secure recovery artifact. [Picker and dependency evidence](hosted-evidence/rollback-inspection.json). A verified patched Preview will be recorded as a recovery-source candidate, not falsely labeled production rollback eligible.

Hosted verification and exact publication checks will be recorded after this candidate is published. **Not ready for production approval.** Human decisions remain explicitly [unsigned](../../RELEASE_HUMAN_SIGNOFF.md), including recovery strategy/operations, privacy and actual Safari/VoiceOver. Correctly dated stored-real-menu recovery remains future work.

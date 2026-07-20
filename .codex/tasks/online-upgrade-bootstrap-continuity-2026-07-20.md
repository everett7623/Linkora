# Online Upgrade Bootstrap Continuity

Date: 2026-07-20
Version: 0.27.7
Status: Complete

## Goal

Let a newly loaded Admin build recognize a just-completed version transition even when the source build predates tab-scoped upgrade feedback.

## Evidence

- Production workflow run `29728335970` and deployment `5518928695` successfully deployed v0.27.6.
- Production Worker `/health` and cache-bypassed Admin HTML both report v0.27.6.
- The operator's still-open page reports v0.27.5 and returned to the normal v0.27.6 update action after its one fallback reload.
- Commit `544c41b` (v0.27.5) schedules one finalizing reload but contains no upgrade-feedback persistence; commit `953582f` first introduces that persistence in v0.27.6.

## Work

- [x] Record the last successfully loaded Admin build version without storing credentials.
- [x] Infer a one-time completion notice from an older loaded build or a fresh prior update cache when explicit session feedback is absent.
- [x] Preserve explicit session feedback as the primary path and avoid new polling or reload loops.
- [x] Add unit and real-browser regressions for the source-build bootstrap boundary.
- [x] Synchronize v0.27.7 release metadata and documentation.
- [x] Pass 58 Admin unit, 25 Admin browser, 84 Worker, 64 deployment, 6 Demo API, and 4 project-site tests plus affected builds.
- [x] Publish v0.27.7 to `main` with `[skip ci]` while production remains on v0.27.6 for the owner-controlled upgrade test.

## Safety Boundary

- The fallback uses only semantic version strings and the existing anonymous update-check timestamp.
- The current already-running v0.27.5 tab cannot execute code introduced by later builds and still requires one manual refresh.
- Redirects, analytics, D1, KV, migrations, secrets, deployment gates, and production data remain unchanged.

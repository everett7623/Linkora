# Online Upgrade Readiness State - 2026-07-21

## Goal

Make an in-progress Admin page automatically converge to the deployed release without requiring a manual refresh, while avoiding a reload into a partially propagated Pages deployment.

## Evidence

- Production workflow `29811494912` deployed Worker and Admin v0.28.7, then failed its readiness step after the Admin entry script returned `text/html` for five minutes.
- The GitHub workflow dispatch endpoint returned `204`, so the Worker returned `runId: null` and the Admin could not poll a concrete workflow run.
- The stale v0.28.5 page continued to show "Worker and Admin deployment is running" after the runtime had changed.
- A manual reload later loaded v0.28.7 and showed completion.
- Current live checks confirm Worker v0.28.7, Admin HTML v0.28.7, and an `application/javascript` entry asset.

## Scope

- Require the target Worker version and a target Admin document with executable initial assets before automatic reload.
- Persist successful feedback on every success path, including `runId: null`.
- Wake a suspended poll when the tab becomes visible, focused, or online again.
- Cover real `204` dispatch behavior, delayed Pages asset propagation, and bounded failure behavior.
- Synchronize release metadata as v0.28.8.

## Status

- [x] Capture production workflow, runtime, Admin HTML, and asset MIME evidence.
- [x] Implement combined Worker/Admin readiness polling.
- [x] Persist and restore success feedback for the real no-run-ID path.
- [x] Add unit, browser, and deployment regressions.
- [x] Synchronize v0.28.8 release metadata and documentation.
- [ ] Deploy and verify the isolated Demo after the repository commit is pushed.

## Verification

- 60 Admin unit tests and all 25 Playwright browser scenarios pass.
- 110 Worker tests, Worker type-check, and 78 deployment policy tests pass.
- 6 Demo API and 4 project-site tests pass.
- Admin and project-site production builds pass.
- Official npm registry audit: zero known vulnerabilities.

## Safety Boundaries

- No redirect handler or redirect decision changes.
- No D1, KV, visits, migration, or analytics changes.
- No production deployment without the existing owner-controlled release gates.
- No polling loops that multiply across React effects.

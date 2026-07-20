# Online Upgrade Refresh Feedback

Date: 2026-07-20
Version: 0.27.6
Status: Complete

## Goal

Keep the successful online-upgrade result across the Admin refresh so operators see whether the deployed version is still propagating or has loaded successfully.

## Evidence

- Production online-upgrade run `29725992523` completed successfully and deployed v0.27.5.
- The first automatic refresh could still load the old v0.27.4 Pages assets and returned to the normal “v0.27.5 available” action.
- A later manual refresh loaded v0.27.5, but the in-memory upgrade phase had been lost, so no completion confirmation was shown.

## Work

- [x] Persist only the successful deployment target in tab-scoped session storage.
- [x] Distinguish waiting-for-propagation, one bounded follow-up refresh, and loaded-version success states.
- [x] Add an explicit manual refresh action without allowing duplicate deployment dispatches.
- [x] Add unit and real-browser regressions for stale and current post-refresh pages.
- [x] Synchronize v0.27.6 release metadata, changelog, progress, tasks, and operator documentation.
- [x] Pass 54 Admin unit, 24 Admin browser, 84 Worker, 64 deployment, 6 Demo API, and 4 project-site tests plus affected builds.

## Safety Boundary

- Upgrade feedback stores only a version string, timestamp, and bounded refresh flag in `sessionStorage`; no token or repository credential is stored.
- No second workflow poller or deployment dispatch path is introduced.
- Redirects, analytics, D1, KV, migrations, secrets, deployment gates, and production data remain unchanged.

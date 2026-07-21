# Analytics Comparison And Heatmap - 2026-07-21

## Goal

Make Analytics useful for period-over-period diagnosis and time-of-week traffic analysis while preserving the current filters, browser-local day boundary, redirect stability, and the stable visits schema.

## Scope

- Compare the selected range with the immediately preceding equal-length range.
- Return zero-filled previous daily totals for a visually aligned trend comparison.
- Return a bounded 7 x 24 local-time traffic heatmap with total, human, and bot visits.
- Add period comparison metrics, a previous-period trend overlay, and a weekday/hour heatmap.
- Keep every existing Analytics response field compatible.
- Update CSV output, tests, documentation, and release metadata for v0.28.7.

## Status

- [x] Read project progress, task, roadmap, Analytics contracts, Worker queries, exports, and current Admin visual components.
- [x] Define fixed-query, fixed-offset, and zero-baseline behavior.
- [x] Implement equal-period comparison and heatmap aggregation.
- [x] Implement comparison metrics, trend overlay, and activity heatmap.
- [x] Add focused Worker, scale, export, Admin, responsive, and accessibility coverage.
- [x] Synchronize v0.28.7 release metadata and project status.
- [ ] Run full tests, builds, and Demo verification.

## Verification

- 110 Worker tests, including real SQLite filter/boundary checks and 100k-visit budget coverage.
- 58 Admin unit tests and 25 Playwright browser scenarios.
- 78 deployment contracts, 6 Demo API tests, and 4 project-site tests.
- Worker type-check plus Admin and project-site production builds.
- Desktop and mobile screenshot review, Axe scan, and horizontal-overflow checks.
- Official npm registry audit: zero known vulnerabilities.

## Query And Contract Boundaries

- Add exactly three grouped queries: previous summary, previous daily totals, and current 7 x 24 activity buckets.
- Reuse every active Analytics filter for both periods.
- Keep heatmap output fixed at 168 cells and daily output fixed at the selected day count.
- Treat the browser-provided fixed UTC offset as the explicit local-time contract; do not infer daylight-saving transitions.
- Represent a missing previous baseline explicitly instead of returning an infinite percentage.

## Safety Boundaries

- No migration or visits schema change.
- No redirect handler, redirect decision, KV cache, or analytics write change.
- No per-row or per-bucket D1 query loops.
- Production deployment remains owner-controlled; only the isolated Demo is synchronized after verification.

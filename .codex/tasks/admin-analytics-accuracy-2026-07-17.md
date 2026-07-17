# Admin Shell And Analytics Accuracy - 2026-07-17

## Goal

Improve the production/Demo Admin shell, make the running version visible, add bounded near-real-time Analytics refresh, and correct conversion-event reporting without changing redirect behavior or the stable visits schema.

## Completed

- Aligned the desktop Sidebar brand row and content toolbar at 64px.
- Moved desktop language, theme, support, interface-mode, and Demo read-only controls into the toolbar.
- Added the exact Linketry version beneath the Logo with a changelog link.
- Added manual and saved 5/10/30 second Analytics refresh for aggregate and single-link pages.
- Paused automatic polling in hidden browser tabs and kept the latest request result.
- Changed conversion rate to conversion events divided by human clicks, excluding classified bots.
- Returned unavailable conversion metrics for country, device, browser, and referrer filters that conversion events cannot currently attribute.
- Added optional client `event_id` idempotency and currency-separated event value totals.
- Prevented long target/referrer labels from creating horizontal scrolling in mobile Analytics layouts.
- Made Playwright start an isolated strict-port server instead of reusing an unrelated process.
- Preserved the redirect path, KV cache rules, D1 link records, and asynchronous visit recording.

## Verification

- Admin unit tests: 47 passed.
- Worker tests: 81 passed.
- Admin browser smoke tests: 18 passed.
- Admin production build and Worker type-check passed.

## Deployment - 2026-07-18

- Production deployment completed through protected GitHub Actions run `29594282900`.
- Isolated Demo deployment completed through protected GitHub Actions run `29594530129`.
- Production Worker and Admin report `0.26.0`; Demo Worker and Admin report `0.26.0`.
- Production unauthenticated Admin API access returns `401`, and an unknown short link returns `404`.
- Demo Analytics reports 84 clicks, 79 eligible human clicks, and 12 conversion events from synthetic data.
- Demo country-filtered conversion metrics correctly return unavailable, and Demo conversion writes remain blocked with `403`.
- Live desktop brand/toolbar heights are both 64px; the 390px Analytics layout has no horizontal overflow; manual refresh updates successfully with no browser errors.

## Remaining Launch Work

- Rehearse the guided deployment flow on a completely fresh Cloudflare account.
- Add privacy-safe session or visitor-level attribution before conversion events can support visit-only country, device, browser, or referrer filters.
- Consider true streaming visit views only after the public ingestion, privacy, and operating-cost boundaries are defined.

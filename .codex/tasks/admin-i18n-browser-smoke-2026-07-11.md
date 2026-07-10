# Admin EN/ZH Browser Smoke Tests - 2026-07-11

## Status

Complete and verified locally.

## Completed

- [x] Added Playwright browser smoke tests for the Admin app.
- [x] Mocked authenticated Admin API responses so tests do not depend on D1, KV, or a live Worker.
- [x] Covered Login language switching in English and Simplified Chinese.
- [x] Covered authenticated Overview, Links, Create Link, and Settings flows in English.
- [x] Covered authenticated Overview, Links, Create Link, and Settings localization in Simplified Chinese.
- [x] Synced `document.documentElement.lang` when locale is restored from localStorage.
- [x] Added CI Chromium runtime installation before Admin tests.

## Safety Boundary

- No redirect, cache, import, analytics recording, or Worker API behavior changed.
- Smoke tests use mocked `/api/*` responses and do not mutate local or production data.

## Verification

- [x] Admin tests, including Playwright smoke
- [x] Admin production build
- [x] Worker type-check
- [x] Worker public-page tests

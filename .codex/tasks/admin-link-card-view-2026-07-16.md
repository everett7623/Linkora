# Admin Link Card View - 2026-07-16

## Status

Completed in v0.19.0.

## Scope

- [x] Keep the existing table as the default Links view.
- [x] Add an accessible table/card switch on the Links page.
- [x] Persist the selected view only in the current browser.
- [x] Reuse the existing paginated link response and existing link actions.
- [x] Preserve Advanced-mode selection and bulk-action behavior in both views.
- [x] Add English and Simplified Chinese labels.
- [x] Add unit and browser regression coverage.
- [x] Synchronize v0.19.0 release metadata and planning documents.

## Safety Boundary

- Worker routes, redirect behavior, D1, KV, analytics, and API response contracts are unchanged.
- The card view does not issue per-card analytics or metadata requests.
- The card view does not load destination favicons directly because that would disclose the Admin viewer to third-party target hosts; it uses a local neutral site icon.
- Unique visitors and referrer summaries remain deferred until a bounded list-level aggregation contract is designed.
- Destructive actions continue to use the existing confirmation flow.

## Verification

- Admin unit tests: 31 passed.
- Admin Playwright browser tests: 10 passed with the configured local Chromium executable path.
- Admin production build: passed.

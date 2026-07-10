# Public Status Pages EN/ZH — 2026-07-10

## Status

Complete and locally verified.

## Completed

- [x] Default public locale to English.
- [x] Resolve English or Simplified Chinese from weighted `Accept-Language` values.
- [x] Localize 404, disabled, expired, password, invalid-password, and safety-warning pages.
- [x] Preserve HTML escaping for slug, URL, and optional messages.
- [x] Add `Vary: Accept-Language` to localized HTML responses.
- [x] Keep normal redirect selection, D1/KV authority, analytics `waitUntil`, and status codes unchanged.
- [x] Localize reserved-path 404 responses.
- [x] Add Worker tests for locale negotiation, localized copy, escaping, and 301/302 `Location` semantics.
- [x] Run Worker public-page tests in deployment CI.

## Safety Boundaries

- No database, cache, analytics, redirect-rule, or visit-recording behavior changed.
- Public locale is request-derived and does not create cookies or persistent state.
- Normal redirects remain bodyless and preserve their original 301/302 status and destination.

## Verification

- [x] Worker tests: 3 passed
- [x] Worker type-check
- [x] Admin tests: 8 passed
- [x] Admin production build
- [x] Diff and file-size checks

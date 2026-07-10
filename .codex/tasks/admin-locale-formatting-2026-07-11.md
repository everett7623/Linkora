# Admin Locale-Aware Display Formatting - 2026-07-11

## Status

Complete and verified locally.

## Completed

- [x] Replaced remaining fixed Admin date display formats with `Intl.DateTimeFormat(locale, ...)` where dates are shown to operators.
- [x] Replaced remaining bare `toLocaleString()` calls in Admin pages with locale-aware formatting.
- [x] Localized API token scope labels and active/revoked status display.
- [x] Localized domain, redirect rule, import job, backup, and QR display labels that were still hardcoded.
- [x] Localized Create/Edit Link placeholders and safety-warning label.
- [x] Localized redirect rule types, unknown-link fallbacks, and weighted-rule display text.
- [x] Localized health-check units/fallback labels and group deletion type names.
- [x] Localized import field-mapping help, preview counts, conflict actions, and pasted-input labels.
- [x] Kept redirect behavior, Worker API behavior, database schema, and KV cache behavior untouched.

## Verification

- [x] Admin unit and Playwright smoke tests
- [x] Admin production build
- [x] Worker type-check
- [x] Worker public-page tests

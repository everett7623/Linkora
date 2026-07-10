# Core Admin EN/ZH Localization — 2026-07-10

## Status

Done and locally verified.

## Goal

Make the required post-deployment workflow usable in English and Simplified Chinese while keeping English as the default.

## Scope

- [x] Localize Overview headings, metrics, empty states, relative times, click counts, and copy feedback.
- [x] Localize Create Link basic labels, validation, redirect types, actions, and success feedback.
- [x] Localize Links headings, counts, search, status/sort filters, empty state, core table columns, action tooltips, confirmations, pagination, QR actions, and core feedback.
- [x] Localize shared link status badges.
- [x] Split core-page messages into a separate catalog to keep TypeScript files within size limits.

## Remaining

- [ ] Localize advanced-only controls within Create Link and Links.
- [ ] Localize Edit Link and shared suggestion/tag/UTM components.
- [ ] Add browser-level language switching coverage.

## Verification

- [x] Admin tests
- [x] Admin production build
- [x] Worker type-check
- [x] Diff and new-file size checks

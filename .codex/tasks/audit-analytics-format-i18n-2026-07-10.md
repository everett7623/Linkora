# Audit And Analytics Locale Formatting EN/ZH - 2026-07-10

## Status

Complete and verified locally.

## Completed

- [x] Localized Audit Logs action filter labels while preserving server action identifiers.
- [x] Localized Audit Logs pagination controls and page summary.
- [x] Localized Analytics UTM filter labels.
- [x] Made Analytics metric counts, bar values, daily chart labels, chart tooltips, and recent visit timestamps use the selected locale.
- [x] Localized per-link conversion event chart units.

## Safety Boundary

- No Worker redirect, cache, analytics recording, or API behavior changed.
- Server-provided audit action IDs and analytics dimension values remain unchanged.

## Verification

- [x] Admin tests
- [x] Admin production build
- [x] Worker type-check
- [x] Worker public-page tests

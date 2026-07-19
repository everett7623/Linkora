# Product Quality And Conversion UX - 2026-07-19

## Objective

Audit Linketry as an open-source self-hosted short-link product, then improve the highest-impact Analytics, conversion, mobile-layout, and Admin-loading issues without changing redirect behavior.

## Findings

- The mobile Analytics first viewport was dominated by fourteen attribution fields.
- Conversion values were returned per event but were not presented as a currency summary in the Admin.
- The UI could be read as a user conversion rate even though the current contract measures events per human click.
- Reset ignored unapplied draft filters.
- All authenticated pages were eagerly bundled into a roughly 573.7 KB entry chunk.
- Shlink/Sink comparison documents still described several completed features as missing.
- The official npm production audit reported zero known vulnerabilities.

## Implemented

- Added saved-view-aware progressive Analytics filters.
- Added shared aggregate/per-link Conversion Overview with a rolling-version fallback.
- Added currency-separated API and CSV summaries.
- Renamed the visible ratio to Event Rate and documented its denominator and limits.
- Added compact mobile actions, two-column mobile metrics, and consistent Analytics panel radii.
- Added route-level lazy loading while retaining the shell during navigation.
- Added `docs/PRODUCT_GAP_AUDIT.md` and refreshed roadmap/comparison documents.
- Added browser coverage for progressive filters, conversion values, and mobile overflow.
- Added Worker coverage for conversion value CSV output.

## Safety Boundary

- No migration was added.
- Redirect matching, target selection, response status, KV behavior, and D1 link ownership were not changed.
- Analytics queries remain outside the redirect response path.
- Demo and production resource separation is unchanged.

## Verification

- 63 deployment safety tests passed.
- 82 Worker tests and Worker type-check passed.
- 48 Admin unit tests and 20 Playwright browser workflows passed.
- 6 Demo API and 4 project-site tests passed.
- Admin, site, and Pages Function production builds passed.
- The official npm registry reported zero known production dependency vulnerabilities.

## Deployment

- Pushed commit `cf21821e24f74cb8e922b479144d4f9e51bad3de` to `main`.
- Production run `29688775610` completed successfully.
- Isolated Demo run `29688826084` completed successfully and passed its production-parity check.
- Production and Demo health endpoints plus both Admin assets report v0.27.0.
- The project site still exposes `demo.linketry.com` and the configured coffee link.

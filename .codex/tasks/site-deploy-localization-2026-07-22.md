# Public Deployment Page And Localization - 2026-07-22

## Goal

Give Linketry's public site a dedicated deployment page with two honest Cloudflare paths, a clearer GitHub entry, and a scalable English/Simplified Chinese language switch that defaults to English.

## Scope

- Add a multi-page `/deploy/` route to the static project site.
- Present Cloudflare Quick Deploy and the guarded repository workflow as separate paths.
- Keep the Cloudflare launcher explicit about required D1, KV, Pages/Admin, and secret choices.
- Add a shared locale registry with English default, Simplified Chinese, URL/local preference handling, and complete page translations.
- Replace the ambiguous outline GitHub glyph with a recognizable GitHub mark and visible label.

## Safety Boundaries

- No Worker, redirect, API, D1, KV, migration, secret, or production deployment changes.
- The Cloudflare launcher must not claim that it can silently select an account, bind user resources, or create a private Admin secret.
- Existing-installation upgrades remain on the documented non-destructive path.

## Status

- [x] Read the live project site, self-hosting guide, deployment safety documentation, and bootstrap behavior.
- [x] Add the locale registry and shared page interactions.
- [x] Build the dedicated deployment route and two-path content.
- [x] Update homepage navigation, GitHub identifier, and language controls.
- [x] Add route, localization, and deployment-entry coverage.
- [x] Synchronize v0.29.7 metadata and release documentation.
- [x] Build and verify desktop/mobile rendering.

## Verification

- 8 project-site tests cover the multi-page build, `/deploy/` sitemap entry, Cloudflare launch URL, reviewed workflow, locale registry, and GitHub identifier.
- Site TypeScript/build, Worker type-check, 110 Worker tests, 84 deployment tests, 64 Admin unit tests, 25 serial Admin browser smoke tests, Admin production build, and 6 Demo API tests pass.
- Local `http://127.0.0.1:4174/deploy/` was checked at desktop and 390px mobile widths. English is the default; switching to Simplified Chinese updates the whole public page, persists after reload, and remains available from the mobile menu with no console warnings.

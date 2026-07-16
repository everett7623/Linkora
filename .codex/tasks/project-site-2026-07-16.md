# Official Linketry Project Site - 2026-07-16

## Status

Complete. The independent Pages project is deployed and `linketry.com` is active and verified.

## Completed

- [x] Added an independent static Vite workspace under `apps/site`.
- [x] Reused the canonical Linketry mark and dark cyan/blue/indigo brand system.
- [x] Added product introduction, feature overview, Admin interface preview, architecture, self-hosting entry, docs, roadmap, license, and GitHub links.
- [x] Added responsive navigation, skip link, semantic landmarks, reduced-motion support, hardened Pages headers, robots policy, sitemap, and custom 404 page.
- [x] Added project-site contract tests and a production workflow build/deploy path behind the existing release safety gate.
- [x] Created the isolated `linketry-site` Cloudflare Pages project without changing Worker, D1, KV, R2, Queue, Admin, or short-link resources.
- [x] Recorded a current production D1 point-in-time restore bookmark and confirmed there are no pending migrations before the public-launch deployment.

## Activation

- [x] Deployed the reviewed build to `https://linketry-site.pages.dev` through GitHub Actions.
- [x] Added the purchased `linketry.com` apex domain to the Pages project's Custom domains.
- [x] Verified apex DNS, TLS, HTTP 200, and canonical/OpenGraph metadata on `https://linketry.com`.

## Safety Notes

- Redirect code and production data paths were not changed.
- The project site has no authentication, database, storage, secret, or Admin-token dependency.
- Apex DNS remains owner-managed; the active Cloudflare Pages custom-domain association must be preserved.

## Verification

- Project-site contract tests: 3 passed.
- Project-site TypeScript and production build: passed.
- Deployment policy tests: 27 passed.
- Worker type-check and tests: 58 passed.
- Admin unit tests: 13 passed.
- Admin Chromium smoke tests: 7 passed.
- Worker deploy dry-run: passed with Linketry 0.15.0 and the expected production bindings.

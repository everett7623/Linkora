# Admin Module Identity Recovery - 2026-07-22

## Objective

Restore production and Demo Admin rendering after v0.29.3 introduced two browser identities for the same Vite entry module and triggered React invalid-hook-call failures after authentication.

## Scope

- [x] Capture the live Demo console failure and identify the versioned/unversioned entry module pair.
- [x] Remove post-build query cache keys from initial Admin JavaScript and CSS assets.
- [x] Require canonical hashed asset paths and revalidating cache headers in build and live checks.
- [x] Add a production-build browser smoke test for the authenticated Overview route.
- [x] Add a localized root render fallback instead of leaving an empty application root.
- [x] Complete regression and release metadata synchronization.
- [ ] Deploy v0.29.4 to production and Demo, then verify both live Admin routes.

## Safety

- Redirect handlers and decisions are unchanged.
- Worker API behavior, D1, KV, migrations, analytics ingestion, and stored data are unchanged.
- Deployment checks remain fail-closed when Admin assets are missing, non-executable, or cached unsafely.

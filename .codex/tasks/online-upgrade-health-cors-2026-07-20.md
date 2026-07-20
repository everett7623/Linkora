# Online Upgrade Health CORS

Date: 2026-07-20
Version: 0.27.5
Status: Complete

## Goal

Prevent a successful online upgrade from being reported as timed out when an old Admin page verifies the new Worker version across origins.

## Evidence

- Production workflow run `29723961805` completed successfully for v0.27.4.
- Production Worker `/health` and the newly deployed Admin HTML both report v0.27.4.
- The still-open v0.27.3 Admin page remained stale and displayed the v0.27.4 update target.
- A production `/health` request with `Origin: https://admin.uukk.de` returned no `Access-Control-Allow-Origin` header.
- Worker CORS currently applies only to `/api/*`, while Admin runtime verification reads the public cross-origin `/health` route.

## Work

- [x] Add read-only CORS coverage for `/health` GET and OPTIONS requests.
- [x] Distinguish deployment timeout/failure from runtime-version verification failure in the Admin.
- [x] Add Worker, Admin unit, and browser regressions for the real failure boundary.
- [x] Synchronize v0.27.5 release metadata and documentation.
- [x] Run 50 Admin unit, 22 browser, 84 Worker, 64 deployment, 6 Demo API, and 4 site tests plus affected builds.
- [x] Publish v0.27.5 to `main` with `[skip ci]` while leaving production on v0.27.4 for the owner-controlled upgrade test.

## Safety Boundary

- `/health` remains public, read-only, uncached, and contains no credentials or private data.
- Redirects, analytics, D1, KV, migrations, secrets, deployment gates, and production data remain unchanged.
- Publishing uses `[skip ci]`, so update discovery advances without bypassing the owner-controlled production upgrade boundary.

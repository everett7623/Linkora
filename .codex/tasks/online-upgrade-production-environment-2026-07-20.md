# Online Upgrade Production Environment

Date: 2026-07-20
Version: 0.27.3
Status: Complete

## Goal

Make successful online upgrades visible as GitHub production deployments without changing the existing release gates, credentials, Cloudflare resources, or runtime behavior.

## Evidence

- Online-upgrade workflow run `29717446925` completed successfully for commit `a56e98e7d1a487504249b0d29d013207aec7015`.
- Production Worker `/health` and the authenticated Admin both report v0.27.2.
- The repository has only the `linketry-demo` GitHub environment and no `production` environment.
- `.github/workflows/deploy.yml` did not declare an environment for its `deploy` job, so GitHub created no production deployment record.

## Work

- [x] Bind `.github/workflows/deploy.yml` to `environment: production`.
- [x] Add a deployment-workflow contract assertion.
- [x] Document production-environment creation and verification.
- [x] Run 64 deployment safety and workflow contract checks plus `git diff --check`.
- [x] Create the repository `production` environment and verify it is listed separately from `linketry-demo`.

## Safety Boundary

- The v0.27.3 publication commit uses `[skip ci]`, so pushing the release does not trigger a production deployment.
- Production remains on v0.27.2 until the repository owner confirms the online upgrade from the authenticated Admin.
- No secret is read, moved, copied, printed, or rotated.
- Redirects, analytics, D1, KV, migrations, Cloudflare bindings, and Demo isolation are unchanged.

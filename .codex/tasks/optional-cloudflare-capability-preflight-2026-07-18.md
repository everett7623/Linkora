# Optional Cloudflare Capability Preflight - 2026-07-18

## Status

Implemented in Linketry v0.26.1. The code and regression coverage are complete; the isolated Demo is live on v0.26.1 while production remains on verified v0.26.0.

## Context

- The exposed old isolated Demo token was rotated and the GitHub environment secret was updated.
- The replacement token passed account identity, D1, KV, Worker, Pages, and Queue checks.
- Guarded Demo deployment run `29599334951` failed before migrations and deployment on each attempt because Cloudflare returned R2 error `10042`: R2 is not enabled for the selected account.
- The two optional Demo R2 variables were removed, and guarded core deployment run `29600589228` completed successfully.
- Live Demo verification passed for v0.26.0 health, D1/KV-backed reads, Queue binding, all Admin routes, synthetic Analytics, and the `403` write boundary.
- After the v0.26.1 preflight shipped, run `29602738195` restored both R2 variables and failed in the new read-only gate with exact code `10042`; every mutation step was skipped.
- The R2 variables were removed again, and guarded core run `29602948600` deployed the v0.26.1 Worker/Admin with Queue enabled.
- On 2026-07-18, v0.26.4 run `29639154619` restored both variables and again failed in the read-only gate with code `10042`; all writes were skipped and the variables were removed.

## Completed

- [x] Extend `--check-cloudflare` to inventory configured R2 buckets and Queue resources before deployment writes.
- [x] Keep optional resources absent from the environment fully optional.
- [x] Treat accessible but not-yet-created resource names as warnings so the guarded workflow may provision them later.
- [x] Fail closed on unavailable R2/Queue inventory access.
- [x] Translate Cloudflare R2 code `10042` into clear selected-account guidance.
- [x] Add tests for table/JSON inventory output, missing optional resources, and R2 `10042`.
- [x] Synchronize v0.26.1 release metadata and deployment documentation.

## Remaining External Action

- [ ] In the isolated Demo Cloudflare account, make R2 available to the API so `wrangler r2 bucket list` succeeds for account `a414...ddf35`.
- [ ] Restore `LINKETRY_DEMO_R2_BUCKET=linketry-demo-backups` and `LINKETRY_DEMO_R2_PREVIEW_BUCKET=linketry-demo-backups-preview` in the `linketry-demo` GitHub environment.
- [ ] Rerun the isolated Demo workflow and verify synthetic backup/report artifact downloads.

## Verification

- Deployment policy and Demo parity tests: 53 passed.
- Worker tests: 81 passed; TypeScript type-check passed.
- Admin tests: 47 unit and 18 Chromium browser tests passed; production build passed.
- Project-site tests: 4 passed; production build passed.
- No migration or redirect file changed, and no Cloudflare mutation was performed by the new checks.
- GitHub live parity verified Admin/Worker v0.26.1, canonical brand assets, all 18 read APIs, and the `403` write boundary.
- Live capabilities report D1 and KV enabled, Visit Queue enabled, and R2 backups disabled.

## Safety Boundary

- The preflight remains read-only and credential-redacted.
- Missing optional resources can be created only by the existing guarded workflow after all safety checks pass.
- Redirect handlers, asynchronous visit recording, D1/KV ownership, migrations, production data, and production Cloudflare resources are unchanged.

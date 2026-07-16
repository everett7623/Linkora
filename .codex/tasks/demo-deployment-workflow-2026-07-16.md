# Isolated Demo Deployment Workflow - 2026-07-16

## Status

Deployment isolation completed in Linketry v0.18.0; public read-only controls completed in v0.23.0; `demo.linketry.com` went live in v0.24.0; responsive Admin parity and isolated advanced resources completed in v0.25.0; current Wrangler inventory compatibility was repaired in v0.25.1.

## Scope

- [x] Add a dedicated, manually triggered Demo deployment workflow that cannot run through the production deployment path.
- [x] Use Demo-specific Cloudflare credentials and repository variables instead of production deployment inputs.
- [x] Fail before every Cloudflare write unless the release, commit, migration digest, account, resource IDs, names, and domains are explicitly approved and isolated.
- [x] Build and deploy only the Demo Worker and Admin; do not touch production DNS, the production project site, backups, resets, or existing production bindings.
- [x] Add policy tests and document the required GitHub environment configuration.
- [x] Synchronize release metadata and verify the affected deployment path.
- [x] Build a no-login public Demo Admin with a persistent EN/ZH read-only banner.
- [x] Reject mutating Demo API requests in both the browser client and Worker middleware.
- [x] Suppress real-visitor analytics writes while preserving redirect responses.
- [x] Apply Cloudflare's native Rate Limiting binding with hashed client keys to Demo API reads.
- [x] Generate and idempotently refresh synthetic links, visits, conversions, tags, settings, domain, and audit samples after migrations.
- [x] Create the protected `linketry-demo` GitHub environment and repository-level production protection inventory.
- [x] Add safety-gated Demo-only R2 buckets and Queue plus synthetic backup/report artifacts.
- [x] Populate all advanced Admin sections with deterministic synthetic records.
- [x] Keep R2 and Queue discovery compatible with current Wrangler table output.

## Safety Boundary

- The Demo API token must be scoped to a separate Cloudflare account with no production write capability.
- The workflow remains manual until the separate account, resources, credentials, and hostnames are reviewed.
- Separate-account resource provisioning, Pages custom-domain activation, and live Demo smoke tests are complete.
- Redirect logic, D1 schema, production workflow behavior, and production data are not changed by this slice.

## Verification

- Deployment policy tests: 39 passed.
- Worker type-check and tests: 72 passed.
- Admin unit tests: 38 passed; focused 390px Chromium coverage and the production build passed.
- Project-site tests: 3 passed; production build passed.
- New deployment gate and test files remain below the project JavaScript line limit.

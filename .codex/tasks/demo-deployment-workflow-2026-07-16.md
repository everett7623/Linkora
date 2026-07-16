# Isolated Demo Deployment Workflow - 2026-07-16

## Status

Deployment isolation completed in Linketry v0.18.0; public read-only and synthetic-data controls completed in v0.23.0. Live isolated resources remain external.

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

## Safety Boundary

- The Demo API token must be scoped to a separate Cloudflare account with no production write capability.
- The workflow remains manual until the separate account, resources, credentials, and hostnames are reviewed.
- Resource provisioning, DNS activation, and live Demo smoke tests remain separate follow-up work.
- Redirect logic, D1 schema, production workflow behavior, and production data are not changed by this slice.

## Verification

- Deployment policy tests: 38 passed.
- Worker type-check and tests: 72 passed.
- Admin unit tests: 37 passed; 13 Chromium tests and the production build passed.
- Project-site tests: 3 passed; production build passed.
- New deployment gate and test files remain below the project JavaScript line limit.

# Isolated Demo Deployment Workflow - 2026-07-16

## Status

Completed in Linketry v0.18.0.

## Scope

- [x] Add a dedicated, manually triggered Demo deployment workflow that cannot run through the production deployment path.
- [x] Use Demo-specific Cloudflare credentials and repository variables instead of production deployment inputs.
- [x] Fail before every Cloudflare write unless the release, commit, migration digest, account, resource IDs, names, and domains are explicitly approved and isolated.
- [x] Build and deploy only the Demo Worker and Admin; do not touch production DNS, the production project site, backups, resets, or existing production bindings.
- [x] Add policy tests and document the required GitHub environment configuration.
- [x] Synchronize release metadata and verify the affected deployment path.

## Safety Boundary

- The Demo API token must be scoped to a separate Cloudflare account with no production write capability.
- The workflow remains manual until isolated resources and synthetic data are reviewed.
- Automatic reset, public read-only behavior, rate limiting, seed data, and live Demo smoke tests remain separate follow-up work.
- Redirect logic, D1 schema, production workflow behavior, and production data are not changed by this slice.

## Verification

- Deployment policy tests: 35 passed.
- Worker type-check and tests: 60 passed.
- Admin unit tests: 20 passed; production build passed.
- Project-site tests: 3 passed; production build passed.
- New deployment gate and test files remain below the project JavaScript line limit.

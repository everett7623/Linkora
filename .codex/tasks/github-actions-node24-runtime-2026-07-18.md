# GitHub Actions Node.js 24 Runtime - 2026-07-18

## Status

Implemented and live-verified in production and the isolated Demo on Linketry v0.26.2 after the previous deployment reported that `actions/checkout@v4` and `actions/setup-node@v4` still target the deprecated Node.js 20 action runtime.

## Scope

- [x] Upgrade `deploy.yml` to `actions/checkout@v6` and `actions/setup-node@v6`.
- [x] Upgrade `deploy-demo.yml` to the same action versions.
- [x] Keep the workflow application runtime explicitly pinned to Node.js 24.
- [x] Preserve the existing explicit npm dependency cache.
- [x] Add production and Demo workflow contract assertions for both v6 actions.
- [x] Reject accidental reintroduction of either deprecated v4 action.
- [x] Synchronize v0.26.2 release metadata, examples, changelog, progress, and task records.

## Rationale

- Official `actions/checkout` and `actions/setup-node` guidance uses v6 for the Node.js 24 action runtime.
- GitHub-hosted `ubuntu-latest` runners satisfy the current runner requirement.
- `setup-node@v6` cache behavior does not change this repository because both workflows explicitly set `cache: npm`.

## Safety Boundary

- Workflow triggers, permissions, protected environments, secrets, deployment approvals, migration gates, and Cloudflare resource checks are unchanged.
- No redirect, Worker route, D1/KV, migration, Admin UI, or production resource behavior is changed.

## Verification

- Deployment policy and Demo parity tests: 53 passed.
- Worker tests: 81 passed; TypeScript type-check passed.
- Admin tests: 47 unit and 18 Chromium browser tests passed; production build passed.
- Project-site tests: 4 passed; production build passed.
- Workflow inventory contains only `actions/checkout@v6` and `actions/setup-node@v6` for checkout and Node setup.
- Isolated Demo run `29604677229` executed both v6 actions without annotations or Node.js 20 deprecation warnings.
- The same run passed every deployment gate and verified Admin/Worker v0.26.2, 18 read APIs, canonical brand assets, and the Demo write rejection.
- Production run `29625316532` executed both v6 actions without annotations, found no pending migrations, and deployed Worker, Admin, and project site successfully.
- Production and Demo Worker/Admin endpoints all report v0.26.2; production preserves Queue and R2 bindings while the isolated Demo preserves Queue and its intentional read-only boundary.
- Live boundary checks returned production anonymous API `401`, Demo write `403`, and production missing slug `404`.

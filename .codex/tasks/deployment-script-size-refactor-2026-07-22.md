# Deployment Script Size Refactor - 2026-07-22

## Goal

Bring the deployment configuration scripts touched by the current release below the project JavaScript limit without changing their Cloudflare resource plan, CLI interface, or GitHub configuration behavior.

## Scope

- `scripts/deployment-bootstrap.mjs`
- `scripts/deployment-github-config.mjs`
- Supporting `scripts/lib/` modules for pure input handling, report formatting, and CLI presentation.

## Compatibility Contract

- Keep `deriveResourceNames`, `runBootstrap`, `expectedGitHubConfirmation`, and `runGitHubConfiguration` exports unchanged.
- Keep every existing option, confirmation phrase, dry-run result, apply mutation order, and fail-closed validation rule unchanged.
- Do not change Worker redirect logic, D1/KV data behavior, Cloudflare resources, GitHub secrets, or remote variables during the refactor.

## Status

- [x] Read the complete deployment scripts, tests, callers, release records, and source-size audit.
- [x] Extract the bootstrap report and CLI presentation layers.
- [x] Extract GitHub configuration input validation and CLI presentation layers.
- [x] Verify behavior, line limits, release metadata, and the remaining debt inventory.
- [x] Prepare the v0.29.9 commit and release approval sequence.
- [ ] Push `main` and monitor the production and Demo workflows.

## Verification

- Deployment suite: 84 passed.
- Worker suite: 110 passed; Worker type-check passed.
- Admin suite: 64 unit and 25 browser tests passed; production-build browser test passed.
- Project site suite: 8 passed; Demo API suite: 6 passed.
- Admin and project-site production builds passed.
- `scripts/deployment-bootstrap.mjs` is 238 effective lines and `scripts/deployment-github-config.mjs` is 259; all four extracted modules are 83 lines or fewer.
- Full source-size scan: 32 remaining over-limit files, down from 34, with no new over-limit module.

## Deferred Inventory

The original source-size audit reported 34 over-limit files. This task addresses the two modified deployment configuration scripts first; the remaining unrelated application, preflight, seed, and test files stay in separate bounded batches to avoid regressions.

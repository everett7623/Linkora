# Support And Compatibility Policy

Date: 2026-07-21
Target version: 0.28.3
Status: Completed

## Goal

Publish one tested pre-1.0 contract for security reports, supported tooling, compatibility changes, backup ownership, upgrades, rollback, and best-effort community support.

## Planned

- [x] Add GitHub-native private vulnerability reporting guidance.
- [x] Verify the live repository setting read-only and track its disabled state as an external pre-1.0 gate.
- [x] Define the supported release line and pre-1.0 semantic-versioning rules.
- [x] Define Node, npm, Wrangler, browser, and workflow support boundaries.
- [x] Define backup expectations, post-upgrade checks, and the minimum rollback procedure.
- [x] Add an automated documentation contract test.
- [x] Link the policy from public documentation and complete the release regression.

## Verification

- [x] 75 deployment, 98 Worker, 58 Admin unit, 25 Admin browser, 6 Demo API, and 4 project-site tests pass.
- [x] Worker type-check and Admin/Site production builds pass.
- [x] Official npm registry audit reports zero known vulnerabilities.
- [x] GitHub live setting was checked read-only; activation remains external and is tracked in `TASKS.md`.

## Boundaries

- No runtime route or redirect changes.
- No database schema or migration changes.
- No Cloudflare, GitHub secret, production, or Demo mutations.

# Beginner Deployment Bootstrap - 2026-07-16

## Status

Complete. Read-only deployment-track preflight, guided D1/KV provisioning, production workflow enforcement, and the isolated manual Demo workflow are implemented; the new isolated Demo account supplied the recorded fresh-account core rehearsal.

## Completed In This Slice

- [x] Added one `deploy:preflight` command for fresh self-hosting, existing upgrades, and the isolated official Demo.
- [x] Kept the command read-only by default and made Cloudflare inspection an explicit `--check-cloudflare` option.
- [x] Validated Worker, Pages, D1, KV, API URL, optional R2 pairing, and optional Queue configuration.
- [x] Masked account, D1, and KV identifiers and excluded Cloudflare/Admin token values from reports.
- [x] Required verified backup, migration review, target confirmation, and a concrete backup reference for upgrade preflight.
- [x] Rejected initialization, factory reset, Demo seeding, resource recreation, and domain replacement flags for upgrades.
- [x] Made Demo checks fail closed without protected production ID/name/domain lists and reject every overlap.
- [x] Separated manual Wrangler and GitHub Actions `LINKETRY_ADMIN_TOKEN` instructions.
- [x] Added policy tests and a CI test step.
- [x] Confirmed the current production upgrade target with 25 passing configuration/account/resource checks and zero writes.
- [x] Added a dry-run-first `deploy:bootstrap` command that derives unique Worker, Pages, D1, and KV names from one user prefix.
- [x] Required an exact confirmation phrase containing the selected account suffix and prefix before the first write.
- [x] Created only missing D1/KV resources, reread their IDs, and printed GitHub variable and Wrangler binding output.
- [x] Made interrupted/repeated runs reuse exact resources without deleting, replacing, migrating, or deploying anything.
- [x] Upgraded the project toolchain to Wrangler 4 and kept CLI execution shell-free on Windows and Linux.
- [x] Bound every production workflow run to one approved fresh-or-upgrade track, exact release, exact Git commit, and reviewed migration digest.
- [x] Enforced backup, migration-review, target-confirmation, destructive-operation, and Demo-rejection gates before every Cloudflare write step.
- [x] Added read-only remote D1 migration-status verification and workflow-ordering regression coverage.
- [x] Added a separate manually dispatched Demo workflow with Demo-only credentials, protected-account enforcement, release-bound approvals, and fail-closed production resource/domain isolation.

## Remaining

- [x] Build a separate Demo workflow with isolated credentials and no production workflow, DNS, site, backup, or data access path.
- [x] Rehearse the basic path on a fresh Cloudflare account and record live Worker/Admin, D1/KV, Queue, synthetic-link, API, and write-boundary smoke results.
- [x] Rehearse an existing-instance upgrade and record existing-link/data preservation results.

## Safety Notes

- Redirect code was not changed.
- D1 remains the source of truth; KV remains cache only.
- The reusable `deploy:bootstrap` CLI verification used dry-run mode only. The separate official Demo workflow performed the live fresh-account resource, migration, seed, and deployment rehearsal under its isolated safety gates.

## Verification

- `npm run test:deployment`: 35 passed.
- Current-account `deploy:bootstrap` dry-run: passed with a create plan and zero mutation attempts.
- Current production `--track upgrade --check-cloudflare`: 25 passed, 0 failed, 1 informational warning for local Wrangler OAuth authentication.
- Local production-target workflow gate: passed against the owner account, exact 0.14.1 release state, reviewed migrations, current D1 restore bookmark, and existing bindings before deploy.
- Wrangler 4.111.0 Worker deploy dry-run: passed with the expected D1/KV/R2/Queue bindings and Linketry 0.14.1.
- Wrangler 4 D1 migration review through the stable `DB` binding: local inventory resolved and production reported no pending migrations.
- Production D1 point-in-time restore bookmark: available before release.
- Worker type-check and tests: 60 passed.
- Admin unit tests: 20 passed.
- Admin Chromium smoke tests: 7 passed.
- Admin production build: passed.
- Fresh-account evidence: isolated Demo account `a414...ddf35` reused no production IDs, names, credentials, or data.
- Initial complete isolated rollout: run `29536944045`; current v0.26.4 parity rollout: run `29636513938`.
- Current live smoke: Worker/Admin v0.26.4, D1/KV/Queue reads, 18 production-parity APIs, synthetic data, and read-only write rejection passed.
- R2 remains an optional external account prerequisite and does not block the basic deployment profile.

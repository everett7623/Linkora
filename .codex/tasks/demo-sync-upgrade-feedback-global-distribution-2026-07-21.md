# Demo Sync, Upgrade Feedback, And Global Distribution

Status: complete in the repository; isolated Demo synchronization runs after the `main` push.

## Goal

Keep the isolated public Demo synchronized with reviewed `main` commits, make self-hosted production upgrades respond and report completion faster, and improve the country distribution scan with a larger categorical palette.

## Scope

- [x] Add an automatic Demo synchronization trigger for pushes to `main` without sharing production credentials, resources, workflows, or DNS writes.
- [x] Add a `[skip production]` release marker so an official Demo sync does not enter the production deployment job.
- [x] Keep manual Demo deployment approvals while binding automatic runs to the pushed release, commit, and non-destructive migration inventory.
- [x] Poll GitHub workflow state every 2 seconds and deployed runtime state every 1 second without weakening deployment gates.
- [x] Persist upgrade progress immediately, keep the earliest scheduled reload, and show explicit success, warning, or failure feedback.
- [x] Confirm that each self-hosted instance upgrades only its configured repository and branch.
- [x] Expand the world traffic map to ten intensity colors, per-link countries to ten categorical colors, and seed ten synthetic Demo countries.
- [x] Complete full regression, browser visual checks, release metadata, and release readiness review.

## Safety Boundaries

- Redirect handlers, redirect response behavior, asynchronous analytics ingestion, D1/KV ownership, and migrations are unchanged.
- Automatic Demo synchronization accepts only `push` events for `refs/heads/main`; all other automatic refs fail before Cloudflare access.
- Demo Cloudflare credentials, resource prefixes, protected production inventories, read-only mode, synthetic data, and live parity checks remain mandatory.
- Production online upgrades dispatch only the deployment-time `LINKETRY_UPDATE_REPOSITORY`, `LINKETRY_UPDATE_BRANCH`, and fixed `deploy.yml` workflow.
- `[skip production]` applies only to push-triggered production jobs and cannot bypass Admin/manual release gates.

## Verification

- 79 deployment, 110 Worker, 64 Admin unit, 25 Admin browser, 6 Demo API, and 4 project-site tests pass after integrating the latest `main` readiness, Analytics, and Webhook work.
- Worker type-check and Admin/Site production builds pass.
- The 390px browser contract verifies all ten world-map intensity swatches are distinct, and the existing desktop/mobile map tests retain no-horizontal-overflow coverage.
- The official npm registry audit reports zero known vulnerabilities.
- Redirect handlers, analytics ingestion, D1/KV ownership, migrations, and production resources are unchanged.

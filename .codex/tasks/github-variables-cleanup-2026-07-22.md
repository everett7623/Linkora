# GitHub Variables Cleanup - 2026-07-22

## Goal

Reduce Linketry's GitHub Actions variable inventory without weakening production release approval, Cloudflare resource bindings, or Demo isolation checks.

## Audited State

- Repository variables: 35.
- `linketry-demo` environment variables: 20.
- Production variables that are redundant for the current `upgrade` deployment: 8.
- Demo variables that duplicate reviewed workflow defaults: 3.
- Existing source-size debt: 34 files exceed the project thresholds; this cleanup does not refactor unrelated application modules.

## Safe Cleanup Set

### Repository

- `LINKETRY_VERSION` - ignored by the workflow; package metadata is authoritative.
- `LINKETRY_SHORT_DOMAIN` - duplicated by `LINKETRY_WORKER_DOMAINS` for this installation.
- `LINKETRY_FRESH_INSTALL_CONFIRMED` - current deployment track is `upgrade`.
- `LINKETRY_ALLOW_INITIALIZATION` - missing means disabled.
- `LINKETRY_ALLOW_FACTORY_RESET` - missing means disabled.
- `LINKETRY_ALLOW_DEMO_SEED` - missing means disabled.
- `LINKETRY_ALLOW_RESOURCE_RECREATION` - missing means disabled.
- `LINKETRY_ALLOW_DOMAIN_REPLACEMENT` - missing means disabled.

### Demo Environment

- `LINKETRY_DEMO_API_PAGES_PROJECT` - equals the workflow default.
- `LINKETRY_DEMO_API_CUSTOM_DOMAIN` - equals the workflow default.
- `LINKETRY_DEMO_COMPATIBILITY_DATE` - equals the workflow default.

## Preserved Safety Inputs

- Production release, commit, migration, backup, and upgrade confirmations.
- D1, KV, R2, Queue, Worker, Pages, DNS, and site bindings.
- Production resource protection lists used by the isolated Demo workflow.
- Demo release approvals used by manual dispatch.

## Status

- [x] Inventory current repository and Demo environment variables.
- [x] Trace every variable through workflows, gates, bootstrap scripts, and documentation.
- [x] Stop bootstrap/configuration helpers from generating redundant variables.
- [x] Update deployment tests and documentation.
- [x] Synchronize v0.29.9 release metadata.
- [x] Run affected and full regression checks.
- [x] Delete the reviewed remote variables and verify the resulting inventories.

## Verification

- Targeted configuration and guide contract tests: 17 passed.
- Deployment suite: 84 passed; Worker suite: 110 passed; Admin unit suite: 64 passed; project site suite: 8 passed; Demo API suite: 6 passed.
- Worker type-check and Admin/project-site production builds passed.
- Serial Admin browser smoke: 25 passed.
- Repository variables: 35 to 27. Demo environment variables: 20 to 17.
- The retained repository approval, backup, migration, target, resource-protection, Worker-domain, D1, and KV values were verified after deletion. The retained Demo Admin/API, D1/KV, Worker, Pages, Queue, credential-scope, routing, isolation, and synthetic-data values were also verified.

## Rollback

The exact pre-cleanup values were read before mutation. Any removed GitHub variable can be restored with `gh variable set`; no secret, Cloudflare resource, deployment, migration, DNS record, or production data is changed by this task.

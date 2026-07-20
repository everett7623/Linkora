# Linketry Development Guide

This guide explains how to make safe, maintainable changes to Linketry. Read docs/ARCHITECTURE.md first for runtime behavior and failure boundaries.

## Read Before Changing Code

Use these sources in order:

1. AGENTS.md for repository safety rules and code placement.
2. docs/ARCHITECTURE.md for current runtime behavior.
3. PROGRESS.md for implemented and production-verified scope.
4. TASKS.md for active and deferred work.
5. docs/ROADMAP.md for product boundaries.
6. docs/API.md and /api/v1/openapi.json for API contracts.
7. The relevant source and tests.

Historical plans explain product intent but do not override current code, versioned APIs, migrations, or deployment documentation.

Security reports follow `SECURITY.md`; compatibility, supported tooling, backups, and rollback follow `SUPPORT.md`. A normal feature change must not weaken either contract silently.

## Prerequisites

- Node.js 24.x
- npm 10 or newer
- A Cloudflare account for remote D1/KV/R2/Queue work
- Wrangler from the repository dependencies

## Local Setup

```bash
npm install
cp apps/worker/wrangler.toml.example apps/worker/wrangler.toml
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
npm run db:migrate:local --workspace=apps/worker
```

Set a local LINKETRY_ADMIN_TOKEN in apps/worker/.dev.vars. Never commit the file or a real token.

Start the services in separate terminals:

```bash
npm run dev:worker
npm run dev:admin
```

- Worker: http://localhost:8787
- Admin: http://localhost:5173

## Where Changes Belong

| Change                    | Location                                                      |
| ------------------------- | ------------------------------------------------------------- |
| Public redirect behavior  | apps/worker/src/routes/redirect.ts and focused redirect tests |
| Admin API route           | apps/worker/src/routes/<resource>.ts                          |
| D1 query                  | apps/worker/src/db                                            |
| KV operation              | apps/worker/src/cache                                         |
| Authentication policy     | apps/worker/src/auth                                          |
| Analytics ingestion/query | apps/worker/src/analytics and apps/worker/src/db/analytics.ts |
| Import adapter            | apps/worker/src/importers                                     |
| Shared type or validator  | packages/shared/src                                           |
| Admin API client          | apps/admin/src/api                                            |
| Admin route-level screen  | apps/admin/src/pages                                          |
| Reusable Admin UI         | apps/admin/src/components or apps/admin/src/components/ui     |
| Admin route               | apps/admin/src/App.tsx                                        |
| Locale messages           | apps/admin/src/i18n                                           |
| D1 schema change          | migrations, only with explicit approval                       |
| Public project site       | apps/site                                                     |

Do not fetch directly from Admin pages when an API client module is appropriate. Do not inline SQL in routes.

## Development Workflow

1. Read the existing implementation, tests, and maintained docs.
2. Record multi-step work in .codex/tasks/<name>-<date>.md.
3. Make the smallest change that satisfies the current version scope.
4. Preserve existing response contracts and redirect semantics unless the task explicitly changes them.
5. Add or update focused tests.
6. Run the smallest meaningful verification matrix.
7. Update release metadata and maintained status documents in the same change set.
8. Review the final diff for secrets, production identifiers, unrelated edits, and stale documentation.

## Redirect Changes

Redirect code is the highest-risk area.

Before changing it:

- state the intended behavior and failure fallback;
- preserve D1 as the source of truth;
- keep analytics in Queue or ctx.waitUntil;
- keep external HTTP checks, Webhooks, notifications, and backups off the request path;
- verify disabled, expired, archived, password, warning, max-click, and missing-link behavior;
- verify KV stale-entry and D1-unavailable behavior;
- verify smart-rule failure still falls back to long_url.

Do not introduce automatic fallback_url switching without a separate reviewed design.

## API Changes

All new integrations target /api/v1.

When adding or changing an endpoint:

1. Use the existing authentication and scope helpers.
2. Preserve the standard success/data or success/error envelope.
3. Validate request fields at the boundary.
4. Keep pagination and filtering shapes consistent with docs/API.md.
5. Update the Admin API client and shared types together.
6. Update the OpenAPI inventory and route drift tests.
7. Update docs/API.md.

The legacy /api alias is compatibility-only and must not appear in new examples.

## Database Changes

D1 migrations require explicit instruction.

When approved:

- add a new incremental migration instead of rewriting an applied migration;
- avoid destructive SQL and data rewrites in deployment workflows;
- review the migration digest;
- test against a local migrated database;
- preserve existing production bindings and rows;
- update backup/restore behavior if the new data must survive recovery;
- update docs/ARCHITECTURE.md and relevant API documentation.

KV must not become a replacement database.

## Scale Regression

The Worker test suite includes a Node 24 in-memory SQLite profile that applies the maintained migrations and generates representative Links, Visits, Audit, and Health History data.

Run it alone while changing authenticated list or analytics reads:

```bash
node --experimental-strip-types --test apps/worker/src/db/listingScale.test.mjs
```

The test enforces deterministic pagination, bounded result shapes, and conservative response-time budgets. Treat local timings as regression gates, not remote D1 latency guarantees. Do not loosen a budget or reduce a dataset merely to hide a query regression.

## Import Changes

All adapters implement the shared ImportAdapter contract.

An adapter is ready only when:

- real, redacted source fixtures are available;
- detection cannot incorrectly claim unrelated generic files;
- source fields are normalized without inventing values;
- slug and URL validation is applied;
- preview reports valid, conflict, and invalid counts;
- skip remains the default;
- rename and overwrite behavior is explicit;
- large imports use the existing asynchronous job and bounded-write path;
- report and audit behavior is covered.

See docs/IMPORT_ADAPTERS.md.

## Admin Changes

- Keep Simple mode usable for basic link management.
- Put advanced operations behind Advanced mode without making the underlying recovery routes unreachable.
- Use the existing EN/ZH locale catalog; do not add hard-coded page copy.
- Preserve keyboard access, labels, focus behavior, contrast, and responsive layouts.
- Store only non-sensitive preferences in browser storage.
- Never put Admin tokens into GitHub update checks, public previews, external metadata requests, or logs.
- Reuse confirmed destructive-action patterns.

## Analytics and Monitoring Changes

- Raw analytics failures must not affect click counts or redirects.
- New target or attribution records should be separate from the core visit write.
- Store privacy-reduced identifiers; do not add raw visitor IP storage.
- Keep public statistics disabled by default.
- Scheduled anomaly detection should use bounded historical windows and configurable thresholds.
- Target health monitoring evaluates stored long_url values outside visitor requests.
- Notification credentials are write-only and excluded from backups.

## Verification Matrix

| Change area          | Minimum verification                                                     |
| -------------------- | ------------------------------------------------------------------------ |
| Documentation only   | Link/path checks, version consistency, git diff --check                  |
| Shared types         | Worker type-check, Admin build, affected tests                           |
| Worker route/API     | Worker type-check and focused Worker tests                               |
| Redirect/cache       | Full affected redirect/cache tests plus manual redirect states           |
| Admin component/page | Admin unit test, Playwright smoke where behavior is visible, Admin build |
| Import               | Adapter tests, preview/confirm smoke, conflict and batching coverage     |
| Analytics            | Analytics tests, API response checks, retention boundary                 |
| Migration/deployment | Deployment safety tests, migration digest, local migration               |
| Site                 | Site test and production build                                           |

Common commands:

```bash
npm run test:worker
npm run test:admin
npm run test:site
npm run test:deployment
npm run build:admin
npm run build:site
npm run type-check --workspace=apps/worker
node scripts/deployment-github-config.mjs --help
git diff --check
```

Do not disable type checking, skip tests globally, or weaken deployment gates to make a change pass.

## Deployment Tracks

Linketry has three explicit tracks:

| Track   | Use                                                               |
| ------- | ----------------------------------------------------------------- |
| fresh   | A new self-hosted account with new D1 and KV resources            |
| upgrade | An existing instance with verified backup and reviewed migrations |
| demo    | An isolated official Demo account and resource inventory          |

Run the read-only preflight before deployment:

```bash
npm run deploy:preflight -- --track <fresh|upgrade|demo> --check-cloudflare
```

Fresh provisioning starts with `deploy:bootstrap` dry-run and continues with `deploy:configure` dry-run/apply once the exact fork commit is on `main`. Production and Demo workflows must pass their safety gate before any Cloudflare write. The manual-only **Sync Online Upgrade Secret** workflow changes only the protected Worker's update capability; it never deploys code or runs migrations.

## Release Hygiene

Every intentional repository change uses a semantic version update and keeps these files synchronized:

- root and workspace package.json versions;
- package-lock.json workspace versions;
- packages/shared/src/version.ts;
- literal versions in environment examples, Wrangler examples, deployment docs, and CI fallbacks;
- CHANGELOG.md;
- PROGRESS.md;
- TASKS.md;
- the active .codex/tasks record.

Use a patch release for documentation and maintenance changes unless the user-visible or compatibility impact requires a larger increment.

## Documentation Ownership

| Document                     | Authority                                       |
| ---------------------------- | ----------------------------------------------- |
| README.md                    | Product introduction and quick entry points     |
| docs/ARCHITECTURE.md         | Current runtime design and failure boundaries   |
| docs/DEVELOPMENT.md          | Contributor workflow and verification           |
| docs/API.md                  | Human-readable API contract                     |
| /api/v1/openapi.json         | Machine-readable API contract                   |
| docs/SELF_HOSTING.md         | First-time self-hosting                         |
| docs/DEPLOYMENT.md           | Deployment targets and CI                       |
| docs/DEPLOYMENT_PREFLIGHT.md | Track-specific safety gates                     |
| docs/ANALYTICS.md            | Tracking, privacy, reports, and future analysis |
| docs/IMPORT_ADAPTERS.md      | Import adapter contract and candidates          |
| docs/BACKUP_AND_RESTORE.md   | Export, R2 recovery, and reset                  |
| docs/ROADMAP.md              | Product scope and future direction              |
| PROGRESS.md                  | Verified implementation state                   |
| TASKS.md                     | Active, next, and deferred work                 |

When documentation disagrees with behavior, verify the code and tests, correct the narrow authoritative document, and then update summary documents.

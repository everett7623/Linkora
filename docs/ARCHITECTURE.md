# Linketry Architecture

This document describes the current runtime architecture. It is derived from the deployed Worker, Admin route tree, D1 migrations, and maintained operational documents. Historical plans are useful for product intent, but they do not override this document or the code.

## Design Priorities

1. Redirect stability comes before analytics, automation, and presentation.
2. D1 is the source of truth. KV is a disposable acceleration layer.
3. Statistics, Webhooks, notifications, backups, and monitoring must not block redirects.
4. Import conflicts default to skip and must never silently overwrite an existing slug.
5. High-risk operations use preview, explicit confirmation, and a backup or change record where practical.
6. Advanced Cloudflare services remain optional so the D1/KV core can run independently.
7. Smart redirect failures fall back to the stored long_url.

## Runtime Topology

| Component         | Responsibility                                                        | Required    |
| ----------------- | --------------------------------------------------------------------- | ----------- |
| Cloudflare Worker | Public redirects, Admin API, Queue consumer, and Cron handler         | Yes         |
| Cloudflare D1     | Links, analytics, configuration, audit records, and operational state | Yes         |
| Cloudflare KV     | Short-link cache keyed by domain and slug                             | Yes         |
| Admin Pages app   | React operator interface                                              | Recommended |
| Cloudflare R2     | Scheduled and operator-created backup snapshots                       | No          |
| Cloudflare Queue  | Asynchronous visit ingestion                                          | No          |
| Rate Limiting     | Native per-client API abuse control for the official public Demo      | Demo only   |
| Daily Cron        | Backups, retention cleanup, reports, and aggregate traffic alerts     | No          |
| Health Cron       | Rotating target checks and alerts                                     | No          |
| Project site      | Public Linketry product and documentation site                        | No          |

The Worker and Admin are separate deployments. The Admin is a static client and must be configured with the Worker API origin. One Worker hostname can serve both short links and /api/v1, while additional short-link domains can point to the same Worker.

## Public Request Boundary

| Request           | Behavior                                                              |
| ----------------- | --------------------------------------------------------------------- |
| GET /health       | Returns the public health/version envelope with credential-free CORS  |
| GET /:slug        | Resolves and redirects a public short link                            |
| POST /:slug       | Continues a password-protected link after form submission             |
| GET /stats/:token | Renders an explicitly enabled, privacy-limited public statistics page |
| /api/v1/*         | Requires the Admin/scoped token; the isolated read-only Demo permits safe methods only |

Reserved paths such as api, health, admin, login, settings, assets, and static are never treated as slugs.

## Redirect Path

The implemented redirect flow is:

1. Normalize the request hostname and read the slug.
2. Read KV key linketry:slug:<domain>:<slug>.
3. On a KV miss, query D1 by domain and slug, with a compatibility fallback for older domainless records.
4. On a KV hit, re-check D1 so disable, delete, edit, expiry, and click-limit changes remain authoritative during KV propagation delay.
5. If D1 is temporarily unavailable after a cache hit, use KV only when the cached record is active, unexpired, and does not require max-click enforcement.
6. Reject archived, disabled, expired, expires_at, and max_clicks states before redirecting.
7. Evaluate the password and warning-page gates. Password-protected links are not written to KV.
8. Load redirect rules by priority and evaluate country, device, browser, referer, language, or weighted targets.
9. Fall back to long_url if rule loading or evaluation fails.
10. Forward request query parameters to the destination while excluding Linketry internal control parameters.
11. Return the stored 301 or 302 response.
12. Record the visit asynchronously through Queue or ctx.waitUntil.

The current fallback_url field is available to Admin and monitoring workflows. It is not an automatic redirect failover target.

## Cache Policy

- D1 remains authoritative on both cache misses and normal cache hits.
- Cache keys use linketry:slug:<domain>:<slug>.
- Cache entries expire after 24 hours.
- Active, non-password links can populate KV after a successful D1 read.
- Create and update operations refresh affected entries after D1 succeeds.
- Disable, delete, archive, domain migration, and relevant bulk operations clear affected entries.
- KV read, write, and delete errors are isolated from primary behavior.
- Factory reset clears the Linketry short-link prefix.

## API Architecture

The canonical Admin and integration namespace is /api/v1. The unversioned /api alias is deprecated compatibility code and must not be used by new clients.

Authentication supports:

- LINKETRY_ADMIN_TOKEN for operator recovery and Admin login;
- hashed API tokens with read, write, or admin scopes;
- standard success/data and success/error response envelopes.

Route modules live under apps/worker/src/routes. The route registry mounts auth, links, tags, settings, domains, imports, exports, analytics, reports, conversions, backups, tokens, Webhooks, notifications, redirect rules, groups, health checks, maintenance, metadata, and system capabilities.

The authenticated OpenAPI document and Swagger UI are exposed through /api/v1/openapi.json and /api/v1/docs. Route drift tests require intentional OpenAPI updates when mounted endpoints change.

## Admin Architecture

The React Admin uses:

- src/api for Worker calls;
- src/pages for route-level screens;
- src/components and src/components/ui for reusable UI;
- AuthContext for authentication and API-origin recovery;
- locale catalogs for English and Simplified Chinese;
- browser storage helpers for non-sensitive display preferences;
- Simple and Advanced modes to control presentation, not server capability.

Authenticated Admin startup performs a cached GitHub version check. It reads the deployment repository package version without sending the Admin token and shows a dismissible update notice only when a newer semantic version is available. A failed version check does not block Admin startup.

Optional in-app upgrades use an Admin-authenticated Worker endpoint. The Worker holds a fine-grained GitHub token as a secret and can dispatch only the deployment-time repository's `deploy.yml` on its fixed branch. GitHub Actions remains the asynchronous source of truth and retains every production gate. The Admin polls the sanitized run status, then reads the public cross-origin `/health` version before reloading. A runtime-verification failure is reported separately from workflow failure or timeout, and the bounded finalizing reload remains a recovery path. There is no local binary replacement or process restart in the Workers and Pages runtime.

## Asynchronous Work

| Work                      | Execution                                            | Failure behavior                                          |
| ------------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| Visit storage             | Queue when configured; direct ctx.waitUntil fallback | Redirect continues                                        |
| Demo visit storage        | Skipped in explicit public read-only Demo mode         | Redirect continues; synthetic analytics remain unchanged |
| Daily aggregation         | Part of asynchronous analytics storage               | Redirect continues                                        |
| Redirect target analytics | Separate visit_targets write                         | Core visit and redirect continue                          |
| Webhook delivery          | Background task                                      | Primary mutation continues                                |
| Notification delivery     | Scheduled monitoring task                            | Monitoring state remains available                        |
| R2 backup                 | Manual or daily Cron                                 | Failure is recorded and can emit a Webhook                |
| Analytics cleanup         | Daily Cron                                           | Backup and redirects continue                             |
| Backup retention          | Daily Cron                                           | Records are preserved when R2 deletion cannot be verified |
| Target monitoring         | Separate Health Cron                                 | Never performs a synchronous check on a visitor request   |

## Data Model

| Table             | Ownership                                                |
| ----------------- | -------------------------------------------------------- |
| links             | Primary short-link records and redirect controls         |
| visits            | Raw, privacy-reduced visit records                       |
| daily_stats       | Daily click aggregation                                  |
| tags              | Managed tag catalog                                      |
| domains           | Short-domain catalog                                     |
| import_jobs       | Asynchronous import progress and reports                 |
| api_tokens        | Token hashes, scopes, usage, and revocation              |
| settings          | Instance configuration and lightweight operational state |
| audit_logs        | Administrative audit events                              |
| backups           | R2 backup metadata                                       |
| redirect_rules    | Smart redirect configuration                             |
| visit_targets     | Resolved smart/A-B destination attribution               |
| conversion_events | Authenticated goal and value events                      |

Schema sources are migrations/0001_init.sql and migrations/0002_analytics_depth.sql. Production changes must use reviewed incremental migrations and must not recreate existing resources or re-run initialization SQL.

## Failure Isolation

| Failure                                 | Required outcome                         |
| --------------------------------------- | ---------------------------------------- |
| KV unavailable                          | Query D1                                 |
| D1 unavailable with no safe cache       | Return a safe non-redirect response      |
| D1 unavailable with a safe active cache | Preserve the cached redirect             |
| Redirect rules unavailable              | Use long_url                             |
| Queue unavailable                       | Record through ctx.waitUntil             |
| Analytics unavailable                   | Return the redirect                      |
| Webhook or notification unavailable     | Keep the initiating operation successful |
| R2 unavailable                          | Keep core D1/KV operation available      |
| GitHub update check unavailable         | Keep Admin available                     |

## Extension Boundaries

### Import adapters

New adapters normalize real source exports into the shared ImportAdapter contract. They require representative fixtures, preview and conflict coverage, and must not guess field mappings from platform names alone.

### Analytics

New dimensions should be recorded outside the redirect decision whenever possible. Traffic anomaly detection uses a bounded daily aggregate query over the latest 24 hours and previous 7-day baseline; thresholds, state, and notification delivery stay in scheduled or authenticated post-processing workflows, never in the redirect response path.

### Automatic fallback

Any future automatic use of fallback_url must be opt-in, use previously recorded health state, define stale-state behavior, and preserve long_url as the final safe default. A visitor request must never wait for a live target probe.

### Collaboration

Multi-user accounts, roles, teams, and per-project access controls remain optional V10 work. The current security model is a single operator plus scoped API tokens.

## Primary Source Files

| Area                       | Source                             |
| -------------------------- | ---------------------------------- |
| Worker entry and schedules | apps/worker/src/index.ts           |
| Redirect behavior          | apps/worker/src/routes/redirect.ts |
| KV policy                  | apps/worker/src/cache/index.ts     |
| Route registry             | apps/worker/src/routes/api.ts      |
| Authentication             | apps/worker/src/auth               |
| D1 access                  | apps/worker/src/db                 |
| Smart redirects            | apps/worker/src/redirectRules      |
| Analytics ingestion        | apps/worker/src/analytics          |
| Admin route tree           | apps/admin/src/App.tsx             |
| Shared contracts           | packages/shared/src                |
| Database schema            | migrations                         |

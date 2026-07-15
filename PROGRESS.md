# PROGRESS.md — Build Status

Quick reference for what is done, what is in progress, and what is not started.

Last updated: 2026-07-16

---

## Overall Status

| Layer                      | Status                 | Notes                                                                                                                                  |
| -------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Worker backend             | ✅ Code complete       | Local type-check passing; deployed on Cloudflare Workers                                                                               |
| Admin frontend             | 🟡 i18n in progress    | Default-English EN/ZH covers Admin workflows and public status pages; EN/ZH browser smoke covers core Admin navigation; Admin dates/counts/status labels now follow the selected locale |
| Database schema            | ✅ Complete            | V6 analytics migration applied in production through GitHub Actions                                                                    |
| Documentation              | ✅ Complete            | README, self-hosting guide, analytics guide, backup/reset guide, root runbooks, `docs/` reference set, and V7-V10 long-term roadmap    |
| Deployment                 | ✅ Deployed            | Worker and Admin deployed; GitHub Actions deploy workflow added                                                                        |
| End-to-end test            | ✅ V1-V6 slices passed | Full V1-V3 regression passed; V4 and V6 production smoke passed; final V4 core regression passed                                       |
| Known issues               | ✅ Tracked             | Partial large-import write cutoff fixed in v0.9.16; remaining operational limitations are documented in `docs/KNOWN_ISSUES.md` |
| Current version            | 🟡 0.14.0              | Production deploys now fail closed on unapproved release, commit, migration, track, or upgrade-safety state |
| Shlink migration readiness | ✅ Complete            | Shlink imports preserve original short domains from `shortUrl`; stored links can then be migrated from a legacy domain such as `s.y8o.de` to a new domain |
| Shlink feature gap audit   | ✅ Complete            | Gap analysis documented in `docs/SHLINK_FEATURE_GAP.md`; highest-value missing capabilities identified as query-param forwarding, title auto-resolution, and multi-segment/strict-mode redirect options |

---

## Linketry 0.11 Identity Cutover

| Area | Status | Notes |
|---|---|---|
| Product identity | ✅ Complete | Linketry; author `everettlabs`; website `linketry.com`; repository `everett7623/Linketry`; image `everett7623/linketry` |
| API namespace | ✅ Complete | `/api/v1` is canonical; compatibility aliases remain limited to the API deprecation policy |
| Existing data | ✅ Preserved | All 14 production D1 tables retained exact row counts; all 10 R2 backup objects copied and verified |
| Configuration | ✅ Complete | Worker and GitHub Actions use only canonical `LINKETRY_*` configuration and secret names |
| Admin session | ✅ Complete | Admin uses only canonical Linketry browser-storage keys |
| Cache and backup | ✅ Complete | D1 remains the source of truth; canonical cache keys and backup markers are enforced |
| Cloudflare | ✅ Complete | Worker, Pages, D1, KV, R2, and Queue use canonical Linketry resource names |
| Deployment tracks | 🟡 Rehearsal in progress | Guided D1/KV provisioning, redacted preflight checks, and production workflow enforcement are complete; fresh-account rehearsal remains |

---

## V1 Feature Checklist

### Core

| Feature                         | Code | Tested |
| ------------------------------- | ---- | ------ |
| `GET /health`                   | ✅   | ✅     |
| `GET /:slug` redirect           | ✅   | ✅     |
| KV cache (read / write / clear) | ✅   | ✅     |
| D1 fallback on KV miss          | ✅   | ✅     |
| 404 HTML page                   | ✅   | ✅     |
| Disabled link HTML page         | ✅   | ✅     |
| Async visit recording           | ✅   | ✅     |

### Admin API

| Endpoint                         | Code | Tested |
| -------------------------------- | ---- | ------ |
| `POST /api/v1/auth/login`           | ✅   | ✅     |
| `GET  /api/v1/auth/me`              | ✅   | ✅     |
| `GET    /api/v1/links`              | ✅   | ✅     |
| `POST   /api/v1/links`              | ✅   | ✅     |
| `GET    /api/v1/links/:id`          | ✅   | ✅     |
| `PUT    /api/v1/links/:id`          | ✅   | ✅     |
| `DELETE /api/v1/links/:id`          | ✅   | ✅     |
| `POST   /api/v1/links/:id/disable`  | ✅   | ✅     |
| `POST   /api/v1/links/:id/enable`   | ✅   | ✅     |
| `POST   /api/v1/links/:id/archive`  | ✅   | ✅     |
| `POST   /api/v1/links/:id/restore`  | ✅   | ✅     |
| `GET    /api/v1/tags`               | ✅   | ✅     |
| `POST   /api/v1/tags`               | ✅   | ✅     |
| `PUT    /api/v1/tags/:id`           | ✅   | ✅     |
| `DELETE /api/v1/tags/:id`           | ✅   | ✅     |
| `GET    /api/v1/settings`           | ✅   | ✅     |
| `PUT    /api/v1/settings`           | ✅   | ✅     |
| `GET    /api/v1/export/links.csv`   | ✅   | ✅     |
| `GET    /api/v1/export/links.json`  | ✅   | ✅     |
| `GET    /api/v1/export/backup.json` | ✅   | ✅     |
| `GET    /api/v1/export/visits.csv`  | ✅   | ✅     |
| Pre-import backup download       | ✅   | ⏳     |
| `POST   /api/v1/import/preview`     | ✅   | ✅     |
| `POST   /api/v1/import/confirm`     | ✅   | ✅     |
| `GET    /api/v1/import/jobs`        | ✅   | ✅     |

### Import Adapters

| Adapter      | Code | Tested |
| ------------ | ---- | ------ |
| Shlink JSON  | ✅   | ✅     |
| Shlink JSONL | ✅   | ⏳     |
| Shlink CSV   | ✅   | ⏳     |
| Generic CSV  | ✅   | ⏳     |
| Generic JSON | ✅   | ⏳     |

### Admin Frontend Pages

| Page            | Code | Tested |
| --------------- | ---- | ------ |
| Login           | ✅   | ✅     |
| Overview        | ✅   | ✅     |
| Links list      | ✅   | ✅     |
| Create Link     | ✅   | ✅     |
| Edit Link       | ✅   | ✅     |
| Import / Export | ✅   | ✅     |
| Settings        | ✅   | ✅     |
| Tags            | ✅   | ⏳     |

---

## Next Steps

1. Complete deployment Bootstrap with a fresh-account first-link rehearsal; guided provisioning, three-track preflight, and production workflow enforcement are complete
2. Launch an official Linketry-domain project site and an isolated, read-only or resettable Demo after the owner selects the domain
3. Add optional Cloudflare Access and asynchronous signed click webhooks, then complete Admin display preferences
4. Keep themes, card views, social preview customization, broader locales, real-time visuals, optional AI, and external clients behind the foundational work
5. Keep the separate supporter/coffee domain and Shlink retirement operations deferred until their external prerequisites are ready

---

## Known Issues

| Issue                                               | Status          | Notes                                                                                           |
| --------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| Browser plugin instability                          | ℹ️ Not blocking | API and production smoke checks completed; browser plugin not required for remaining cutover    |
| Admin API on `workers.dev` unavailable              | ℹ️ Not blocking | Admin should be built with the configured Worker/API origin                                     |
| Wrangler v3 update warning                          | ✅ Fixed        | Project toolchain upgraded to Wrangler 4.111.0 in v0.13.0                                      |
| KV stale active entry after admin changes           | ✅ Fixed        | Redirect handler now re-checks D1 on KV hits and preserves active KV only if D1 is unavailable  |
| API Origin override cleared after transient failure | ✅ Fixed        | Admin only persists fallback to the build-time API after that origin authenticates successfully |
| Large Shlink import confirm timeout                 | ✅ Fixed        | v0.9.13 returns a pending job before background parsing and reports failed jobs correctly         |
| Large import stops after about 73 links             | ✅ Fixed        | v0.9.16 batches D1 writes; actual 195-row CSV passed first-import and duplicate-import checks     |
| Admin remains in importing state after completion   | ✅ Fixed        | v0.9.17 uses immediate non-cached polling and clears completed import state                       |

## Migration Status

| Source                           | Status      | Notes                                                             |
| -------------------------------- | ----------- | ----------------------------------------------------------------- |
| Shlink API                       | ✅ Imported | 195 links imported into production Linketry, 0 failed, 0 skipped   |
| Duplicate import safety          | ✅ Verified | Re-preview after import reports 195 conflicts and 0 valid imports |
| Imported redirect spot-check     | ✅ Verified | Sample slugs return 302 from production Worker                    |
| Legacy short-domain cutover plan | ✅ Prepared | See `CUTOVER.md`; cutover not executed yet                        |

---

## Version Status

| Version | Status          |
| ------- | --------------- |
| V2      | ✅ Done         |
| V3      | ✅ Done         |
| V4      | ✅ Done         |
| V5      | ✅ Done         |
| V6      | ✅ Done         |
| V7      | In Progress     |
| V8      | ✅ Done         |
| V9      | In Progress     |
| V10     | Future optional |

Database columns for V2–V4 are already present in `migrations/0001_init.sql` to avoid future migration complexity.

### V2 Progress

| Feature                            | Status  | Notes                                                                                                          |
| ---------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| QR code generation                 | ✅ Done | Links table action opens QR preview and downloads PNG                                                          |
| Bulk actions                       | ✅ Done | Links table supports multi-select disable, enable, archive, restore, and delete                                |
| Bulk tag assignment                | ✅ Done | Links table supports multi-select add, replace, remove, and clear tag modes                                    |
| Expiry / max clicks                | ✅ Done | Create/Edit forms support `expires_at` and `max_clicks`; redirects return expired page when limits are reached |
| Auto-fetch page title              | ✅ Done | Create/Edit forms can fetch the target page title through an authenticated Worker metadata endpoint            |
| Visits CSV export                  | ✅ Done | `/api/v1/export/visits.csv` and Admin download button added; local API smoke test passed                          |
| Tags management page               | ✅ Done | Admin page supports tag create, edit, search, color, description, and delete                                   |
| Link tag catalog sync              | ✅ Done | Link tags auto-create catalog entries; local rename/delete sync smoke test passed                              |
| Link form tag picker               | ✅ Done | Create/Edit forms load Tags catalog and offer clickable tag chips                                              |
| Password-protected links           | ✅ Done | Create/Edit forms set password hashes; redirect requires password and does not cache protected links           |
| Safety warning page                | ✅ Done | Links can show a confirmation page before redirecting                                                          |
| UTM templates                      | ✅ Done | Create/Edit forms include newsletter, social, ads, affiliate, and custom UTM builder                           |
| Audit logs page                    | ✅ Done | Admin page lists link and import audit events                                                                  |
| Shlink API pull import             | ✅ Done | Admin Import / Export can fetch Shlink links via URL + API key without storing the key                         |
| Sink importer adapter              | ✅ Done | JSON / JSONL-style payloads supported; local smoke test passed                                                 |
| YOURLS importer adapter            | ✅ Done | JSON / JSONL-style payloads supported; local smoke test passed                                                 |
| Dub importer adapter               | ✅ Done | JSON / JSONL-style payloads supported; local smoke test passed                                                 |
| Import conflict strategies         | ✅ Done | `skip`, `rename`, and `overwrite` implemented; local smoke test passed                                         |
| Linketry backup.json restore import | ✅ Done | Restores backup links and tag catalog entries; local smoke test passed                                         |
| Bulk create links                  | ✅ Done | Admin page and `POST /api/v1/links/bulk-create` create up to 100 links at a time                                  |
| Links advanced filters             | ✅ Done | Links list filters by source, domain, password, warning, limits, and created date range                        |
| Generic CSV field mapping          | ✅ Done | Generic CSV import accepts explicit field mapping for non-standard headers                                     |
| Generic JSON / JSONL field mapping | ✅ Done | Generic JSON import accepts mapped fields and common wrapped arrays                                            |
| V2 production regression           | ✅ Done | 49 production checks passed; temporary `lk-v2-reg-*` links cleaned up                                          |

### V3 Progress

| Feature                           | Status  | Notes                                                                                                                                                                                    |
| --------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Advanced analytics dashboard      | ✅ Done | Admin Analytics page shows click totals, approximate unique visitors, daily trend, top links, countries, referrers, browsers, devices, operating systems, bot metrics, and recent visits |
| Daily stats aggregation           | ✅ Done | Visit recording updates `daily_stats` asynchronously via `ctx.waitUntil()` alongside raw visits                                                                                          |
| Auto-backup to Cloudflare R2      | ✅ Done | Worker creates full backup snapshots in R2 through Admin and scheduled cron                                                                                                              |
| Cron Triggers for daily backup    | ✅ Done | Wrangler cron runs daily at 18:00 UTC / 02:00 Asia/Shanghai                                                                                                                              |
| API Token management page         | ✅ Done | Admin can create/revoke scoped tokens; Worker stores hashes and authorizes API requests by scope                                                                                         |
| Cloudflare Queues for async stats | ✅ Done | Redirects enqueue visit snapshots when `VISITS_QUEUE` exists; max-click links and queue failures fall back to direct `ctx.waitUntil()` recording                                         |
| Multi-domain support              | ✅ Done | Admin can manage short domains; links store a selected domain; redirects resolve by request host plus slug with legacy domainless fallback                                               |
| Webhook notifications             | ✅ Done | Admin configures signed webhook deliveries for link, import, and backup events; delivery runs asynchronously and never blocks primary flows                                              |

### V4 Progress

| Feature                      | Status  | Notes                                                                                                                                                                                                                                                                               |
| ---------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Smart redirect evaluator     | ✅ Done | Redirects can resolve country, device, browser, referer, language, and weighted/A-B rules with default long URL fallback on any rule failure                                                                                                                                        |
| Redirect Rules API           | ✅ Done | `/api/v1/redirect-rules` supports list, create, update, and delete with auth and audit logs                                                                                                                                                                                            |
| Admin Redirect Rules page    | ✅ Done | Admin can create, edit, filter, and delete rules by link                                                                                                                                                                                                                            |
| Backup / restore for rules   | ✅ Done | `backup.json` includes `redirectRules`; Linketry backup restore reattaches rules to restored or overwritten links                                                                                                                                                                    |
| V4 production validation     | ✅ Done | 21-check production smoke plus backup restore smoke passed; temporary `lk-v4-*` links cleaned up                                                                                                                                                                                    |
| Campaign / project grouping  | ✅ Done | Admin Groups page and `/api/v1/groups` manage `campaign:*` / `project:*` tags; 15-check production smoke passed and temporary groups cleaned up                                                                                                                                        |
| Local smart link suggestions | ✅ Done | Authenticated `/api/v1/metadata/suggestions` suggests slugs, title, description, and tags from URL/page metadata; Create/Edit forms can apply suggestions; 8-check production smoke plus 10-check core regression passed and temporary `lk-v4-ai-*` / `lk-v4-final-*` links cleaned up |
| Link health checker          | ✅ Done | Manual URL, single-link, and capped active-link batch checks; 15-check production smoke passed and temporary `lk-v4-health-*` links cleaned up                                                                                                                                      |

### V6 Progress

| Feature                    | Status               | Notes                                                                                                                                                                                                 |
| -------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single-link analytics page | ✅ Done              | `/analytics/links/:id` shows per-link trend, referrers, devices, targets, UTM, and conversions                                                                                                        |
| Analytics filters          | ✅ Done              | API/Admin filters cover link, slug, domain, tag, campaign, project, country, device, browser, referer, and UTM values                                                                                 |
| UTM breakdown              | ✅ Done              | Summary includes top UTM sources, mediums, campaigns, terms, and contents                                                                                                                             |
| A/B target statistics      | ✅ Done              | Redirect target decisions are stored in `visit_targets` without changing redirect behavior                                                                                                            |
| Conversion events          | ✅ Done              | `POST /api/v1/conversions` records authenticated goal events                                                                                                                                             |
| Analytics report export    | ✅ Done              | `/api/v1/export/analytics.csv` exports summary report sections                                                                                                                                           |
| Raw analytics retention    | ✅ Done              | `analytics_retention_days` setting is enforced by scheduled Worker cleanup                                                                                                                            |
| V6 validation              | ✅ Production passed | GitHub Actions migration/deploy passed; production smoke covered health, auth rejection, redirects, filters, single-link analytics, conversions, Analytics CSV export, retention setting, and cleanup |

### V7 Progress

| Feature                      | Status  | Notes                                                                                                                                                                                 |
| ---------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R2 restore preview           | ✅ Done | `POST /api/v1/backups/:id/restore-preview` returns create, overwrite, rename, skip, invalid, and redirect-rule counts                                                                    |
| R2 one-click restore         | ✅ Done | Admin Backups page can restore completed R2 snapshots with `skip`, `rename`, or `overwrite`                                                                                           |
| Pre-restore backup           | ✅ Done | Restore creates a fresh `pre-restore` R2 snapshot before mutating D1                                                                                                                  |
| Restore report               | ✅ Done | Restore result includes created, overwritten, renamed, skipped, failed, redirect-rule counts, and a CSV-style report                                                                  |
| Factory reset                | ✅ Done | Admin Settings danger zone previews affected rows, requires `RESET LINKETRY`, creates optional `pre-reset` R2 backup, clears KV cache, and preserves backup records plus `LINKETRY_ADMIN_TOKEN` |
| Backup retention             | ✅ Done | Advanced Settings configures 1-3650 days (default 30); Cron deletes expired R2 objects before their D1 records and preserves records when R2 is unavailable                           |
| Target monitoring and alerts | ✅ Done | Cron rotates through active links with thresholds, suppression, complete failure/recovery notifications, signed Webhooks, persisted notices, and a bounded 200-record target history |
| Fallback URL editing         | ✅ Done | Create/Edit Link can set or clear a validated HTTP(S) fallback URL for monitoring and future workflows; public redirect behavior remains unchanged                                      |
| Operations dashboard         | ✅ Done | Advanced Admin combines backup freshness, monitoring settings, Queue/R2 deployment capabilities, and manually requested current target failures                                        |
| Bot classification           | ✅ Done | Boundary-aware classifier covers major crawlers and automation clients while preserving real browser traffic, including CUBOT Android devices                                           |
| Public status page templates | ✅ Done | Advanced Settings supports escaped plain-text messages for 404, disabled, expired, and warning pages with safe localized defaults                                                       |

### V7-V10 Planning

| Version                                           | Scope                                                                                                                                                                                  | Status          |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| V7 Operations, Recovery, And Monitoring           | R2 restore, backup retention, periodic target monitoring, alerts, fallback URL UI, custom status pages, operations dashboard, better bot classification                                | In progress     |
| V9 Growth Tools, Reporting, And Link Intelligence | Public stats sharing, reporting, campaign tools, previews, notes, attribution, and lifecycle automation                                                                              | In progress     |
| V8 Usability Modes And Internationalization       | Simple / Advanced mode, deployment capability reporting, first-run wizard, full-page EN/ZH localization, browser smoke coverage, and locale-aware formatting                          | Complete        |
| V9 Growth Tools, Reporting, And Link Intelligence | Bulk URL and UTM operations, link notes, OpenGraph previews, public stats pages, scheduled reports, saved analytics views, conversion attribution, long-idle auto-archive              | Planned         |
| V10 Collaboration And Governance                  | Multi-user, roles, teams, token governance, audit retention, per-project access, optional managed services                                                                             | Future optional |

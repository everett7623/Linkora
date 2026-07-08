# PROGRESS.md — Build Status

Quick reference for what is done, what is in progress, and what is not started.

Last updated: 2026-07-08

---

## Overall Status

| Layer           | Status         | Notes                                          |
|-----------------|----------------|------------------------------------------------|
| Worker backend  | ✅ Code complete | Local type-check passing; deployed on Cloudflare Workers |
| Admin frontend  | ✅ Code complete | Production build passing; deployed on `admin.y8o.de` |
| Database schema | ✅ Complete      | Local and production D1 migrations applied      |
| Documentation   | ✅ Complete      | README, root runbooks, and `docs/` reference set |
| Deployment      | ✅ Deployed      | Worker on `go.y8o.de`, Admin on `admin.y8o.de`; GitHub Actions deploy workflow added |
| End-to-end test | ✅ V1 passed | Production Worker, Admin auth, Links CRUD, Settings, Import/Export, and Shlink import passed |

---

## V1 Feature Checklist

### Core

| Feature                         | Code | Tested |
|---------------------------------|------|--------|
| `GET /health`                   | ✅    | ✅     |
| `GET /:slug` redirect           | ✅    | ✅     |
| KV cache (read / write / clear) | ✅    | ✅     |
| D1 fallback on KV miss          | ✅    | ✅     |
| 404 HTML page                   | ✅    | ✅     |
| Disabled link HTML page         | ✅    | ✅     |
| Async visit recording           | ✅    | ✅     |

### Admin API

| Endpoint                          | Code | Tested |
|-----------------------------------|------|--------|
| `POST /api/auth/login`            | ✅    | ✅     |
| `GET  /api/auth/me`               | ✅    | ✅     |
| `GET    /api/links`               | ✅    | ✅     |
| `POST   /api/links`               | ✅    | ✅     |
| `GET    /api/links/:id`           | ✅    | ✅     |
| `PUT    /api/links/:id`           | ✅    | ✅     |
| `DELETE /api/links/:id`           | ✅    | ✅     |
| `POST   /api/links/:id/disable`   | ✅    | ✅     |
| `POST   /api/links/:id/enable`    | ✅    | ✅     |
| `POST   /api/links/:id/archive`   | ✅    | ✅     |
| `POST   /api/links/:id/restore`   | ✅    | ✅     |
| `GET    /api/tags`                | ✅    | ✅     |
| `POST   /api/tags`                | ✅    | ✅     |
| `PUT    /api/tags/:id`            | ✅    | ✅     |
| `DELETE /api/tags/:id`            | ✅    | ✅     |
| `GET    /api/settings`            | ✅    | ✅     |
| `PUT    /api/settings`            | ✅    | ✅     |
| `GET    /api/export/links.csv`    | ✅    | ✅     |
| `GET    /api/export/links.json`   | ✅    | ✅     |
| `GET    /api/export/backup.json`  | ✅    | ✅     |
| `GET    /api/export/visits.csv`   | ✅    | ✅     |
| Pre-import backup download         | ✅    | ⏳     |
| `POST   /api/import/preview`      | ✅    | ✅     |
| `POST   /api/import/confirm`      | ✅    | ✅     |
| `GET    /api/import/jobs`         | ✅    | ✅     |

### Import Adapters

| Adapter                  | Code | Tested |
|--------------------------|------|--------|
| Shlink JSON              | ✅    | ✅     |
| Shlink JSONL             | ✅    | ⏳     |
| Shlink CSV               | ✅    | ⏳     |
| Generic CSV              | ✅    | ⏳     |
| Generic JSON             | ✅    | ⏳     |

### Admin Frontend Pages

| Page            | Code | Tested |
|-----------------|------|--------|
| Login           | ✅    | ✅     |
| Overview        | ✅    | ✅     |
| Links list      | ✅    | ✅     |
| Create Link     | ✅    | ✅     |
| Edit Link       | ✅    | ✅     |
| Import / Export | ✅    | ✅     |
| Settings        | ✅    | ✅     |
| Tags            | ✅    | ⏳     |

---

## Next Steps

1. Revoke or rotate the Shlink API key used during migration
2. Continue V3 with Cloudflare Queues for async stats or multi-domain support
3. Cut over `s.y8o.de` from Shlink to Linkora when ready

---

## Known Issues

| Issue                                | Status  | Notes                                            |
|--------------------------------------|---------|--------------------------------------------------|
| Browser plugin instability           | ℹ️ Not blocking | API and production smoke checks completed; browser plugin not required for remaining cutover |
| Admin API on `workers.dev` unavailable | ℹ️ Not blocking | Admin has been rebuilt to use `https://go.y8o.de` |
| Wrangler v3 update warning           | ℹ️ Not blocking | Local checks passed; consider upgrade separately |
| KV stale active entry after admin changes | ✅ Fixed | Redirect handler now re-checks D1 on KV hits and preserves active KV only if D1 is unavailable |

## Migration Status

| Source | Status | Notes |
|--------|--------|-------|
| Shlink API (`s.y8o.de`) | ✅ Imported | 195 links imported into production Linkora, 0 failed, 0 skipped |
| Duplicate import safety | ✅ Verified | Re-preview after import reports 195 conflicts and 0 valid imports |
| Imported redirect spot-check | ✅ Verified | Sample slugs return 302 from production Worker |
| `s.y8o.de` cutover plan | ✅ Prepared | See `CUTOVER_S_Y8O_DE.md`; cutover not executed yet |

---

## V2 / V3 / V4 Status

| Version | Status      |
|---------|-------------|
| V2      | ✅ Done |
| V3      | In progress |
| V4      | Not started |

Database columns for V2–V4 are already present in `migrations/0001_init.sql` to avoid future migration complexity. They are not used by V1 code.

### V2 Progress

| Feature | Status | Notes |
|---------|--------|-------|
| QR code generation | ✅ Done | Links table action opens QR preview and downloads PNG |
| Bulk actions | ✅ Done | Links table supports multi-select disable, enable, archive, restore, and delete |
| Bulk tag assignment | ✅ Done | Links table supports multi-select add, replace, remove, and clear tag modes |
| Expiry / max clicks | ✅ Done | Create/Edit forms support `expires_at` and `max_clicks`; redirects return expired page when limits are reached |
| Auto-fetch page title | ✅ Done | Create/Edit forms can fetch the target page title through an authenticated Worker metadata endpoint |
| Visits CSV export | ✅ Done | `/api/export/visits.csv` and Admin download button added; local API smoke test passed |
| Tags management page | ✅ Done | Admin page supports tag create, edit, search, color, description, and delete |
| Link tag catalog sync | ✅ Done | Link tags auto-create catalog entries; local rename/delete sync smoke test passed |
| Link form tag picker | ✅ Done | Create/Edit forms load Tags catalog and offer clickable tag chips |
| Password-protected links | ✅ Done | Create/Edit forms set password hashes; redirect requires password and does not cache protected links |
| Safety warning page | ✅ Done | Links can show a confirmation page before redirecting |
| UTM templates | ✅ Done | Create/Edit forms include newsletter, social, ads, affiliate, and custom UTM builder |
| Audit logs page | ✅ Done | Admin page lists link and import audit events |
| Shlink API pull import | ✅ Done | Admin Import / Export can fetch Shlink links via URL + API key without storing the key |
| Sink importer adapter | ✅ Done | JSON / JSONL-style payloads supported; local smoke test passed |
| YOURLS importer adapter | ✅ Done | JSON / JSONL-style payloads supported; local smoke test passed |
| Dub importer adapter | ✅ Done | JSON / JSONL-style payloads supported; local smoke test passed |
| Import conflict strategies | ✅ Done | `skip`, `rename`, and `overwrite` implemented; local smoke test passed |
| Linkora backup.json restore import | ✅ Done | Restores backup links and tag catalog entries; local smoke test passed |
| Bulk create links | ✅ Done | Admin page and `POST /api/links/bulk-create` create up to 100 links at a time |
| Links advanced filters | ✅ Done | Links list filters by source, domain, password, warning, limits, and created date range |
| Generic CSV field mapping | ✅ Done | Generic CSV import accepts explicit field mapping for non-standard headers |
| Generic JSON / JSONL field mapping | ✅ Done | Generic JSON import accepts mapped fields and common wrapped arrays |
| V2 production regression | ✅ Done | 49 production checks passed on `go.y8o.de`; temporary `lk-v2-reg-*` links cleaned up |

### V3 Progress

| Feature | Status | Notes |
|---------|--------|-------|
| Advanced analytics dashboard | ✅ Done | Admin Analytics page shows click totals, daily trend, top links, countries, referrers, browsers, devices, and recent visits |
| Daily stats aggregation | ✅ Done | Visit recording updates `daily_stats` asynchronously via `ctx.waitUntil()` alongside raw visits |
| Auto-backup to Cloudflare R2 | ✅ Done | Worker creates full backup snapshots in R2 through Admin and scheduled cron |
| Cron Triggers for daily backup | ✅ Done | Wrangler cron runs daily at 18:00 UTC / 02:00 Asia/Shanghai |
| API Token management page | ✅ Done | Admin can create/revoke scoped tokens; Worker stores hashes and authorizes API requests by scope |

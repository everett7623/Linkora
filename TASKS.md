# TASKS.md — Active Task List

Track active work items here. Move items between sections as they progress.
One item in "In Progress" at a time whenever possible.

---

## 🔴 In Progress

- [x] V8: Complete English / Simplified Chinese localization across basic and advanced pages

---

## 🟡 Next — Operations And UX Planning

- [x] V7: Add configurable backup retention, starting with a 30-day default
- [ ] V7: Add periodic target health monitoring and failure alerts
- [x] V7: Add opt-in Cron target monitoring with a configurable 1-50 link batch
- [x] V7: Send signed `health_check.failed` Webhook summaries for scheduled anomalies
- [x] V8: Add Simple / Advanced Admin mode toggle
- [x] V8: Add default-English language switcher and first i18n foundation for global/core Admin UI
- [x] V8: Add required first-run deployment wizard for API, one domain, and the first short link
- [x] V8: Localize Overview, Links basic workflow, Create Link basic workflow, and shared link statuses
- [x] V8: Complete first EN/ZH pass for Edit Link, Import/Export, and Tags
- [x] V8: Localize Import details, Links advanced filters/bulk actions, suggestions, and UTM builder
- [x] V8: Complete first EN/ZH operations pass for Domains, Groups, and Health Checks
- [x] V8: Localize Groups operations details, Health result headings, and Redirect Rules first pass
- [x] V8: Localize Redirect Rules editor, Health statuses, and API Tokens first pass
- [x] V8: Localize API Token dialogs and Backups first pass
- [x] V8: Localize complete restore-preview and overwrite safety workflow
- [x] V8: Localize Audit Logs and prepare Analytics observability messages
- [x] V8: Localize Analytics filters, metrics, charts, visits, exports, and per-link analysis
- [x] V8: Localize Bulk Create, Webhook controls, and complete reset safety workflow
- [x] V8: Audit Admin i18n coverage and add catalog parity/interpolation tests
- [x] V8: Localize public redirect/status templates with redirect regression coverage
- [x] V8: Localize Audit Logs action filters, pagination, Analytics UTM labels, and locale-aware chart formatting
- [x] V8: Add browser smoke tests for English and Simplified Chinese core workflows
- [x] V8: Normalize Admin dates, numbers, status labels, QR labels, placeholders, and API scope labels by selected locale
- [x] V8: Localize redirect rule types, health-check details, group confirmations, and import conflict previews
- [x] V8: Localize remaining long-tail page content, validation wording, and export/report details
- [ ] V9: Add public read-only stats pages with privacy controls
- [ ] V9: Improve bot classification and conversion attribution

---

## ✅ Completed — V7 R2 Backup Restore

- [x] Add one-click restore from completed R2 backup records in the Backups page
- [x] Add restore dry-run preview with conflict summary
- [x] Add `skip`, `rename`, and `overwrite` restore conflict strategies
- [x] Create a fresh `pre-restore` R2 snapshot before mutating data
- [x] Return restore summary and CSV-style restore report
- [x] Preserve restored link domains and refresh KV cache for restored links
- [x] Document the restore API and operator workflow

---

## ✅ Completed — V7 Instance Reset

- [x] Add reset preview for affected row counts and KV prefix
- [x] Add factory reset API with exact confirmation phrase
- [x] Add pre-reset R2 backup, enabled by default
- [x] Clear short-link KV cache during reset
- [x] Reset links, analytics, tags, domains, imports, API tokens, audit logs, redirect rules, and settings
- [x] Preserve R2 backup records, R2 objects, and environment `ADMIN_TOKEN`
- [x] Add Admin Settings danger-zone reset panel

---

## ✅ Completed — Project Consistency Cleanup

- [x] Bump Linkora package/runtime version to `0.7.4`
- [x] Add shared version constant for Worker and Admin displays
- [x] Update GitHub Actions version resolution and repository `LINKORA_VERSION` variable
- [x] Update docs, env examples, wrangler example, changelog, and package lock
- [x] Update GitHub Actions Node runtime to Node 24
- [x] Add release hygiene rule requiring version, changelog, and progress/task updates for every intentional change

---

## ✅ Completed — Domain Split Deployment Safety

- [x] Keep Admin UI, Worker API, and public short-link domains as separate operational roles
- [x] Add `LINKORA_WORKER_DOMAINS` for comma-separated Worker custom domains
- [x] Preserve legacy `LINKORA_SHORT_DOMAIN` as a single-domain fallback
- [x] Add Admin login API Origin override for recovery when a build points at the wrong API URL
- [x] Fall back from a stale browser API Origin override to the build-time API URL during Admin auth startup
- [x] Document `admin.example.com`, `go.example.com`, and `s.example.com` deployment roles

---

## ✅ Completed — Shlink Migration Readiness

- [x] Preserve original short domains from Shlink `shortUrl` during import
- [x] Write imported domains to `links.domain`
- [x] Refresh import KV cache using stored link domain instead of API host
- [x] Document reset-then-import cutover safety for `s.y8o.de`

---

## ✅ Completed — V6 Production Validation

- [x] Apply `migrations/0002_analytics_depth.sql` to production D1
- [x] Deploy Worker and Admin with V6 analytics changes
- [x] Production smoke test Analytics filters and single-link analytics
- [x] Production smoke test `POST /api/conversions`
- [x] Production smoke test `/api/export/analytics.csv`
- [x] Confirm scheduled retention setting is saved
- [x] Clean up temporary `lk-v6-*` smoke links

---

## ✅ Completed — Formal Roadmap Sync

- [x] Compare the private full development document against the public project docs
- [x] Move remaining private-plan gaps into the formal roadmap instead of treating them as completed work
- [x] Add long-term operations, recovery, monitoring, usability, i18n, growth, and collaboration planning
- [x] Keep V1-V6 completion status scoped to the features that are actually implemented

---

## ✅ Completed — V6 Analytics Depth First Pass

- [x] Add per-link analytics detail page
- [x] Add Analytics filters for link, domain, tag, campaign, project, country, device, browser, referer, and UTM values
- [x] Add UTM parameter breakdown
- [x] Add smart redirect rule and A/B target breakdown
- [x] Add conversion or goal event tracking
- [x] Add exportable Analytics reports
- [x] Add configurable raw visit retention controls
- [x] Run Worker type-check, Admin production build, and local D1 migration

---

## ✅ Completed — V5 Open Source Self-Hosted Release

Product direction:

- [x] Keep Linkora free and open source first; do not add paid SaaS or subscription billing yet
- [x] Preserve a complete, practical self-hosted version for personal users and small teams
- [x] Treat paid deployment, migration help, hosted service, or support as future optional business models only

Deployment experience:

- [x] Rewrite README for first-time external users
- [x] Add a clean self-hosted deployment guide with example domains only
- [x] Add `apps/worker/wrangler.toml.example`
- [x] Add GitHub Actions documentation using repo variables for API URL and Pages project name
- [x] Document Cloudflare resources required by a fresh install: Workers, D1, KV, R2, Queues, Pages, secrets, and custom domains
- [x] Add post-deploy smoke test commands for health, auth rejection, create/edit/delete, redirect, import preview, and export
- [x] Isolate personal deployment values from public docs and reusable GitHub Actions defaults
- [x] Improve first-run Admin guidance for system status and missing setup checks
- [x] Move maintainer production Worker config out of the public default path, or generate it from deployment variables
- [x] Change project license to GPL-3.0-only and keep public repository readiness cleanup
- [x] Document current dashboard/analytics coverage and next tracking gaps

---

## 🟡 Pending — V1 Remaining

### Backend

- [x] Create and configure Cloudflare D1 database (`wrangler d1 create linkora-db`)
- [x] Create and configure Cloudflare KV namespace
- [x] Apply production DB migration after Cloudflare D1 is configured
- [x] Set `ADMIN_TOKEN` secret for production (`wrangler secret put ADMIN_TOKEN`)

### Frontend

- [x] Verify Links list pagination and search
- [x] Verify Create/Edit link forms
- [x] Verify Import/Export page (preview + confirm + download)
- [x] Verify Settings save/load

### Deployment

- [x] Deploy Worker to Cloudflare (`wrangler deploy`)
- [x] Deploy Admin to Cloudflare Pages or static host
- [x] Add GitHub Actions workflow for automatic Cloudflare deploy on push to `main`
- [x] Test `GET /health` on production URL
- [x] Test short link redirect on production domain
- [x] Verify API auth rejects requests without token
- [x] Configure a test short-link domain
- [x] Add DNS CNAME for the Admin custom domain to the Cloudflare Pages project
- [x] Verify Admin custom domain
- [x] Rebuild and deploy Admin with the Worker/API base URL
- [x] Configure Admin short-link copy/open domain via Settings

### Migration

- [x] Pull Shlink short URLs through Shlink REST API
- [x] Preview Shlink import in production Linkora
- [x] Import 195 Shlink links into production Linkora
- [x] Verify duplicate import preview reports conflicts instead of overwriting
- [x] Spot-check imported redirects on production Worker
- [x] Prepare legacy short-domain cutover and rollback checklist
- [ ] Revoke or rotate the Shlink API key used for migration
- [ ] Cut over the legacy short domain from Shlink to Linkora

---

## 🟢 Completed — V1

### Project Setup

- [x] Monorepo structure (`apps/worker`, `apps/admin`, `packages/shared`)
- [x] Root `package.json` with workspaces
- [x] `tsconfig.json` for all packages
- [x] `.gitignore`, `.prettierrc`
- [x] Database migration `migrations/0001_init.sql`
- [x] Git repository initialized and pushed to GitHub

### Backend — Worker

- [x] `src/types.ts` — Env interface
- [x] `src/utils/id.ts` — ID + slug generation
- [x] `src/utils/response.ts` — JSON/HTML response helpers
- [x] `src/auth/index.ts` — Bearer token auth middleware
- [x] `src/db/index.ts` — All D1 query functions
- [x] `src/cache/index.ts` — KV read/write/delete
- [x] `src/analytics/index.ts` — Visit recording (async)
- [x] `src/routes/redirect.ts` — `GET /:slug` handler
- [x] `src/routes/auth.ts` — Login / me / logout
- [x] `src/routes/links.ts` — Links CRUD + status actions
- [x] `src/routes/tags.ts` — Tags CRUD
- [x] `src/routes/settings.ts` — Settings get/put
- [x] `src/routes/export.ts` — CSV / JSON / backup export
- [x] `src/routes/importRoutes.ts` — Import preview / confirm / jobs
- [x] `src/importers/shlink.ts` — Shlink JSON / JSONL / CSV adapter
- [x] `src/importers/generic.ts` — Generic CSV / JSON adapter
- [x] `src/index.ts` — Hono app entry point + route registration

### Frontend — Admin

- [x] `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.cjs`
- [x] `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`
- [x] `src/api/client.ts` — Base fetch + downloadFile
- [x] `src/api/auth.ts` — Login / me
- [x] `src/api/links.ts` — Links CRUD + actions + overview
- [x] `src/api/tags.ts` — Tags API
- [x] `src/api/settings.ts` — Settings API
- [x] `src/api/importExport.ts` — Import/export API
- [x] `src/contexts/AuthContext.tsx` — Auth state + hooks
- [x] `src/components/ui/Button.tsx`
- [x] `src/components/ui/Badge.tsx` + `StatusBadge`
- [x] `src/components/ui/Input.tsx` + `Select` + `Textarea`
- [x] `src/components/ui/Modal.tsx` + `ConfirmDialog`
- [x] `src/components/ui/Toast.tsx` + `ToastProvider` + `useToast`
- [x] `src/components/Sidebar.tsx`
- [x] `src/components/Layout.tsx`
- [x] `src/pages/Login.tsx`
- [x] `src/pages/Overview.tsx`
- [x] `src/pages/Links.tsx`
- [x] `src/pages/CreateLink.tsx`
- [x] `src/pages/EditLink.tsx`
- [x] `src/pages/ImportExport.tsx`
- [x] `src/pages/Settings.tsx`
- [x] `src/pages/Tags.tsx`

### Documentation

- [x] `README.md`
- [x] `DEPLOYMENT.md`
- [x] `CUTOVER.md`
- [x] `AGENTS.md`
- [x] `DEVELOPMENT_GUIDE.md`
- [x] `docs/DEPLOYMENT.md`
- [x] `docs/IMPORT_SHLINK.md`
- [x] `docs/IMPORT_ADAPTERS.md`
- [x] `docs/MIGRATION_FROM_SHLINK.md`
- [x] `docs/BACKUP_AND_RESTORE.md`
- [x] `docs/API.md`
- [x] `docs/ROADMAP.md`
- [x] `docs/SECURITY.md`
- [x] `TASKS.md`
- [x] `PROGRESS.md`
- [x] `CHANGELOG.md`
- [x] `.env.example`

### Local Verification

- [x] Ran `npm install` at repo root
- [x] Worker type-check passes (`npm run type-check --workspace=apps/worker`)
- [x] Admin production build passes (`npm run build --workspace=apps/admin`)
- [x] Applied local D1 migration (`npm run db:migrate:local --workspace=apps/worker`)
- [x] Local smoke test: `/health` returns 200, unauthenticated `/api/overview` returns 401, missing slug returns 404
- [x] Local E2E: create link, redirect, async click increment, disable page, delete then 404
- [x] Local KV direct test: create writes KV, disable clears KV, enable rewrites KV, delete clears KV
- [x] Local export test: `links.csv`, `links.json`, and `backup.json`
- [x] Local visits export test: `visits.csv`
- [x] Local Shlink import test: preview, confirm, duplicate slug conflict skip
- [x] Admin import confirm downloads a pre-import `backup.json` before mutating data
- [x] Local Tags API smoke test: create, update, list, delete
- [x] Local tag sync smoke test: link tags create catalog entries; rename/delete syncs back to links
- [x] Local Admin browser check: login flow reaches Overview
- [x] Local Admin browser check: Overview stats load
- [x] Production smoke test: create, list/search, edit, disable, enable, archive, restore, delete
- [x] Production redirect state test: disable stops redirect immediately, delete returns 404 immediately
- [x] Production Import/Export test: export CSV/JSON/backup, preview exported CSV, duplicate slugs report conflicts
- [x] V2 QR code build/deploy check: Links actions include QR preview and PNG download
- [x] V2 bulk actions production check: disable, enable, archive, restore, delete on temporary links
- [x] V2 expiry/max-clicks production check: expired links show expired page; max-click links stop after limit
- [x] V2 auto-fetch page title production check: metadata endpoint rejects unauthenticated requests and fetches `Example Domain`
- [x] V2 bulk tag assignment production check: add, replace, remove, and clear tags on temporary links
- [x] V2 full production regression: 49 checks passed; temporary `lk-v2-reg-*` links cleaned up

---

## 🔵 Backlog — V2

- [x] Link expiry (`expires_at` UI field)
- [x] Max clicks (`max_clicks` UI field)
- [x] Bulk delete / disable / enable
- [x] Bulk tag assignment
- [x] Auto-fetch page title
- [x] QR code generation
- [x] Password-protected links
- [x] Safety warning page
- [x] UTM parameter templates
- [x] Tags management page
- [x] Link tags and Tags catalog synchronization
- [x] Create/Edit Link forms can select existing Tags catalog entries
- [x] Local import smoke test: Sink, YOURLS, Dub, Linkora backup restore
- [x] Local import conflict smoke test: rename and overwrite
- [x] Sink importer adapter
- [x] YOURLS importer adapter
- [x] Dub importer adapter
- [x] Import conflict strategies: rename / overwrite
- [x] Audit logs page
- [x] Linkora backup.json restore import
- [x] Shlink API pull import
- [x] Local V2 security smoke test: password page, warning page, normal redirect, audit log write
- [x] Bulk create links
- [x] Links advanced filters
- [x] Generic CSV field mapping enhancements
- [x] Generic JSON / JSONL field mapping enhancements

## 🔵 Backlog — V3

- [x] Advanced analytics dashboard
- [x] Daily stats aggregation (`daily_stats` table)
- [x] Auto-backup to Cloudflare R2
- [x] API Token management page
- [x] Cloudflare Queues for async stats
- [x] Cron Triggers for daily backup
- [x] Multi-domain support
- [x] Webhook notifications

## 🔵 Backlog — V4

- [x] Country-based redirect rules
- [x] Device-based redirect rules
- [x] Browser-based redirect rules
- [x] Referer-based redirect rules
- [x] Language-based redirect rules
- [x] A/B test redirect rules
- [x] Weighted traffic splitting
- [x] Admin Redirect Rules page
- [x] Redirect rules included in backup export / restore
- [x] V4 smart redirect production validation
- [x] Campaign / project grouping
- [x] V4 campaign / project grouping production validation
- [x] Local smart slug / title / description / tag suggestions
- [x] V4 smart suggestions production validation
- [x] Link health checker
- [x] V4 link health checker production validation

## 🔵 Backlog — V7 Operations, Recovery, And Monitoring

- [x] One-click restore from R2 backup records in the Backups page
- [x] Restore dry-run preview with conflict summary
- [x] Pre-restore backup and restore report
- [x] Factory reset with preview, confirmation phrase, pre-reset backup, and KV cache clearing
- [x] Configurable R2 backup retention with a 30-day default
- [x] Retention cleanup for old backup records and R2 objects
- [x] Periodic target health monitoring through Cron
- [ ] Target status history with last status code, last checked time, and failure count
- [ ] Target failure alerts through Admin notices and optional webhooks
- [x] Alert controls for consecutive-failure thresholds, suppression, and recovery Webhook notifications
- [x] First-class `fallback_url` editing in Create/Edit Link
- [ ] Custom 404, expired, disabled, and warning page templates
- [x] Operations dashboard for backup freshness, monitoring status, current failed targets, queue configuration, and deployment health
- [x] Better bot classification for analytics and monitoring noise reduction

## 🔵 Backlog — V8 Usability Modes And Internationalization

- [x] Simple / Advanced Admin mode toggle
- [x] Simple mode hides advanced navigation and Settings operator panels
- [x] Hide advanced controls inside link forms and the Links table when Simple mode is active
- [x] Advanced mode exposes Redirect Rules, Webhooks, API Tokens, advanced Analytics filters, backups internals, and bulk tooling
- [x] Advanced Setup reports R2, Queue, and multi-domain runtime capabilities
- [ ] Instance-level feature visibility settings for optional modules
- [ ] Per-browser or per-admin preferences for sidebar density, table density, and advanced panels
- [x] Required first-run setup wizard for new self-hosters
- [x] Language switcher with English as default and Simplified Chinese as an option
- [ ] Complete i18n coverage for remaining labels, validation messages, empty states, errors, and documentation links
- [ ] Locale-aware date, time zone, number, and CSV/export formatting settings
- [ ] Contextual help text for advanced fields only when advanced mode is enabled

## 🔵 Backlog — V9 Growth Tools, Reporting, And Link Intelligence

- [ ] Bulk replace destination URLs with preview and rollback guidance
- [ ] Bulk append or normalize UTM parameters
- [ ] Saved UTM templates and campaign presets
- [ ] Link notes and affiliate/internal notes
- [ ] OpenGraph preview cards for destination pages
- [ ] Public read-only stats pages with privacy controls, share tokens, and per-link enablement
- [ ] Scheduled analytics report exports
- [ ] Saved Analytics filters and reusable report views
- [ ] Privacy-safe session or visitor-level conversion attribution
- [ ] Additional conversion attribution fields, such as external campaign IDs and client-provided visitor IDs
- [ ] Long-idle auto-archive rules with review queue and dry-run mode
- [ ] Additional import adapters when demand is clear, such as Bitly

## 🔵 Backlog — V10 Collaboration And Governance

- [ ] Multi-user accounts
- [ ] Roles and permissions
- [ ] Team or workspace separation
- [ ] API token ownership and rotation policies
- [ ] Audit log export and retention policies
- [ ] Per-project access controls
- [ ] Optional managed hosting, migration services, or support offerings while preserving the free self-hosted edition

# CHANGELOG

All notable changes to Linkora will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

_(none)_

---

## [0.7.1] — 2026-07-09

### Fixed
- Shlink API import now fetches all pages by supporting `pagesTotal`, `pagesCount`, and `totalPages`.
- Shlink API import continues fetching full pages when the API omits total page count, preventing first-page-only migrations.

---

## [0.7.0] — 2026-07-09

### Added
- Admin import confirmation now downloads a pre-import `backup.json` before mutating link data.
- Visits can now be exported from `GET /api/export/visits.csv` and the Admin Import / Export page.
- Added the `docs/` reference set for deployment, imports, migration, backup, API, roadmap, and security.
- Added `PUT /api/tags/:id` and a Tags management page with color and description editing.
- Link tags are now synchronized with the Tags catalog during list, create, edit, import, rename, and delete flows.
- Added a GitHub Actions workflow for automatic Worker and Admin deployment on pushes to `main`.
- Create/Edit Link forms now show existing Tags catalog entries as selectable tag chips.
- Added Sink, YOURLS, Dub, and Linkora `backup.json` import adapters.
- Import confirm now supports `skip`, `rename`, and `overwrite` conflict strategies.
- Added Shlink API pull import, password-protected links, safety warning pages, UTM templates, and Audit Logs.
- Added bulk link creation, Links advanced filters, Generic CSV / JSON field mapping, and an Analytics dashboard backed by daily stats aggregation.
- Added R2 backup snapshots with manual Admin creation, download, backup records, and daily Worker cron scheduling.
- Added scoped API token management with hash-only storage, Admin creation/revocation, and API token auth for protected routes.
- Completed V2 production regression and marked V2 as done.
- Added optional Cloudflare Queues processing for visit statistics with direct `ctx.waitUntil()` fallback.
- Added multi-domain management, per-link short domain selection, and domain-aware redirect lookups.
- Added webhook notifications with signed deliveries for link, import, and backup events.
- Added V4 smart redirect rules for country, device, browser, referer, language, and weighted/A-B traffic splitting.
- Linkora backups now include redirect rules, and `backup.json` restore reattaches rules to restored links.
- Added V4 campaign and project grouping backed by `campaign:*` and `project:*` tags.
- Added V4 manual link health checks for individual URLs, single links, and capped batches of active links.
- Added V4 local smart link suggestions for slugs, titles, descriptions, and tags from URL/page metadata.
- Added V5 self-hosting documentation, a public `wrangler.toml` template, Admin env example, and reusable GitHub Actions variables for open-source deployments.
- Added an Admin Setup page that summarizes API reachability, short-domain configuration, domain catalog, backups, and first-link readiness for self-hosted installs.
- Removed the tracked production Worker config and made GitHub Actions generate `wrangler.toml` from repository variables before deploy.
- Added MIT licensing, public repository cleanup, analytics documentation, and clearer local self-hosting bootstrap instructions.
- Analytics now reports approximate unique visitors and operating system breakdowns, and the Admin Analytics page displays device and OS breakdown cards.
- Added V6 analytics depth: filterable Analytics dashboard, single-link analytics page, UTM breakdowns, redirect target/A-B statistics, conversion events, Analytics CSV export, and scheduled raw analytics retention.
- Added V7 R2 backup restore preview, one-click restore, conflict strategies, pre-restore backup, and restore reporting.
- Added factory reset with reset preview, exact confirmation phrase, pre-reset R2 backup, KV cache clearing, and default settings restoration.

### Changed
- Bumped Linkora package and runtime version to `0.7.0`.
- Added a shared `LINKORA_VERSION` constant used by Worker fallbacks and Admin version display.
- GitHub Actions now resolves the deployment version from `package.json` when `LINKORA_VERSION` is not explicitly set.

---

## [0.1.0] — 2026-07-01

Initial V1 release — full code complete, awaiting first production deployment.

### Added

#### Worker (Backend)
- `GET /health` — health check endpoint returning `{ status, name, version }`
- `GET /:slug` — short link redirect with KV cache + D1 fallback
- Async visit recording via `ctx.waitUntil()` (stats never block redirects)
- 404 and disabled-link HTML pages
- `POST /api/auth/login` — admin token login
- `GET  /api/auth/me` — check auth status
- Links CRUD: `GET/POST /api/links`, `GET/PUT/DELETE /api/links/:id`
- Link status actions: `disable`, `enable`, `archive`, `restore`
- Tags CRUD: `GET/POST /api/tags`, `DELETE /api/tags/:id`
- Settings: `GET/PUT /api/settings`
- Export: `GET /api/export/links.csv`, `/links.json`, `/backup.json`
- Import: `POST /api/import/preview`, `POST /api/import/confirm`, `GET /api/import/jobs`
- Shlink import adapter — supports JSON, JSONL, CSV formats
- Generic CSV / JSON import adapter
- KV cache helpers (`getCachedLink`, `setCachedLink`, `deleteCachedLink`)
- D1 query layer (`src/db/index.ts`) — all SQL in one place
- Bearer token auth middleware (`src/auth/index.ts`)
- Standardized JSON response helpers (`src/utils/response.ts`)
- ID and slug generation utilities (`src/utils/id.ts`)

#### Admin (Frontend)
- Login page with token authentication
- Overview dashboard — total links, total clicks, today's clicks, recent/top links
- Links list — search, filter by status/tag, sort, pagination, copy/open/edit/disable/archive/delete
- Create Link form — URL, custom slug, title, tags, redirect type
- Edit Link form — all fields + status change
- Import / Export page — file upload, source detection, preview, confirm, history table, export buttons
- Settings page — site name, default domain, redirect type
- Reusable UI components: `Button`, `Badge`, `StatusBadge`, `Input`, `Select`, `Textarea`, `Modal`, `ConfirmDialog`, `Toast`, `Sidebar`, `Layout`
- `AuthContext` — login/logout/token state via localStorage
- API client layer with typed wrappers per resource
- React Router v6 routing with `RequireAuth` guard

#### Shared Package
- TypeScript interfaces: `Link`, `Visit`, `Tag`, `ImportJob`, `Setting`, `PaginatedResult`, `NormalizedImportItem`, `ImportAdapter`
- Validators: `isValidUrl`, `isValidSlug`, `RESERVED_SLUGS`

#### Database
- `migrations/0001_init.sql` — complete D1 schema for V1–V4
- V1 active tables: `links`, `visits`, `tags`, `import_jobs`, `settings`
- V2–V4 tables pre-created (not used): `daily_stats`, `domains`, `api_tokens`, `audit_logs`, `backups`, `redirect_rules`

#### Documentation
- `README.md` — project overview, setup, deployment, Shlink migration guide
- `AGENTS.md` — AI agent instructions and golden rules
- `DEVELOPMENT_GUIDE.md` — local setup, architecture, conventions
- `TASKS.md` — active task list (V1 pending / completed / backlog)
- `PROGRESS.md` — feature checklist and known issues
- `CHANGELOG.md` — this file
- `.env.example` — required environment variable reference
- `apps/worker/.dev.vars.example` — local dev secrets template

---

## Version History Summary

| Version | Date       | Description                              |
|---------|------------|------------------------------------------|
| 0.1.0   | 2026-07-01 | V1 code complete — full feature set built |

---

## Upcoming

### V1.1 (patch)
- Production deployment + acceptance testing
- Fix any issues found during first real-world use

### V2.0
- Bulk operations (delete, disable, tag)
- Link expiry (`expires_at`) and max clicks (`max_clicks`)
- Password-protected links
- Safety warning page
- QR code generation
- Sink / YOURLS / Dub import adapters
- Audit logs
- See `TASKS.md` for full V2 backlog

### V3.0
- Advanced analytics with daily_stats aggregation
- Auto-backup to Cloudflare R2
- API Token management
- Cloudflare Queues for async stats
- Cron triggers for scheduled backup

### V4.0
- Smart redirect rules (country, device, browser, A/B, weighted)
- Local smart slug / title / description / tag suggestions
- Campaign and project grouping
- Link health checker

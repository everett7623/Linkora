# TASKS.md — Active Task List

Track active work items here. Move items between sections as they progress.
One item in "In Progress" at a time whenever possible.

---

## 🔴 In Progress

_(none currently)_

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
- [x] Test `GET /health` on production URL
- [x] Test short link redirect on production domain
- [x] Verify API auth rejects requests without token
- [x] Configure test short-link domain `go.y8o.de`
- [x] Add DNS CNAME for `admin.y8o.de` → `linkora-admin.pages.dev`
- [x] Verify Admin custom domain `https://admin.y8o.de`
- [x] Rebuild and deploy Admin with API base `https://go.y8o.de`
- [x] Configure Admin short-link copy/open domain via Settings (`default_domain=go.y8o.de`)

### Migration

- [x] Pull Shlink short URLs through Shlink REST API
- [x] Preview Shlink import in production Linkora
- [x] Import 195 Shlink links into production Linkora
- [x] Verify duplicate import preview reports conflicts instead of overwriting
- [x] Spot-check imported redirects on production Worker
- [x] Prepare `s.y8o.de` cutover and rollback checklist
- [ ] Revoke or rotate the Shlink API key used for migration
- [ ] Cut over `s.y8o.de` from Shlink to Linkora

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

### Documentation
- [x] `README.md`
- [x] `DEPLOYMENT.md`
- [x] `CUTOVER_S_Y8O_DE.md`
- [x] `AGENTS.md`
- [x] `DEVELOPMENT_GUIDE.md`
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
- [x] Local Shlink import test: preview, confirm, duplicate slug conflict skip
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

---

## 🔵 Backlog — V2

- [x] Link expiry (`expires_at` UI field)
- [x] Max clicks (`max_clicks` UI field)
- [x] Bulk delete / disable / enable
- [x] Bulk tag assignment
- [x] Auto-fetch page title
- [x] QR code generation
- [ ] Password-protected links
- [ ] Safety warning page
- [ ] UTM parameter templates
- [ ] Tags management page
- [ ] Sink importer adapter
- [ ] YOURLS importer adapter
- [ ] Dub importer adapter
- [ ] Import conflict strategies: rename / overwrite
- [ ] Audit logs page
- [ ] Linkora backup.json restore import

## 🔵 Backlog — V3

- [ ] Advanced analytics dashboard
- [ ] Daily stats aggregation (`daily_stats` table)
- [ ] Auto-backup to Cloudflare R2
- [ ] API Token management page
- [ ] Cloudflare Queues for async stats
- [ ] Cron Triggers for daily backup
- [ ] Multi-domain support
- [ ] Webhook notifications

## 🔵 Backlog — V4

- [ ] Country-based redirect rules
- [ ] Device-based redirect rules
- [ ] A/B test redirect rules
- [ ] Weighted traffic splitting
- [ ] Campaign / project grouping
- [ ] AI slug suggestions
- [ ] Link health checker

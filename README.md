# Linkora

A lightweight, stable, self-hosted short link system built on Cloudflare Workers + D1 + KV.

> **Core Principle:** Redirect stability first. Stats failures must never break redirects.

---

## Product Direction

Linkora is free and open source first. The project prioritizes self-hosting on your own Cloudflare account, data ownership, migration safety, and stable redirects over SaaS complexity.

For a first-time deployment, start with [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md).

## Features

- ⚡ Fast short link redirects via Cloudflare Workers + KV cache
- 🔒 Admin panel with token authentication
- 🔗 Create, edit, disable, archive, and delete short links
- Bulk create short links and bulk update selected links
- 🔍 Search by slug, URL, title; filter by tag, status, source, domain, created date, password, warning, and limits
- 🏷️ Tag support and tag management
- 📊 Click tracking with analytics dashboard and daily aggregation
- 🔑 Scoped API tokens for read, write, and admin API access
- 🌐 Multi-domain catalog with per-link short domain selection
- Smart redirect rules for country, device, browser, referer, language, and weighted/A-B traffic
- Campaign and project grouping through managed group tags
- Manual health checks for target URLs and active links
- Local smart suggestions for slug, title, description, and tags from page metadata
- Webhook notifications for link, import, and backup events
- 📥 Import from Shlink, Sink, YOURLS, Dub, Linkora backup, and generic CSV / JSON with field mapping
- 🧭 Import preview with skip, rename, or overwrite conflict handling
- Password-protected links, safety warning pages, and UTM builder templates
- Audit Logs page for admin actions and imports
- 📤 Export links as CSV / JSON, visits as CSV, full backups, and R2 backup snapshots
- ⚙️ System settings
- 🏥 Health check endpoint (`/health`)

## Tech Stack

| Layer       | Technology                            |
|-------------|---------------------------------------|
| Backend     | Cloudflare Workers + TypeScript       |
| Database    | Cloudflare D1 (SQLite)                |
| Cache       | Cloudflare KV                         |
| Frontend    | React + Vite + Tailwind CSS           |
| Shared      | TypeScript monorepo (`packages/shared`) |

## Project Structure

```
linkora/
├── apps/
│   ├── worker/          # Cloudflare Worker — redirects & API
│   └── admin/           # React admin panel
├── packages/
│   └── shared/          # Shared types & validators
├── migrations/
│   └── 0001_init.sql    # D1 schema
└── docs/                # Extended documentation
```

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- Wrangler CLI: `npm install -g wrangler`
- Cloudflare account

### Install dependencies

```bash
npm install
```

### Worker (backend)

```bash
# Copy example vars
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
# Edit .dev.vars and set ADMIN_TOKEN

# Start local dev
npm run dev --workspace=apps/worker
```

### Admin (frontend)

```bash
# Start dev server (proxies /api to worker on :8787)
npm run dev --workspace=apps/admin
```

## Cloudflare Setup

For a new self-hosted deployment, follow [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md). It includes the Cloudflare resource checklist, template configuration, GitHub Actions variables, and smoke tests.

This repository also keeps a maintainer production runbook in [DEPLOYMENT.md](DEPLOYMENT.md).

### 1. Create D1 Database

```bash
wrangler d1 create linkora-db
```

Copy `apps/worker/wrangler.toml.example` to `apps/worker/wrangler.toml`, then put the returned `database_id` into the D1 binding.

### 2. Run Migrations

```bash
# Local
wrangler d1 execute linkora-db --local --file=migrations/0001_init.sql

# Production
wrangler d1 execute linkora-db --file=migrations/0001_init.sql
```

### 3. Create KV Namespace

```bash
wrangler kv namespace create KV
wrangler kv namespace create KV --preview
```

Copy both IDs into `apps/worker/wrangler.toml`.

### 4. Create R2 Backup Buckets

```bash
wrangler r2 bucket create linkora-backups
wrangler r2 bucket create linkora-backups-dev
```

The Worker binds these buckets as `BACKUPS` and runs a daily scheduled backup.

### 5. Create Queue for Visit Stats

```bash
wrangler queues create linkora-visits --message-retention-period-secs 60
```

The Worker uses this queue for asynchronous visit statistics and falls back to direct `ctx.waitUntil()` recording if queue send fails.

### 6. Set Admin Token (Production)

```bash
wrangler secret put ADMIN_TOKEN
```

## Environment Variables

See `.env.example`, `apps/worker/.dev.vars.example`, and `apps/admin/.env.example` for all required variables.

| Variable           | Description                             |
|--------------------|-----------------------------------------|
| `ADMIN_TOKEN`      | Bearer token for admin API auth         |
| `LINKORA_VERSION`  | Current version string (optional)       |
| `VITE_API_URL`     | API base URL for admin frontend         |

## Deploy

Pushing to `main` can deploy automatically through GitHub Actions after the Cloudflare secrets in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) are configured.

For a reusable open-source setup, configure these GitHub repository values:

Secrets:

```txt
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Variables:

```txt
LINKORA_API_URL=https://go.example.com
LINKORA_PAGES_PROJECT=linkora-admin
LINKORA_WORKER_NAME=linkora-worker
LINKORA_SHORT_DOMAIN=go.example.com
LINKORA_D1_DATABASE_NAME=linkora-db
LINKORA_D1_DATABASE_ID=<your-d1-database-id>
LINKORA_KV_NAMESPACE_ID=<your-kv-namespace-id>
LINKORA_KV_PREVIEW_ID=<your-kv-preview-id>
LINKORA_R2_BUCKET=linkora-backups
LINKORA_R2_PREVIEW_BUCKET=linkora-backups-dev
LINKORA_VISITS_QUEUE=linkora-visits
```

### Worker

```bash
npm run deploy --workspace=apps/worker
# or
cd apps/worker && wrangler deploy
```

### Admin

```bash
npm run build --workspace=apps/admin
# Deploy the dist/ folder to Cloudflare Pages, Netlify, or any static host
```

For production builds where Admin and Worker use separate domains, set `VITE_API_URL` to the Worker short/API domain:

```bash
VITE_API_URL=https://go.example.com npm run build --workspace=apps/admin
```

## Shlink Import

See [docs/IMPORT_SHLINK.md](docs/IMPORT_SHLINK.md) for the full import guide.

Quick steps:
1. Export from Shlink, or enter Shlink URL + API key in Linkora Admin.
2. In Linkora Admin → **Import / Export** → upload file or click **Fetch Shlink**.
3. Select source: **Shlink** when uploading manually.
4. Click **Preview** to review conflicts
5. Click **Import** to confirm

Original `shortCode` values are preserved as slugs. Conflicts are skipped by default.

## Migration from Shlink

See [docs/MIGRATION_FROM_SHLINK.md](docs/MIGRATION_FROM_SHLINK.md).

**Summary:**
1. Deploy Linkora to `go.example.com` (test domain)
2. Import Shlink data and verify old slugs work
3. Run for 1–2 weeks in parallel
4. Switch DNS for production domain to Linkora Worker
5. Keep Shlink running 1–2 weeks for rollback

## Rollback

If Linkora has issues, point the production domain DNS back to Shlink. No data is lost.

## Roadmap

| Version | Focus |
|---------|-------|
| **V1** ✅ | Stable redirects, CRUD, Shlink import, basic stats, export |
| **V2** ✅ | Bulk ops, expiry, password, QR codes, Sink/YOURLS/Dub import, audit logs |
| **V3** ✅ | Advanced analytics, auto R2 backup, API tokens, multi-domain, Webhooks, Queues, Cron |
| **V4** ✅ | Smart redirects (country/device/browser/referer/language/A-B), local smart suggestions, UTM templates, campaigns, health checks |
| **V5** 🚧 | Open-source packaging, self-hosting docs, template config, reusable deploy workflow |

See [docs/ROADMAP.md](docs/ROADMAP.md) for details.

## License

[MIT](LICENSE)

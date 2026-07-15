# Linketry

<p align="center">
  <img src="apps/admin/public/linketry-logo.png" alt="Linketry logo" width="360" />
</p>

Linketry is a self-hosted link management, analytics and monitoring platform.

自托管短链接管理、访问分析与健康监控平台。

| Identity | Value |
|---|---|
| Author | `everettlabs` |
| Website | [linketry.com](https://linketry.com) |
| GitHub | [everett7623/Linketry](https://github.com/everett7623/Linketry) |
| Docker image | `everett7623/linketry` |
| API namespace | `/api/v1` |
| Environment prefix | `LINKETRY_` |
| Fresh-install D1 name | `linketry` |

> **Core Principle:** Redirect stability first. Stats failures must never break redirects.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/everett7623/Linketry)
[![Deploy to Cloudflare Pages](https://deploy.pages.cloudflare.com/button)](https://deploy.pages.cloudflare.com/?url=https://github.com/everett7623/Linketry)

> **New to self-hosting?** Follow the [quick-start guide](docs/SELF_HOSTING.md) and run the [read-only deployment preflight](docs/DEPLOYMENT_PREFLIGHT.md) before provisioning or deployment. Installations older than 0.10 must use the [non-destructive upgrade guide](docs/UPGRADING_PRE_0_10.md) and keep their current D1/KV/R2/Queue bindings until migration is verified.

---

## Product Direction

Linketry is free and open source first. The project prioritizes self-hosting on your own Cloudflare account, data ownership, migration safety, stable redirects, and long-term operation over SaaS complexity.

Advanced capabilities are planned as optional layers. The Admin should stay comfortable for simple short-link use, while power users can enable advanced operations, analytics, automation, and campaign tooling as needed.

For a first-time deployment, start with [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md).

## Features

- ⚡ Fast short link redirects via Cloudflare Workers + KV cache
- 🔒 Admin panel with token authentication
- 🔗 Create, edit, disable, archive, and delete short links
- Bulk create short links and bulk update selected links
- Preview-first bulk UTM add/replace/remove for selected or filtered links, with guarded writes, selective cache clearing, and a downloadable change record
- 🔍 Search by slug, URL, title; filter by tag, status, source, domain, created date, password, warning, and limits
- 🏷️ Tag support and tag management
- 📊 Overview dashboard, filterable analytics, single-link analytics, UTM/target/conversion breakdowns, reports, and visits export
- 🔑 Scoped API tokens for read, write, and admin API access
- 🌐 Multi-domain catalog with per-link short domain selection
- Smart redirect rules for country, device, browser, referer, language, and weighted/A-B traffic
- Campaign and project grouping through managed group tags
- Manual and scheduled health checks for active links' original destination/Aff URLs
- Local smart suggestions for slug, title, description, and tags from page metadata
- Telegram, Discord, Slack, Feishu, DingTalk, WeCom, and signed Webhook notifications for scheduled target failures and recoveries
- 📥 Import from Shlink, Sink, YOURLS, Dub, Linketry backup, and generic CSV / JSON with field mapping
- 🧭 Import preview with skip, rename, or overwrite conflict handling
- Password-protected links, safety warning pages, and UTM builder templates
- Audit Logs page for admin actions and imports
- 📤 Export links as CSV / JSON, visits as CSV, full backups, and R2 backup snapshots
- R2 backup restore preview and one-click restore with pre-restore snapshots
- Factory reset with preview, confirmation phrase, pre-reset backup, and KV cache clearing
- ⚙️ System settings
- 🏥 Health check endpoint (`/health`)

## Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Backend  | Cloudflare Workers + TypeScript         |
| Database | Cloudflare D1 (SQLite)                  |
| Cache    | Cloudflare KV                           |
| Frontend | React + Vite + Tailwind CSS             |
| Shared   | TypeScript monorepo (`packages/shared`) |

## Project Structure

```
linketry/
├── apps/
│   ├── worker/          # Cloudflare Worker — redirects & API
│   └── admin/           # React admin panel
├── packages/
│   └── shared/          # Shared types & validators
├── migrations/
│   ├── 0001_init.sql    # Base D1 schema
│   └── 0002_analytics_depth.sql
└── docs/                # Extended documentation
```

## Local Development

### Prerequisites

- Node.js 24 recommended
- npm 10+
- Wrangler 4, installed locally by `npm install`
- Cloudflare account

### Install dependencies

```bash
npm install
```

### Worker (backend)

```bash
# Copy Worker config and local secrets
cp apps/worker/wrangler.toml.example apps/worker/wrangler.toml
# Copy example vars
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
# Edit .dev.vars and set LINKETRY_ADMIN_TOKEN

# Prepare local D1 state
npm run db:migrate:local --workspace=apps/worker

# Start local dev
npm run dev --workspace=apps/worker
```

On Windows PowerShell, use `Copy-Item` instead of `cp`.

### Admin (frontend)

```bash
# Start dev server (proxies /api to worker on :8787)
npm run dev --workspace=apps/admin
```

## Cloudflare Setup

For a new self-hosted deployment, follow [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md). It includes the Cloudflare resource checklist, template configuration, GitHub Actions variables, and smoke tests.

For a fresh install, preview unique D1/KV names before any resource write:

```bash
npm run deploy:bootstrap -- --prefix linketry-alice --domain go.example.com --account-id <your-cloudflare-account-id>
```

The dry-run prints the exact confirmation phrase required by `--apply`. After provisioning, validate the chosen fresh, upgrade, or Demo track without changing Cloudflare resources:

```bash
npm run deploy:preflight -- --track fresh --check-cloudflare
```

See [docs/DEPLOYMENT_PREFLIGHT.md](docs/DEPLOYMENT_PREFLIGHT.md) for required gates and safe output behavior.

This repository also keeps a maintainer production runbook in [DEPLOYMENT.md](DEPLOYMENT.md).

### 1. Create Required D1 And KV Resources

```bash
npm run deploy:bootstrap -- --prefix linketry-alice --domain go.example.com --account-id <your-cloudflare-account-id>
# Review the plan, then append: --apply --confirm <phrase-from-dry-run>
```

The apply result prints the D1/KV IDs, GitHub repository variables, and Wrangler binding snippet. Copy `apps/worker/wrangler.toml.example` to `apps/worker/wrangler.toml`, then use those values. A KV preview namespace remains optional.

### 2. Run Migrations

```bash
# Local
npm run db:migrate:local --workspace=apps/worker

# Production
npm run db:migrate:remote --workspace=apps/worker
```

### 3. Create Optional R2 Backup Buckets

```bash
wrangler r2 bucket create linketry-backups
wrangler r2 bucket create linketry-backups-dev
```

The Worker binds these buckets as `BACKUPS`, runs a daily scheduled backup, and supports preview-first one-click restore from completed snapshots.

### 4. Create Queue for Visit Stats

```bash
wrangler queues create linketry-visits --message-retention-period-secs 60
```

The Worker uses this queue for asynchronous visit statistics and falls back to direct `ctx.waitUntil()` recording if queue send fails.

### 5. Set Admin Token (Production)

```bash
wrangler secret put LINKETRY_ADMIN_TOKEN
```

## Environment Variables

See `.env.example`, `apps/worker/.dev.vars.example`, and `apps/admin/.env.example` for all required variables.

| Variable          | Description                       |
| ----------------- | --------------------------------- |
| `LINKETRY_ADMIN_TOKEN`     | Bearer token for admin API auth   |
| `LINKETRY_VERSION` | Current version string (optional) |
| `VITE_LINKETRY_API_URL`    | API base URL for admin frontend   |

## Deploy

Pushing to `main` can deploy automatically through GitHub Actions after the Cloudflare secrets in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) are configured.

### Quick deployment (recommended)

Configure only one custom hostname. Cloudflare Pages automatically provides the Admin URL, so beginners do not need to create an Admin DNS record or custom domain.

```txt
linketry-admin.pages.dev Admin UI (automatic)
go.example.com          Worker API + short links (the only custom hostname)
```

The basic profile requires Worker, D1, KV, Pages, and only the `go.example.com` custom hostname. The first deployment automatically generates `LINKETRY_ADMIN_TOKEN`; a branded Admin domain, R2 backups, Queues, Cron, and a separate public short-link domain remain optional advanced features.

For a reusable open-source setup, configure these GitHub repository values:

Secrets:

```txt
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Variables:

```txt
LINKETRY_API_URL=https://go.example.com
LINKETRY_PAGES_PROJECT=linketry-admin
LINKETRY_WORKER_NAME=linketry-worker
LINKETRY_SHORT_DOMAIN=go.example.com
LINKETRY_D1_DATABASE_NAME=linketry
LINKETRY_D1_DATABASE_ID=<your-d1-database-id>
LINKETRY_KV_NAMESPACE_ID=<your-kv-namespace-id>
LINKETRY_KV_PREVIEW_ID=<your-kv-preview-id>
```

After the first deploy, open the automatic `https://linketry-admin.pages.dev` URL shown in the workflow summary. The same summary points to the automatically generated token in the **Ensure LINKETRY_ADMIN_TOKEN secret** step. A branded `admin.example.com` domain can be added later, but is not part of the beginner flow.

For the advanced profile, optionally add `LINKETRY_WORKER_DOMAINS`, R2 bucket variables, and `LINKETRY_VISITS_QUEUE` as described in [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md).

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

For production builds where Admin and Worker use separate domains, set `VITE_LINKETRY_API_URL` to the stable Worker API domain:

```bash
VITE_LINKETRY_API_URL=https://go.example.com npm run build --workspace=apps/admin
```

For migrations or strict operational isolation, keep `go.example.com` as the stable Admin API domain and add the public short-link domain, such as `s.example.com`, through `LINKETRY_WORKER_DOMAINS`. This third public role is optional.

## Shlink Import

See [docs/IMPORT_SHLINK.md](docs/IMPORT_SHLINK.md) for the full import guide.

Quick steps:

1. Export from Shlink, or enter Shlink URL + API key in Linketry Admin.
2. In Linketry Admin → **Import / Export** → upload file or click **Fetch Shlink**.
3. Select source: **Shlink** when uploading manually.
4. Click **Preview** to review conflicts
5. Click **Import** to confirm

Original `shortCode` values are preserved as slugs. Conflicts are skipped by default.

Imported short-link domains are preserved too. To change every imported link from an old domain such as `s.y8o.de` to a new domain such as `go.uukk.de`, switch the Links page to **Advanced** mode and use **Migrate short-link domain**. This is separate from **Replace URLs**, which edits destination/Aff URLs.

## Migration from Shlink

See [docs/MIGRATION_FROM_SHLINK.md](docs/MIGRATION_FROM_SHLINK.md).

**Summary:**

1. Deploy Linketry to `go.example.com` as the stable API domain
2. Import Shlink data and verify old slugs work
3. Run for 1–2 weeks in parallel
4. Switch DNS for production domain to Linketry Worker
5. Keep Shlink running 1–2 weeks for rollback

## Rollback

If Linketry has issues, point the production domain DNS back to Shlink. No data is lost.

## Analytics

The Admin includes an **Overview** dashboard, a filterable **Analytics** dashboard, and per-link analytics pages. See [docs/ANALYTICS.md](docs/ANALYTICS.md) for tracking fields, filters, conversion events, reports, retention, and privacy notes.

## Roadmap

| Version            | Focus                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **V1** ✅          | Stable redirects, CRUD, Shlink import, basic stats, export                                                                      |
| **V2** ✅          | Bulk ops, expiry, password, QR codes, Sink/YOURLS/Dub import, audit logs                                                        |
| **V3** ✅          | Advanced analytics, auto R2 backup, API tokens, multi-domain, Webhooks, Queues, Cron                                            |
| **V4** ✅          | Smart redirects (country/device/browser/referer/language/A-B), local smart suggestions, UTM templates, campaigns, health checks |
| **V5** ✅          | Open-source packaging, self-hosting docs, template config, reusable deploy workflow                                             |
| **V6** ✅          | Analytics depth: per-link pages, filters, UTM, A/B targets, conversions, reports, retention                                     |
| **V7** In Progress | Operations: one-click restore, backup retention, target monitoring, alerts, custom status pages                                 |
| **V8** In Progress | Usability: Simple / Advanced mode, required first-run wizard, and default-English EN/ZH foundation implemented                  |
| **V9** Planned     | Growth: bulk URL/UTM operations, public stats, notes, OpenGraph previews, scheduled reports                                     |
| **V10** Future     | Collaboration: multi-user, roles, teams, governance, optional managed services                                                  |

See [docs/ROADMAP.md](docs/ROADMAP.md) for details.

## License

[GPL-3.0-only](LICENSE)

# Linkora

A lightweight, stable, and easy-to-manage self-hosted URL shortener built on Cloudflare Workers, D1, and KV.

## Features (V1)

- **Fast Redirect**: KV-cached slug lookups with D1 fallback, 301/302 configurable
- **Admin Dashboard**: React + Tailwind dark-themed management UI
- **Link CRUD**: Create, edit, disable/enable, archive, delete short links
- **Search & Filter**: Full-text search across slug, URL, title, tags; filter by status/tag/source
- **Tags**: Create and manage tags for link organization
- **Click Tracking**: Async visit recording (browser, OS, device, country, referer, bot detection)
- **Shlink Import**: JSON / JSONL / CSV import with preview, conflict detection, original slug preservation
- **Generic Import**: CSV / JSON import with field mapping
- **Export & Backup**: Export links as CSV, JSON, or full `backup.json`
- **Settings**: Default redirect type, default domain, site name
- **Health Check**: `GET /health` endpoint
- **Security**: URL validation, slug validation, reserved path protection, Bearer token auth

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Cache | Cloudflare KV |
| Backend Framework | Hono |
| Frontend | React 18 + Vite + Tailwind CSS |
| Language | TypeScript |
| Monorepo | npm workspaces |

## Project Structure

```
linkora/
├── apps/
│   ├── worker/          # Cloudflare Worker (API + redirect)
│   │   ├── src/
│   │   │   ├── index.ts          # Hono app entry
│   │   │   ├── types.ts          # Env bindings
│   │   │   ├── routes/           # API route handlers
│   │   │   ├── services/         # Business logic (future)
│   │   │   ├── importers/        # Shlink & generic adapters
│   │   │   ├── analytics/        # Visit recording
│   │   │   ├── db/               # D1 queries
│   │   │   ├── cache/            # KV cache helpers
│   │   │   ├── auth/             # Auth middleware
│   │   │   └── utils/            # ID generation, responses
│   │   └── wrangler.toml
│   │
│   └── admin/           # React admin frontend
│       ├── src/
│       │   ├── pages/            # Login, Overview, Links, Create, Tags, Import/Export, Settings
│       │   ├── components/       # Layout, EditLinkDialog
│       │   └── api/              # API client
│       └── vite.config.ts
│
├── packages/
│   └── shared/          # Shared types & validators
│
├── migrations/
│   └── 0001_init.sql    # Database schema
│
└── docs/                # Documentation
```

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9
- Cloudflare account with Workers, D1, and KV access
- Wrangler CLI (installed as dev dependency)

### Local Development

```bash
# Clone and install
git clone https://github.com/everett7623/Linkora.git
cd Linkora
npm install

# Create D1 database (first time only)
npm run db:create --workspace=apps/worker

# Apply migrations locally
npm run db:migrate:local

# Start Worker dev server (port 8787)
npm run dev:worker

# Start Admin dev server (port 5173, proxies /api to :8787)
npm run dev:admin
```

### Environment Variables

The Worker requires:

| Variable | Description | How to set |
|----------|-------------|-----------|
| `ADMIN_TOKEN` | Bearer token for admin API auth | `wrangler secret put ADMIN_TOKEN` |
| `LINKORA_VERSION` | Version string (auto-set in wrangler.toml) | `[vars]` in wrangler.toml |

### Cloudflare Resources

```bash
# Create D1 database
wrangler d1 create linkora-db
# Copy the database_id to wrangler.toml

# Create KV namespace
wrangler kv namespace create LINKORA_KV
# Copy the id to wrangler.toml

# Set admin token
wrangler secret put ADMIN_TOKEN
```

### Deploy

```bash
# Apply migrations to remote D1
npm run db:migrate:remote

# Deploy Worker
npm run deploy:worker

# Build Admin frontend (deploy to Cloudflare Pages or any static host)
npm run build:admin
# Output: apps/admin/dist/
```

## API Overview

All management endpoints require `Authorization: Bearer <ADMIN_TOKEN>`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/:slug` | Redirect to long URL |
| POST | `/api/auth/login` | Validate token |
| GET | `/api/auth/me` | Get current user info |
| GET | `/api/links` | List links (search, filter, paginate) |
| POST | `/api/links` | Create link |
| GET | `/api/links/:id` | Get link details |
| PUT | `/api/links/:id` | Update link |
| DELETE | `/api/links/:id` | Delete link |
| POST | `/api/links/:id/disable` | Disable link |
| POST | `/api/links/:id/enable` | Enable link |
| GET | `/api/tags` | List tags |
| POST | `/api/tags` | Create tag |
| PUT | `/api/tags/:id` | Update tag |
| DELETE | `/api/tags/:id` | Delete tag |
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |
| POST | `/api/import/preview` | Preview import file |
| POST | `/api/import/confirm` | Confirm import |
| GET | `/api/export/links.csv` | Export links as CSV |
| GET | `/api/export/links.json` | Export links as JSON |
| GET | `/api/export/backup.json` | Full backup |
| GET | `/api/overview` | Dashboard stats |

See [docs/API.md](docs/API.md) for full details.

## Documentation

- [Deployment Guide](docs/DEPLOYMENT.md)
- [Shlink Import Guide](docs/IMPORT_SHLINK.md)
- [Import Adapters](docs/IMPORT_ADAPTERS.md)
- [Migration from Shlink](docs/MIGRATION_FROM_SHLINK.md)
- [Backup & Restore](docs/BACKUP_AND_RESTORE.md)
- [API Reference](docs/API.md)
- [Roadmap](docs/ROADMAP.md)
- [Security](docs/SECURITY.md)

## Roadmap

- **V1** (current): Stable Shlink replacement - redirect, admin, import, export, basic stats
- **V2**: Batch operations, link expiry, password protection, QR codes, more import adapters
- **V3**: Advanced analytics, auto-backup to R2, API tokens, webhooks, multi-domain
- **V4**: Geo/device redirect rules, A/B testing, AI features, campaign management

See [docs/ROADMAP.md](docs/ROADMAP.md) for details.

## License

MIT

# Linkora Development Guide

This guide covers local setup, architecture decisions, and conventions for contributing to Linkora.

---

## Prerequisites

| Tool       | Version    |
|------------|------------|
| Node.js    | 20+        |
| npm        | 10+        |
| Wrangler   | 3+         |
| TypeScript | 5.4+       |

Install Wrangler globally:

```bash
npm install -g wrangler
wrangler login
```

---

## Monorepo Structure

```
linkora/
├── apps/
│   ├── worker/          # Cloudflare Worker (backend)
│   │   ├── src/
│   │   │   ├── index.ts          # Entry point, routes
│   │   │   ├── auth/             # Bearer token auth
│   │   │   ├── cache/            # KV operations
│   │   │   ├── db/               # D1 query functions
│   │   │   ├── analytics/        # Visit tracking
│   │   │   ├── importers/        # Import adapters
│   │   │   ├── routes/           # API route handlers
│   │   │   └── utils/            # id, response helpers
│   │   ├── wrangler.toml
│   │   └── package.json
│   │
│   └── admin/           # React admin panel (frontend)
│       ├── src/
│       │   ├── App.tsx           # Root component + routing
│       │   ├── main.tsx          # React entry point
│       │   ├── api/              # API client functions
│       │   ├── components/       # Shared UI components
│       │   │   └── ui/           # Button, Input, Modal, Toast…
│       │   ├── contexts/         # AuthContext
│       │   └── pages/            # Page components
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   └── shared/          # Shared types + validators
│       └── src/
│           ├── types/index.ts
│           └── validators/index.ts
│
├── migrations/
│   └── 0001_init.sql    # Full D1 schema (V1–V4 tables)
│
├── docs/                # Extended docs
├── AGENTS.md            # AI agent instructions
├── PROGRESS.md          # Build status
├── TASKS.md             # Active task list
└── CHANGELOG.md         # Version history
```

---

## Quick Start

```bash
# 1. Install all dependencies
npm install

# 2. Create local dev vars for the Worker
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
#    Edit .dev.vars and set:  ADMIN_TOKEN=any-secret-value

# 3. Run DB migrations locally
wrangler d1 execute linkora-db --local --file=migrations/0001_init.sql

# 4. Start Worker
npm run dev --workspace=apps/worker    # http://localhost:8787

# 5. Start Admin (in a separate terminal)
npm run dev --workspace=apps/admin     # http://localhost:5173
#    Admin proxies /api/* to :8787 via vite.config.ts
```

---

## Architecture

### Redirect Flow

```
GET /:slug
  → check KV  linkora:slug:<domain>:<slug>
    → HIT  → 301/302 redirect
    → MISS → query D1 links table
        → found active → write KV → redirect
        → found disabled → return disabled HTML
        → not found → return 404 HTML
  → ctx.waitUntil() → record visit (async, never blocks redirect)
```

**Key rule:** `ctx.waitUntil()` must wrap ALL analytics writes. A failed DB insert for a visit must never propagate to the redirect response.

### KV Key Format

```
linkora:slug:<domain>:<slug>
```

`<domain>` is the hostname from the request (e.g., `go.y8o.de`). For local dev it will be `localhost`.

### API Auth

V1 uses a single `ADMIN_TOKEN` compared against `Authorization: Bearer <token>`.

All `/api/*` routes pass through `src/auth/index.ts`. The token is never stored — only compared at request time.

---

## Backend Conventions

### Database (`apps/worker/src/db/index.ts`)

- All D1 SQL lives here. Route handlers call these functions only — **no inline SQL in routes**.
- Function naming: `getLink`, `listLinks`, `createLink`, `updateLink`, `deleteLink`, etc.

### Cache (`apps/worker/src/cache/index.ts`)

- All KV reads/writes live here.
- Functions: `getCachedLink`, `setCachedLink`, `deleteCachedLink`.
- TTL: 86400 seconds (24 h) by default.

### Responses (`apps/worker/src/utils/response.ts`)

- `jsonOk(data)` — `{ success: true, data }`
- `jsonError(msg, status)` — `{ success: false, error: msg }`
- `htmlNotFound()` — 404 HTML page
- `htmlDisabled()` — disabled link HTML page

### ID Generation (`apps/worker/src/utils/id.ts`)

- `generateId()` — returns a random 12-char ID
- `generateSlug()` — returns a random 6-char slug

---

## Frontend Conventions

### API Calls (`apps/admin/src/api/`)

Never `fetch()` directly from pages. Use the typed wrappers:

```ts
import { listLinks } from '../api/links';
const result = await listLinks({ page: 1, pageSize: 20 });
```

### Components (`apps/admin/src/components/ui/`)

Reuse existing components before creating new ones:

| Component      | Usage                                  |
|---------------|----------------------------------------|
| `Button`       | All buttons                            |
| `Input`        | Text inputs                            |
| `Select`       | Dropdowns (wraps `<select>`)           |
| `Textarea`     | Multi-line inputs                      |
| `Modal`        | Overlay dialogs                        |
| `ConfirmDialog`| Destructive action confirmation        |
| `Badge`        | Colored labels                         |
| `StatusBadge`  | Link status (active/disabled/archived) |
| `Toast`        | Transient notifications (useToast)     |

### Auth State

Use `useAuth()` from `src/contexts/AuthContext.tsx`:

```ts
const { authenticated, login, logout } = useAuth();
```

Token is stored in `localStorage` under key `linkora_token`.

---

## Import System

Importers live in `apps/worker/src/importers/` and implement `ImportAdapter` from `packages/shared`:

```ts
interface ImportAdapter {
  source: string;
  detect(input: unknown): boolean;
  parse(input: unknown): Promise<NormalizedImportItem[]>;
  validate(item: NormalizedImportItem): ImportValidationResult;
}
```

**Import rules (V1):**
- Slug conflicts → skip (never overwrite)
- Invalid URLs → skip + report as failed
- Original `shortCode` preserved as slug

---

## Database Migrations

The full schema (V1–V4 tables) is in `migrations/0001_init.sql`. **Do not edit existing migrations.** Add new numbered migration files if schema changes are needed.

```bash
# Apply locally
wrangler d1 execute linkora-db --local --file=migrations/0001_init.sql

# Apply to production
wrangler d1 execute linkora-db --file=migrations/0001_init.sql
```

---

## Common Commands

```bash
# Install everything
npm install

# Worker dev
npm run dev --workspace=apps/worker

# Admin dev
npm run dev --workspace=apps/admin

# Build admin for production
npm run build --workspace=apps/admin

# Type-check all packages
npm run build

# Deploy worker
npm run deploy --workspace=apps/worker

# Wrangler: apply migration to production
wrangler d1 execute linkora-db --file=migrations/0001_init.sql
```

---

## Security Notes

- `ADMIN_TOKEN` must be set in `.dev.vars` locally and via `wrangler secret` in production
- Never commit `.dev.vars` — it is in `.gitignore`
- The `.env.example` and `.dev.vars.example` files show required variables (no real values)
- `long_url` validation rejects `javascript:` and `data:` schemes
- Slug validation: `[a-zA-Z0-9_-]` only; reserved paths blocked

---

## Adding a New Page (Admin)

1. Create `apps/admin/src/pages/MyPage.tsx`
2. Add API functions in `apps/admin/src/api/` if needed
3. Register the route in `apps/admin/src/App.tsx`
4. Add a sidebar link in `apps/admin/src/components/Sidebar.tsx`

---

## Adding a New API Route (Worker)

1. Add DB functions to `apps/worker/src/db/index.ts`
2. Create/update `apps/worker/src/routes/<resource>.ts`
3. Register the route in `apps/worker/src/index.ts`
4. Update the API client in `apps/admin/src/api/<resource>.ts`

---

## Questions?

Check `AGENTS.md` for AI-specific constraints or `PROGRESS.md` for current build status.

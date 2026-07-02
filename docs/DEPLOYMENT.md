# Deployment Guide

## Prerequisites

- Node.js >= 18
- Cloudflare account with:
  - Workers (free or paid plan)
  - D1 database
  - KV namespace
- Custom domain pointed to Cloudflare (optional)

## 1. Create Cloudflare Resources

### D1 Database

```bash
cd apps/worker
npx wrangler d1 create linkora-db
```

Copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "linkora-db"
database_id = "YOUR_ACTUAL_DATABASE_ID"
```

### KV Namespace

```bash
npx wrangler kv namespace create LINKORA_KV
```

Copy the `id` from the output and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "KV"
id = "YOUR_ACTUAL_KV_ID"
```

For local development, also create a preview namespace:

```bash
npx wrangler kv namespace create LINKORA_KV --preview
```

## 2. Configure Secrets

```bash
# Set admin authentication token
npx wrangler secret put ADMIN_TOKEN
# Enter a strong random token when prompted
```

Save this token - you'll need it to log into the admin panel.

## 3. Apply Database Migrations

```bash
# Remote (production)
npm run db:migrate:remote

# Local (development)
npm run db:migrate:local
```

## 4. Deploy Worker

```bash
npm run deploy:worker
```

The worker will be available at `https://linkora-worker.<your-subdomain>.workers.dev`.

## 5. Custom Domain Setup

### Short Link Domain (e.g., `go.y8o.de`)

1. In Cloudflare Dashboard > Workers & Pages > linkora-worker
2. Go to Settings > Triggers > Custom Domains
3. Add your short link domain (e.g., `go.y8o.de`)

### Admin Domain (e.g., `admin.y8o.de`)

Deploy the admin frontend to Cloudflare Pages:

```bash
npm run build:admin
```

Then either:

**Option A: Cloudflare Pages**

```bash
npx wrangler pages deploy apps/admin/dist --project-name=linkora-admin
```

Add a custom domain in Pages settings.

**Option B: Any Static Hosting**

Upload the `apps/admin/dist/` folder to any static hosting provider (Netlify, Vercel, etc.).

Set the `VITE_API_URL` environment variable during build to point to your Worker:

```bash
VITE_API_URL=https://go.y8o.de npm run build:admin
```

## 6. Verify Deployment

```bash
# Health check
curl https://go.y8o.de/health

# Expected response:
# {"success":true,"data":{"status":"ok","name":"Linkora","version":"0.1.0"}}
```

Then visit your admin URL and log in with the `ADMIN_TOKEN` you set.

## Environment Summary

| Resource | Purpose | Configuration |
|----------|---------|--------------|
| D1 `linkora-db` | Primary database | `wrangler.toml` → `database_id` |
| KV `LINKORA_KV` | Slug→URL cache (24h TTL) | `wrangler.toml` → `id` |
| Secret `ADMIN_TOKEN` | Admin API auth | `wrangler secret put` |
| Worker `linkora-worker` | API + redirect | Custom domain for short links |
| Pages/Static | Admin frontend | Custom domain for admin |

## Local Development

```bash
# Install all dependencies
npm install

# Start worker (port 8787)
npm run dev:worker

# Start admin frontend (port 5173, proxies /api → localhost:8787)
npm run dev:admin
```

The Vite dev server proxies `/api` requests to the Worker automatically.

## Updating

```bash
git pull
npm install

# Apply any new migrations
npm run db:migrate:remote

# Redeploy
npm run deploy:worker
npm run build:admin
# Re-deploy admin static files
```

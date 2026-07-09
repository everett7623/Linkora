# Linkora Cloudflare Deployment Guide

This guide deploys Linkora as a self-hosted short link system on Cloudflare.

Linkora uses two public domains:

| Domain type | Purpose | Example |
|-------------|---------|---------|
| Admin domain | React admin panel | `admin.example.com` |
| Short/API domain | Short-link redirects and `/api/*` | `go.example.com` or `s.example.com` |

Do not hard-code these example domains for another deployment. Replace them with your own domains.

---

## 1. Prerequisites

- Node.js 24 recommended
- npm 10+
- A Cloudflare account
- A domain managed by Cloudflare DNS
- Wrangler login completed:

```bash
npx wrangler login
```

Install dependencies:

```bash
npm install
```

---

## 2. Choose Domains

Pick two hostnames:

```txt
Admin domain:     admin.example.com
Short/API domain: go.example.com
```

The short/API domain is the domain users will share, for example:

```txt
https://go.example.com/my-link
```

The Admin frontend calls the Worker API through the same short/API domain:

```txt
https://go.example.com/api/*
```

For a Shlink migration, use a temporary short/API domain first, then switch the old Shlink domain after testing:

```txt
Temporary test domain: go.example.com
Old Shlink domain:     s.example.com
Final short domain:    s.example.com
```

---

## 3. Create Cloudflare D1

Create the database:

```bash
npx wrangler d1 create linkora-db
```

Copy the returned `database_id` into `apps/worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "linkora-db"
database_id = "<your-d1-database-id>"
migrations_dir = "../../migrations"
```

Apply all production migrations:

```bash
npm run db:migrate:remote --workspace=apps/worker
```

D1 is the source of truth for links, visits, settings, import jobs, tags, and analytics records.

---

## 4. Create Cloudflare KV

Create the production KV namespace:

```bash
npx wrangler kv namespace create KV
```

Create the preview namespace:

```bash
npx wrangler kv namespace create KV --preview
```

Copy both IDs into `apps/worker/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "KV"
id = "<your-kv-namespace-id>"
preview_id = "<your-kv-preview-id>"
```

KV is cache only. D1 remains the source of truth.

---

## 5. Create Cloudflare R2 Backup Buckets

Create the production and preview buckets used by the `BACKUPS` binding:

```bash
npx wrangler r2 bucket create linkora-backups
npx wrangler r2 bucket create linkora-backups-dev
```

R2 stores scheduled and manually created `backup.json` snapshots. D1 remains the source of truth.

---

## 6. Create Cloudflare Queue

Create the queue used for asynchronous visit statistics:

```bash
npx wrangler queues create linkora-visits --message-retention-period-secs 60
```

If the queue binding is unavailable, the Worker falls back to the current `ctx.waitUntil()` D1 write path so redirects remain stable.

---

## 7. Configure Worker

Edit `apps/worker/wrangler.toml`:

```toml
name = "linkora-worker"
main = "src/index.ts"
compatibility_date = "2024-07-01"
compatibility_flags = ["nodejs_compat"]

routes = [
  { pattern = "go.example.com", custom_domain = true }
]

[vars]
LINKORA_VERSION = "0.7.1"

[[d1_databases]]
binding = "DB"
database_name = "linkora-db"
database_id = "<your-d1-database-id>"
migrations_dir = "../../migrations"

[[kv_namespaces]]
binding = "KV"
id = "<your-kv-namespace-id>"
preview_id = "<your-kv-preview-id>"

[[r2_buckets]]
binding = "BACKUPS"
bucket_name = "linkora-backups"
preview_bucket_name = "linkora-backups-dev"

[[queues.producers]]
binding = "VISITS_QUEUE"
queue = "linkora-visits"

[[queues.consumers]]
queue = "linkora-visits"
max_batch_size = 10
max_batch_timeout = 5

[triggers]
crons = ["0 18 * * *"]
```

Replace `go.example.com` with your short/API domain.

Set the production admin token:

```bash
npx wrangler secret put ADMIN_TOKEN --cwd apps/worker
```

Use a long random value. Never commit real secrets.

Deploy the Worker:

```bash
npm run deploy --workspace=apps/worker
```

Verify:

```bash
curl https://go.example.com/health
```

Expected response:

```json
{"success":true,"data":{"status":"ok","name":"Linkora","version":"0.7.1"}}
```

---

## 8. Configure DNS for Short/API Domain

If you use a Worker custom domain route, Cloudflare will attach the Worker to the hostname.

In Cloudflare Dashboard:

1. Open **Workers & Pages**
2. Select `linkora-worker`
3. Add the custom domain, for example `go.example.com`
4. Confirm the domain is active

The Worker should answer both redirects and API routes:

```txt
https://go.example.com/health
https://go.example.com/api/auth/login
https://go.example.com/<slug>
```

---

## 9. Build Admin Frontend

The Admin frontend needs the short/API domain at build time:

```bash
$env:VITE_API_URL="https://go.example.com"
npm run build --workspace=apps/admin
```

On macOS/Linux:

```bash
VITE_API_URL=https://go.example.com npm run build --workspace=apps/admin
```

If Admin and Worker are on the same origin, `VITE_API_URL` can be empty. For the recommended two-domain setup, set it to the short/API domain.

---

## 10. Deploy Admin to Cloudflare Pages

Create a Pages project and deploy `apps/admin/dist`:

```bash
npx wrangler pages project create linkora-admin --production-branch main
npx wrangler pages deploy apps/admin/dist --project-name linkora-admin
```

Add the custom admin domain:

```txt
admin.example.com
```

In Cloudflare Dashboard:

1. Open **Workers & Pages**
2. Select the `linkora-admin` Pages project
3. Open **Custom domains**
4. Add `admin.example.com`
5. Add the required DNS record if Cloudflare asks for it
6. Wait until the domain status is active

Open:

```txt
https://admin.example.com
```

Log in with `ADMIN_TOKEN`.

---

## 11. Configure Linkora Settings

In the Admin panel, open **Settings**.

Set:

| Setting | Value |
|---------|-------|
| Site Name | `Linkora` or your own name |
| Default Domain | `go.example.com` |
| Default Redirect Type | `302` |

`Default Domain` is used by the Admin UI to copy/open short links. It does not overwrite imported `short_url` values in the database.

For a Shlink migration:

1. During testing, set `Default Domain` to the temporary domain, for example `go.example.com`
2. After final cutover, change it to the real short domain, for example `s.example.com`

---

## 12. Required Environment Values

### Worker Secrets

| Name | Where | Example |
|------|-------|---------|
| `ADMIN_TOKEN` | `wrangler secret put ADMIN_TOKEN --cwd apps/worker` | long random string |

### Worker Variables

Defined in `apps/worker/wrangler.toml`:

| Name | Example |
|------|---------|
| `LINKORA_VERSION` | `0.7.1` |

### Worker Bindings

Defined in `apps/worker/wrangler.toml`:

| Binding | Cloudflare product | Purpose |
|---------|--------------------|---------|
| `DB` | D1 | Source of truth |
| `KV` | KV | Redirect cache |
| `BACKUPS` | R2 | Backup snapshot storage |
| `VISITS_QUEUE` | Queues | Asynchronous visit statistics |

### Admin Build Variable

| Name | Where | Example |
|------|-------|---------|
| `VITE_API_URL` | Build env / Pages env | `https://go.example.com` |

### GitHub Actions Secrets And Variables

The `.github/workflows/deploy.yml` workflow always installs dependencies, type-checks the Worker, and builds Admin on pushes to `main`.

It applies D1 migrations and deploys the Worker only when these repository secrets are configured:

| Name | Purpose |
|------|---------|
| `CLOUDFLARE_API_TOKEN` | Authenticates Wrangler in GitHub Actions |
| `CLOUDFLARE_ACCOUNT_ID` | Selects the Cloudflare account for Worker and Pages deploys |

It deploys Admin only when the Cloudflare secrets and these repository variables are configured:

| Name | Example | Purpose |
|------|---------|---------|
| `LINKORA_API_URL` | `https://go.example.com` | Builds Admin with the Worker short/API origin |
| `LINKORA_PAGES_PROJECT` | `linkora-admin` | Selects the Cloudflare Pages project |
| `LINKORA_WORKER_NAME` | `linkora-worker` | Generates the Worker config name |
| `LINKORA_SHORT_DOMAIN` | `go.example.com` | Generates the Worker custom domain route |
| `LINKORA_D1_DATABASE_NAME` | `linkora-db` | Generates the D1 binding database name |
| `LINKORA_D1_DATABASE_ID` | `<id>` | Generates the D1 binding database ID |
| `LINKORA_KV_NAMESPACE_ID` | `<id>` | Generates the production KV binding ID |
| `LINKORA_KV_PREVIEW_ID` | `<id>` | Generates the preview KV binding ID |
| `LINKORA_R2_BUCKET` | `linkora-backups` | Generates the R2 backup bucket binding |
| `LINKORA_R2_PREVIEW_BUCKET` | `linkora-backups-dev` | Generates the preview R2 bucket binding |
| `LINKORA_VISITS_QUEUE` | `linkora-visits` | Generates queue producer and consumer bindings |

If either Cloudflare secret is missing, the workflow skips all Cloudflare migration/deploy steps and leaves manual Wrangler deployment as the source of production updates.
If either Admin variable is missing, the workflow still builds Admin but skips the Pages deploy so it does not publish a build with the wrong API URL.
If any Worker config variable is missing, the workflow skips Worker deploy instead of relying on a committed production `wrangler.toml`.

---

## 13. Production Smoke Test

Run these checks after deployment:

```bash
curl https://go.example.com/health
```

Create a link in Admin:

```txt
slug: test
destination: https://example.com
```

Open:

```txt
https://go.example.com/test
```

Expected:

```txt
302 redirect to https://example.com
```

Check auth rejection:

```bash
curl https://go.example.com/api/auth/me
```

Expected:

```txt
401 Unauthorized
```

Check Admin:

```txt
https://admin.example.com
```

Login with `ADMIN_TOKEN`, then verify:

- Links list loads
- Create/Edit link works
- Copy/Open short link uses the configured short domain
- Import preview reports conflicts instead of overwriting slugs
- Export downloads a valid file
- Backups page can create or list R2 backup records

---

## 14. Shlink Cutover Checklist

Use this when moving an existing Shlink domain to Linkora.

Before cutover:

- Deploy Linkora to a temporary short/API domain, for example `go.example.com`
- Import Shlink links
- Verify important slugs on the temporary domain
- Keep Shlink running
- Revoke or rotate the Shlink API key used for migration

Cutover:

- Add the old Shlink domain to the Worker route/custom domain
- Change DNS from Shlink to Cloudflare Worker if needed
- Update Admin **Settings → Default Domain** to the old Shlink domain
- Test several high-traffic slugs

Rollback:

- Point the old domain back to Shlink
- Keep Linkora data intact

Do not delete Shlink immediately. Keep it available for rollback during the first days after cutover.

# Self-Hosting Linkora

This guide is for people who fork or clone Linkora and want to deploy it to their own Cloudflare account.

Linkora is free and open source first. The recommended basic setup requires one custom hostname:

| Hostname | Purpose | Example |
|----------|---------|---------|
| Worker domain | Short-link redirects and `/api/*` | `go.example.com` |
| Admin URL | React Admin on the default Pages hostname | `linkora-admin.pages.dev` |

Advanced deployments can add `admin.example.com` for a branded Admin, or split `go.example.com` and `s.example.com` when migrations or API isolation require separate Worker domains.

Use your own domains everywhere below. Do not copy another deployment's domains, resource IDs, or secrets.

## 1. Prerequisites

- Node.js 24 recommended
- npm 10+
- A Cloudflare account
- A domain managed by Cloudflare DNS
- Wrangler login completed

```bash
npx wrangler login
npm install
```

## 2. Choose Names

Pick values before creating resources:

```txt
Worker name:       linkora-worker
D1 database:       linkora-db
KV namespace:      KV
Pages project:     linkora-admin
Worker domain:     go.example.com
Admin URL:         linkora-admin.pages.dev
```

Advanced optional names include the `linkora-backups` R2 buckets, `linkora-visits` Queue, a branded Admin domain, and a separate public short-link domain.

For the easiest first deployment, keep the resource names above. You can rename them, but then you must update `apps/worker/wrangler.toml`, GitHub repository variables, and any direct Wrangler commands that include the resource name.

When optional advanced bindings are enabled, keep their binding names unchanged:

```txt
DB
KV
BACKUPS
VISITS_QUEUE
```

## 3. Create Cloudflare Resources

Create D1:

```bash
npx wrangler d1 create linkora-db
```

Create KV:

```bash
npx wrangler kv namespace create KV
npx wrangler kv namespace create KV --preview
```

Advanced optional: create R2 buckets for scheduled backups and one-click restore:

```bash
npx wrangler r2 bucket create linkora-backups
npx wrangler r2 bucket create linkora-backups-dev
```

Advanced optional: create the visit queue for asynchronous analytics:

```bash
npx wrangler queues create linkora-visits --message-retention-period-secs 60
```

## 4. Configure the Worker

Copy the template. If `apps/worker/wrangler.toml` already exists from another deployment, replace it with your own values before deploying.

```bash
cp -f apps/worker/wrangler.toml.example apps/worker/wrangler.toml
```

On Windows PowerShell:

```powershell
Copy-Item apps/worker/wrangler.toml.example apps/worker/wrangler.toml -Force
```

Edit `apps/worker/wrangler.toml` and replace:

| Placeholder | Value |
|-------------|-------|
| `<your-short-domain>` | Your short-link and API hostname, for example `go.example.com` |
| `<your-d1-database-id>` | The `database_id` returned by `wrangler d1 create` |
| `<your-kv-namespace-id>` | The production KV namespace ID |
| `<your-kv-preview-id>` | The preview KV namespace ID |

Set the production admin token:

```bash
cd apps/worker
npx wrangler secret put ADMIN_TOKEN
cd ../..
```

Use a long random value. Do not commit `.dev.vars` or real secrets.
Do not deploy with someone else's Cloudflare resource IDs.

## 5. Apply D1 Migrations

```bash
npm run db:migrate:remote --workspace=apps/worker
```

If you renamed the D1 database, run the Wrangler command directly with your database name:

```bash
cd apps/worker
npx wrangler d1 migrations apply <your-d1-database-name> --remote
cd ../..
```

For local development:

```bash
npm run db:migrate:local --workspace=apps/worker
```

## 6. Deploy the Worker

```bash
npm run type-check --workspace=apps/worker
npm run deploy --workspace=apps/worker
```

Check the Worker:

```bash
curl https://go.example.com/health
```

Expected shape:

```json
{"success":true,"data":{"status":"ok","name":"Linkora","version":"0.8.5"}}
```

## 7. Build and Deploy Admin

Build Admin with your stable API domain:

```bash
VITE_API_URL=https://go.example.com npm run build --workspace=apps/admin
```

On Windows PowerShell:

```powershell
$env:VITE_API_URL="https://go.example.com"
npm run build --workspace=apps/admin
```

Create and deploy a Cloudflare Pages project:

```bash
npx wrangler pages project create linkora-admin --production-branch main
npx wrangler pages deploy apps/admin/dist --project-name linkora-admin --branch main
```

Add your admin custom domain, for example `admin.example.com`, in the Cloudflare Pages project settings.

## 8. GitHub Actions Auto Deploy

The included workflow can apply D1 migrations and deploy on pushes to `main`.

Add repository secrets:

```txt
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Add repository variables:

```txt
LINKORA_API_URL=https://go.example.com
LINKORA_PAGES_PROJECT=linkora-admin
LINKORA_WORKER_NAME=linkora-worker
LINKORA_SHORT_DOMAIN=go.example.com
LINKORA_D1_DATABASE_NAME=linkora-db
LINKORA_D1_DATABASE_ID=<your-d1-database-id>
LINKORA_KV_NAMESPACE_ID=<your-kv-namespace-id>
LINKORA_KV_PREVIEW_ID=<your-kv-preview-id>
```

Optional variables:

```txt
LINKORA_VERSION=0.8.5
LINKORA_COMPATIBILITY_DATE=2026-07-08
LINKORA_WORKER_DOMAINS=go.example.com,s.example.com
LINKORA_R2_BUCKET=linkora-backups
LINKORA_R2_PREVIEW_BUCKET=linkora-backups-dev
LINKORA_VISITS_QUEUE=linkora-visits
```

`LINKORA_WORKER_DOMAINS` replaces the single-domain fallback when set. Configure both R2 variables together. Queue and R2 are independent advanced capabilities; leaving them unset no longer blocks the basic Worker deployment.

The workflow still type-checks and builds when Cloudflare secrets are missing, but Cloudflare migration and deployment are skipped. Worker deployment uses these variables to generate `apps/worker/wrangler.toml` during CI, so your Cloudflare resource IDs do not need to be committed.

## 9. First Login

Open your Admin domain:

```txt
https://admin.example.com
```

Log in with `ADMIN_TOKEN`, then open Settings and set:

| Setting | Value |
|---------|-------|
| Site Name | Your project name |
| Default Domain | `s.example.com` |
| Default Redirect Type | `302` |

Then open **Setup** in the sidebar. It summarizes whether the Admin can reach the API, whether a default short domain is configured, whether the domain catalog has an active default, whether R2 backups are available, and whether the first link has been created.

The Admin starts in **Simple mode**. Switch to **Advanced mode** from the sidebar or Settings to reveal Analytics, Domains, Redirect Rules, R2 Backups, API Tokens, Audit Logs, and other operator tools. This interface switch does not create Cloudflare resources.

## 10. Smoke Test

Run these after every first deployment:

```bash
curl https://go.example.com/health
curl -i https://go.example.com/api/auth/me
```

Expected:

- `/health` returns `success: true` and `status: ok`
- `/api/auth/me` returns `401` without an Authorization header

Then use Admin to verify:

- Create a link with slug `test`
- Open `https://go.example.com/test`
- Confirm it redirects to the destination URL
- Disable the link and confirm it no longer redirects
- Export links as CSV or JSON
- Run an import preview and confirm slug conflicts are not overwritten
- Open Overview and confirm the dashboard counters load
- Open Analytics and confirm the selected date range loads, even if it is empty

## 11. Local Development Check

For local development from a fresh clone:

```bash
npm install
cp -f apps/worker/wrangler.toml.example apps/worker/wrangler.toml
cp -f apps/worker/.dev.vars.example apps/worker/.dev.vars
npm run db:migrate:local --workspace=apps/worker
npm run dev --workspace=apps/worker
```

In another terminal:

```bash
npm run dev --workspace=apps/admin
```

On Windows PowerShell:

```powershell
Copy-Item apps/worker/wrangler.toml.example apps/worker/wrangler.toml -Force
Copy-Item apps/worker/.dev.vars.example apps/worker/.dev.vars -Force
npm run db:migrate:local --workspace=apps/worker
npm run dev --workspace=apps/worker
```

## 12. Migration Notes

Linkora can import from Shlink, Sink, YOURLS, Dub, Linkora backup JSON, and generic CSV/JSON.

For a Shlink migration:

1. Keep Shlink running.
2. Deploy Linkora with a stable API domain like `go.example.com`.
3. Import Shlink data and verify important slugs.
4. Cut over the old short domain only after testing.
5. Keep Shlink available for rollback for 1-2 weeks.

## 13. Troubleshooting

| Issue | Check |
|-------|-------|
| Admin cannot call API | Confirm `VITE_API_URL` was set before building Admin |
| Worker cannot read D1/KV/R2 | Confirm binding names and resource IDs in `apps/worker/wrangler.toml` |
| Login fails | Confirm `ADMIN_TOKEN` was set with `wrangler secret put` |
| GitHub Actions builds but does not deploy | Confirm Cloudflare secrets are set |
| Pages deploys to the wrong project | Confirm `LINKORA_PAGES_PROJECT` repository variable |
| Short links use the wrong copied domain | Update Admin Settings -> Default Domain |
| Local Worker starts without bindings | Confirm `apps/worker/wrangler.toml` was copied from the example |

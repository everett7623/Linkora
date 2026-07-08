# Linkora Deployment

This document is the short deployment checklist.

For a fresh self-hosted install, use [SELF_HOSTING.md](SELF_HOSTING.md). It is the recommended public guide for people deploying Linkora to their own Cloudflare account.

The longer maintainer production runbook is in [../DEPLOYMENT.md](../DEPLOYMENT.md).

## Targets

Choose your own hostnames:

- Worker/API and short links: `go.example.com`
- Admin frontend: `admin.example.com`
- Optional migration cutover target: your old Shlink/Sink/YOURLS/Dub short domain

Do not cut over an existing production short domain until imported links have been tested on a temporary Linkora short/API domain.

## Worker

```bash
npm install
npx wrangler d1 create linkora-db
npx wrangler kv namespace create KV
npx wrangler kv namespace create KV --preview
npx wrangler r2 bucket create linkora-backups
npx wrangler r2 bucket create linkora-backups-dev
npx wrangler queues create linkora-visits --message-retention-period-secs 60
cp -f apps/worker/wrangler.toml.example apps/worker/wrangler.toml
# Edit apps/worker/wrangler.toml with your domain and Cloudflare resource IDs.
npm run type-check --workspace=apps/worker
npm run db:migrate:remote --workspace=apps/worker
npm run deploy --workspace=apps/worker
```

Production secrets must be set with Wrangler:

```bash
wrangler secret put ADMIN_TOKEN
```

Never commit `.dev.vars` or real tokens.

## Admin

Build the Admin with the Worker domain as API base:

```bash
VITE_API_URL=https://go.example.com npm run build --workspace=apps/admin
```

Deploy `apps/admin/dist` to Cloudflare Pages or another static host.

## GitHub Auto Deploy

The repository includes `.github/workflows/deploy.yml`. On every push to `main`, GitHub Actions will:

1. install dependencies
2. type-check the Worker
3. build Admin with `VITE_API_URL` from the `LINKORA_API_URL` repository variable
4. deploy the Worker, only when Cloudflare repository secrets are configured
5. deploy Admin to the Pages project named by `LINKORA_PAGES_PROJECT`, only when Cloudflare repository secrets and variables are configured

Add these GitHub repository secrets before relying on automatic deployment:

```txt
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Add these GitHub repository variables:

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

The Cloudflare API token needs Workers, D1, KV, R2, Queues, and Pages deployment permissions for the account that owns Linkora.

If either secret is missing, the workflow intentionally skips Cloudflare deployment after the type-check and Admin build pass. Use manual Wrangler deploys until the secrets are configured.
If an Admin variable is missing, the workflow still builds Admin but skips the Pages deploy so it does not publish a build with the wrong API URL.
If a Worker variable is missing, the workflow skips Worker deploy rather than relying on a committed production `wrangler.toml`.

## Smoke Checks

- `GET https://go.example.com/health` returns `status: ok`
- Admin rejects unauthenticated API requests
- Link create/edit/delete works through Admin
- Active short links redirect
- Disabled links show the disabled page
- Export downloads valid files
- Import preview reports conflicts without overwriting existing slugs

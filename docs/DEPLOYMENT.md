# Linketry Deployment

This document is the short deployment checklist.

For a fresh self-hosted install, use [SELF_HOSTING.md](SELF_HOSTING.md). Installations older than 0.10 must use [UPGRADING_PRE_0_10.md](UPGRADING_PRE_0_10.md) and retain their current binding IDs until migration is verified.

The longer maintainer production runbook is in [../DEPLOYMENT.md](../DEPLOYMENT.md).

## Targets

Basic profile:

- Short links and Worker API: `go.example.com`
- Admin frontend: `linketry-admin.pages.dev`

Advanced optional hostnames:

- Branded Admin: `admin.example.com`
- Separate public short links: `s.example.com`
- Migration cutover target: your old Shlink/Sink/YOURLS/Dub short domain

Do not cut over an existing production short domain until imported links have been tested while the stable Linketry API domain remains reachable.

## Worker

```bash
npm install
npx wrangler d1 create linketry
npx wrangler kv namespace create KV
npx wrangler kv namespace create KV --preview
cp -f apps/worker/wrangler.toml.example apps/worker/wrangler.toml
# Edit apps/worker/wrangler.toml with your domain and Cloudflare resource IDs.
npm run type-check --workspace=apps/worker
npm run db:migrate:remote --workspace=apps/worker
npm run deploy --workspace=apps/worker
```

Production secrets must be set with Wrangler:

```bash
wrangler secret put LINKETRY_ADMIN_TOKEN
```

Never commit `.dev.vars` or real tokens.

## Admin

Build the Admin with the Worker domain as API base:

```bash
VITE_LINKETRY_API_URL=https://go.example.com npm run build --workspace=apps/admin
```

Deploy `apps/admin/dist` to Cloudflare Pages or another static host.

## GitHub Auto Deploy

The repository includes `.github/workflows/deploy.yml`. On every push to `main`, GitHub Actions will:

1. install dependencies
2. type-check the Worker
3. build Admin with `VITE_LINKETRY_API_URL` from the `LINKETRY_API_URL` repository variable
4. deploy the Worker, only when Cloudflare repository secrets are configured
5. deploy Admin to the Pages project named by `LINKETRY_PAGES_PROJECT`, only when Cloudflare repository secrets and variables are configured

Add these GitHub repository secrets before relying on automatic deployment:

```txt
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Add these GitHub repository variables:

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

Optional advanced variables: `LINKETRY_WORKER_DOMAINS`, `LINKETRY_R2_BUCKET`, `LINKETRY_R2_PREVIEW_BUCKET`, and `LINKETRY_VISITS_QUEUE`.

The basic Cloudflare API token needs Workers, D1, KV, and Pages deployment permissions. Add R2 and Queues permissions only when those advanced resources are configured.

If either secret is missing, the workflow intentionally skips Cloudflare deployment after the type-check and Admin build pass. Use manual Wrangler deploys until the secrets are configured.
If an Admin variable is missing, the workflow still builds Admin but skips the Pages deploy so it does not publish a build with the wrong API URL.
If a Worker variable is missing, the workflow skips Worker deploy rather than relying on a committed production `wrangler.toml`. `LINKETRY_SHORT_DOMAIN` remains supported as a legacy single-domain fallback when `LINKETRY_WORKER_DOMAINS` is not set.

## Smoke Checks

- `GET https://go.example.com/health` returns `status: ok`
- Admin rejects unauthenticated API requests
- Link create/edit/delete works through Admin
- Active short links redirect
- Disabled links show the disabled page
- Export downloads valid files
- Import preview reports conflicts without overwriting existing slugs

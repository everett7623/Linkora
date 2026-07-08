# Linkora Deployment

This document is the short deployment checklist. The longer production runbook is in
[../DEPLOYMENT.md](../DEPLOYMENT.md).

## Targets

- Worker/API and short links: `go.y8o.de`
- Admin frontend: `admin.y8o.de`
- Future cutover target: `s.y8o.de`

Do not cut over `s.y8o.de` until imported links have been tested on `go.y8o.de`.

## Worker

```bash
npm install
npx wrangler r2 bucket create linkora-backups
npx wrangler r2 bucket create linkora-backups-dev
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
VITE_API_URL=https://go.y8o.de npm run build --workspace=apps/admin
```

Deploy `apps/admin/dist` to Cloudflare Pages or another static host.

## GitHub Auto Deploy

The repository includes `.github/workflows/deploy.yml`. On every push to `main`, GitHub Actions will:

1. install dependencies
2. type-check the Worker
3. build Admin with `VITE_API_URL=https://go.y8o.de`
4. deploy the Worker
5. deploy Admin to the `linkora-admin` Cloudflare Pages project

Add these GitHub repository secrets before relying on automatic deployment:

```txt
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

The Cloudflare API token needs Workers, D1, KV, R2, and Pages deployment permissions for the account that owns Linkora.

## Smoke Checks

- `GET https://go.y8o.de/health` returns `status: ok`
- Admin rejects unauthenticated API requests
- Link create/edit/delete works through Admin
- Active short links redirect
- Disabled links show the disabled page
- Export downloads valid files
- Import preview reports conflicts without overwriting existing slugs

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
npm run deploy:bootstrap -- --prefix linketry-alice --domain go.example.com --account-id <your-cloudflare-account-id>
# Review the plan, then append: --apply --confirm <phrase-from-dry-run>
cp -f apps/worker/wrangler.toml.example apps/worker/wrangler.toml
# Edit apps/worker/wrangler.toml with your domain and the bootstrap D1/KV IDs.
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

The `deploy` job is bound to the GitHub environment named `production`. Create and review that environment before the first production run so GitHub records production deployment history separately from the protected `linketry-demo` environment. Repository-level variables and secrets remain available to the job; they do not need to be copied merely to enable deployment tracking.
6. optionally deploy the official project site when `LINKETRY_SITE_PROJECT` is configured

Add these GitHub repository secrets before relying on automatic deployment:

```txt
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Optional in-app upgrades use `LINKETRY_GITHUB_UPDATE_TOKEN`, a fine-grained token restricted to this repository with **Actions: write**. The workflow stores it as a Worker secret; the Admin browser never receives it. Leave it unset to retain the manual Actions upgrade flow.

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
LINKETRY_DEPLOYMENT_TRACK=fresh
LINKETRY_APPROVED_RELEASE=0.27.7
LINKETRY_APPROVED_COMMIT=<40-character-commit-sha>
LINKETRY_APPROVED_MIGRATIONS_SHA256=<output-of-npm-run-deploy:migration-digest>
LINKETRY_FRESH_INSTALL_CONFIRMED=true
LINKETRY_SITE_PROJECT=linketry-site
LINKETRY_SITE_URL=https://linketry.com
```

The workflow validates these exact approvals and the selected account/resources before any Cloudflare write. For later releases, switch the track to `upgrade` and configure the verified-backup gates in [DEPLOYMENT_PREFLIGHT.md](DEPLOYMENT_PREFLIGHT.md).

Optional advanced variables: `LINKETRY_WORKER_DOMAINS`, `LINKETRY_R2_BUCKET`, `LINKETRY_R2_PREVIEW_BUCKET`, and `LINKETRY_VISITS_QUEUE`.

The basic Cloudflare API token needs Workers, D1, KV, and Pages deployment permissions. Add R2 and Queues permissions only when those advanced resources are configured.

If either secret is missing, the workflow intentionally skips Cloudflare deployment after the type-check and Admin build pass. Use manual Wrangler deploys until the secrets are configured.
If an Admin variable is missing, the workflow still builds Admin but skips the Pages deploy so it does not publish a build with the wrong API URL.
If a Worker variable is missing, the workflow skips Worker deploy rather than relying on a committed production `wrangler.toml`. `LINKETRY_SHORT_DOMAIN` remains supported as a legacy single-domain fallback when `LINKETRY_WORKER_DOMAINS` is not set.

`LINKETRY_SITE_PROJECT` is a maintainer-only optional deployment and is not required for a self-hosted Linketry instance. Its `linketry.com` apex custom domain must be associated in the Cloudflare Pages project before DNS can serve it.

## Official Demo Deployment

The official Demo never uses the production `Deploy Linketry` workflow. Its manual-only `Deploy Isolated Linketry Demo` workflow reads credentials and variables from the protected `linketry-demo` GitHub environment, requires an exact release/commit/migration approval, and rejects every protected production account, resource, and hostname before a Cloudflare write.

The workflow expects isolated D1, KV, Worker, Admin Pages, token, and domain targets to exist already. After its fail-closed safety gate passes, it can create the explicitly named `linketry-demo-*` API Pages gateway, optional R2 buckets, and optional Queue. The API gateway is a Pages Function in the Demo account with a Service Binding to the isolated Worker; it does not bind D1, KV, R2, or Queue directly. The workflow supports the account's automatic `workers.dev` origin without treating it as a custom Worker domain, builds the same production Admin route tree with a public preview-code entry and read-only mode, rejects every mutating Admin API request, suppresses real-visitor analytics writes, applies a native per-client Worker rate limit, and idempotently refreshes synthetic D1/R2 samples plus disabled advanced-feature settings after migrations. After Pages deployment it verifies both the API gateway and the complete Admin/Worker parity contract. It can register the reviewed Pages custom domain but never edits DNS, so the `demoapi` CNAME remains an explicit owner action. See [Deployment Preflight](DEPLOYMENT_PREFLIGHT.md#official-demo) for the complete environment contract.

## Smoke Checks

- `GET https://go.example.com/health` returns `status: ok`
- Admin rejects unauthenticated API requests
- Link create/edit/delete works through Admin
- Active short links redirect
- Disabled links show the disabled page
- Export downloads valid files
- Import preview reports conflicts without overwriting existing slugs

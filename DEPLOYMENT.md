# Linketry Cloudflare Deployment Guide

This guide deploys Linketry, a self-hosted link management, analytics and monitoring platform, on Cloudflare.

This is the **fresh self-hosting** path: every new user deploys into their own Cloudflare account with newly created D1/KV resources, Worker/Pages projects, token, and domain. It must not reuse Linketry maintainer production or Demo identifiers.

An existing Linketry instance follows the separate [non-destructive upgrade guide](docs/UPGRADING_PRE_0_10.md): keep its current bindings, take and verify a backup, review pending migrations, apply only non-destructive incremental migrations, and then deploy. Never initialize, reset, seed Demo data, recreate resources, or replace domains automatically during an upgrade.

The official Linketry Demo is a third isolated environment with synthetic data and separate resources. It is never an upgrade target or a template binding source.

The recommended beginner deployment requires one custom Worker hostname; Cloudflare Pages provides the Admin URL automatically:

| Domain type   | Purpose                     | Example                    |
| ------------- | --------------------------- | -------------------------- |
| Admin URL     | React admin panel           | `linketry-admin.pages.dev` |
| Worker domain | Short links and `/api/v1/*` | `go.example.com`           |

Advanced deployments may add `admin.example.com` as a branded Admin domain or split the Worker into `go.example.com` for API access and `s.example.com` for public short links.

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

For the basic profile, pick one hostname and keep the automatic Pages URL:

```txt
Worker domain: go.example.com
Admin URL:     linketry-admin.pages.dev (automatic)
```

The Worker domain is the domain users will share, for example:

```txt
https://go.example.com/my-link
```

The Admin frontend calls the Worker API through the stable API domain:

```txt
https://go.example.com/api/v1/*
```

For a Shlink migration, optionally use the advanced split-domain profile so the API stays stable while the old short domain is cut over:

```txt
Admin domain:      admin.example.com
Stable API domain: go.example.com
Old Shlink domain: s.example.com
```

---

## 3. Create Required D1 And KV Resources

Run a read-only plan using a unique prefix and your own hostname:

```bash
npm run deploy:bootstrap -- --prefix linketry-alice --domain go.example.com --account-id <your-cloudflare-account-id>
```

Review the account suffix and names, then append the exact `--apply --confirm <phrase-from-dry-run>` value printed by the command. Apply creates only missing D1/KV resources, rereads them, and prints the required binding values.

Copy the returned D1 and KV IDs into `apps/worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "linketry-alice-db"
database_id = "<your-d1-database-id>"
migrations_dir = "../../migrations"
```

The required KV binding is:

```toml
[[kv_namespaces]]
binding = "KV"
id = "<your-kv-namespace-id>"
```

Apply all production migrations only after the full fresh-track preflight passes:

```bash
npm run db:migrate:remote --workspace=apps/worker
```

D1 is the source of truth for links, visits, settings, import jobs, tags, and analytics records.

---

KV is cache only. D1 remains the source of truth. A separate KV preview namespace is optional and can be added later.

---

## 4. Create Cloudflare R2 Backup Buckets

Create the production and preview buckets used by the `BACKUPS` binding:

```bash
npx wrangler r2 bucket create linketry-backups
npx wrangler r2 bucket create linketry-backups-dev
```

R2 stores scheduled and manually created `backup.json` snapshots. D1 remains the source of truth.

---

## 5. Create Cloudflare Queue

Create the queue used for asynchronous visit statistics:

```bash
npx wrangler queues create linketry-visits --message-retention-period-secs 60
```

If the queue binding is unavailable, the Worker falls back to the current `ctx.waitUntil()` D1 write path so redirects remain stable.

---

## 6. Configure Worker

Edit `apps/worker/wrangler.toml`:

```toml
name = "linketry-worker"
main = "src/index.ts"
compatibility_date = "2024-07-01"
compatibility_flags = ["nodejs_compat"]

routes = [
  { pattern = "go.example.com", custom_domain = true }
]

[vars]
LINKETRY_VERSION = "0.29.14"

[[d1_databases]]
binding = "DB"
database_name = "linketry"
database_id = "<your-d1-database-id>"
migrations_dir = "../../migrations"

[[kv_namespaces]]
binding = "KV"
id = "<your-kv-namespace-id>"
preview_id = "<your-kv-preview-id>"

# Add R2, Queue, Cron, or more routes only for advanced features.
```

Replace `go.example.com` with the hostname selected for short links and the Worker API.

Set the production admin token:

```bash
npx wrangler secret put LINKETRY_ADMIN_TOKEN --cwd apps/worker
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
{ "success": true, "data": { "status": "ok", "name": "Linketry", "version": "0.29.14" } }
```

---

## 7. Configure DNS for Worker Domains

If you use a Worker custom domain route, Cloudflare will attach the Worker to the hostname.

In Cloudflare Dashboard:

1. Open **Workers & Pages**
2. Select `linketry-worker`
3. Add the custom domain, for example `go.example.com`
4. Confirm the domain is active

The Worker should answer both redirects and API routes:

```txt
https://go.example.com/health
https://go.example.com/api/v1/auth/login
https://go.example.com/<slug>
```

---

## 8. Build Admin Frontend

The Admin frontend needs the stable API domain at build time:

```bash
$env:VITE_LINKETRY_API_URL="https://go.example.com"
npm run build --workspace=apps/admin
```

On macOS/Linux:

```bash
VITE_LINKETRY_API_URL=https://go.example.com npm run build --workspace=apps/admin
```

Set `VITE_LINKETRY_API_URL` to the Worker domain when Admin is hosted on Pages. It can be empty only when Admin and Worker intentionally share the same origin.

---

## 9. Deploy Admin to Cloudflare Pages

Create a Pages project and deploy `apps/admin/dist`:

```bash
npx wrangler pages project create linketry-admin --production-branch main
npx wrangler pages deploy apps/admin/dist --project-name linketry-admin
```

Open the automatic Pages URL first:

```txt
https://linketry-admin.pages.dev
```

Optional: add a branded Admin domain later in Cloudflare Dashboard:

1. Open **Workers & Pages**
2. Select the `linketry-admin` Pages project
3. Open **Custom domains**
4. Add `admin.example.com`
5. Add the required DNS record if Cloudflare asks for it
6. Wait until the domain status is active

The optional branded URL is then:

```txt
https://admin.example.com
```

Log in with `LINKETRY_ADMIN_TOKEN`.

---

## 10. Configure Linketry Settings

In the Admin panel, open **Settings**.

Set:

| Setting               | Value                       |
| --------------------- | --------------------------- |
| Site Name             | `Linketry` or your own name |
| Default Domain        | `s.example.com`             |
| Default Redirect Type | `302`                       |

`Default Domain` is used by the Admin UI to copy/open short links. It does not overwrite imported `short_url` values in the database.

For a Shlink migration:

1. Keep the Admin API on the stable API domain, for example `go.example.com`
2. Set `Default Domain` to the real short-link domain, for example `s.example.com`, before creating public links

---

## 11. Required Environment Values

### Worker Secrets

| Name                   | Where                                                        | Example            |
| ---------------------- | ------------------------------------------------------------ | ------------------ |
| `LINKETRY_ADMIN_TOKEN` | `wrangler secret put LINKETRY_ADMIN_TOKEN --cwd apps/worker` | long random string |

### Worker Variables

Defined in `apps/worker/wrangler.toml`:

| Name                   | Example      |
| ---------------------- | ------------ |
| `LINKETRY_VERSION`     | `0.29.14`    |
| `LINKETRY_DAILY_CRON`  | `0 18 * * *` |
| `LINKETRY_HEALTH_CRON` | `0 * * * *`  |

### Worker Bindings

Defined in `apps/worker/wrangler.toml`:

| Binding        | Cloudflare product | Purpose                       |
| -------------- | ------------------ | ----------------------------- |
| `DB`           | D1                 | Source of truth               |
| `KV`           | KV                 | Redirect cache                |
| `BACKUPS`      | R2                 | Backup snapshot storage       |
| `VISITS_QUEUE` | Queues             | Asynchronous visit statistics |

### Admin Build Variable

| Name                    | Where                 | Example                  |
| ----------------------- | --------------------- | ------------------------ |
| `VITE_LINKETRY_API_URL` | Build env / Pages env | `https://go.example.com` |

### GitHub Actions Secrets And Variables

The `.github/workflows/deploy.yml` workflow always installs dependencies, type-checks the Worker, and builds Admin on pushes to `main`.

It applies D1 migrations and deploys the Worker only when these repository secrets are configured:

| Name                       | Purpose                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CLOUDFLARE_API_TOKEN`     | Authenticates Wrangler in GitHub Actions                                                                                                               |
| `CLOUDFLARE_DNS_API_TOKEN` | Optional; Zone Read and DNS Write token for automatic Admin CNAME maintenance; if absent, `CLOUDFLARE_API_TOKEN` is used when it has those permissions |
| `CLOUDFLARE_ACCOUNT_ID`    | Selects the Cloudflare account for Worker and Pages deploys                                                                                            |

It deploys Admin only when the Cloudflare secrets and these repository variables are configured:

| Name                         | Example                        | Purpose                                                                                                   |
| ---------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `LINKETRY_ADMIN_URL`         | `https://admin.example.com`    | Optional: overrides the automatic Pages URL in the deployment summary after adding a branded Admin domain |
| `LINKETRY_API_URL`           | `https://go.example.com`       | Builds Admin with the stable Worker API origin                                                            |
| `LINKETRY_PAGES_PROJECT`     | `linketry-admin`               | Selects the Cloudflare Pages project                                                                      |
| `LINKETRY_WORKER_NAME`       | `linketry-worker`              | Generates the Worker config name                                                                          |
| `LINKETRY_WORKER_DOMAINS`    | `go.example.com,s.example.com` | Generates one or more Worker custom domain routes                                                         |
| `LINKETRY_SHORT_DOMAIN`      | `go.example.com`               | Legacy single-domain fallback when `LINKETRY_WORKER_DOMAINS` is not set                                   |
| `LINKETRY_D1_DATABASE_NAME`  | `linketry`                     | Generates the D1 binding database name                                                                    |
| `LINKETRY_D1_DATABASE_ID`    | `<id>`                         | Generates the D1 binding database ID                                                                      |
| `LINKETRY_KV_NAMESPACE_ID`   | `<id>`                         | Generates the production KV binding ID                                                                    |
| `LINKETRY_KV_PREVIEW_ID`     | `<id>`                         | Generates the preview KV binding ID                                                                       |
| `LINKETRY_R2_BUCKET`         | `linketry-backups`             | Optional: generates the R2 backup bucket binding                                                          |
| `LINKETRY_R2_PREVIEW_BUCKET` | `linketry-backups-dev`         | Optional: generates the preview R2 bucket binding                                                         |
| `LINKETRY_VISITS_QUEUE`      | `linketry-visits`              | Optional: generates queue producer and consumer bindings                                                  |
| `LINKETRY_SITE_PROJECT`      | `linketry-site`                | Optional maintainer Pages project for the official product site                                           |
| `LINKETRY_SITE_URL`          | `https://linketry.com`         | Optional canonical project-site URL shown in deployment summaries                                         |

Every Cloudflare-enabled workflow run also requires exact deployment approvals:

| Name                                  | Example              | Purpose                                                                   |
| ------------------------------------- | -------------------- | ------------------------------------------------------------------------- |
| `LINKETRY_DEPLOYMENT_TRACK`           | `upgrade`            | Allows only the reviewed `fresh` or `upgrade` path; Demo is rejected here |
| `LINKETRY_APPROVED_RELEASE`           | `0.29.14`            | Must match the root package version                                       |
| `LINKETRY_APPROVED_COMMIT`            | `<40-character SHA>` | Must match the commit being deployed                                      |
| `LINKETRY_APPROVED_MIGRATIONS_SHA256` | `<digest>`           | Must match `npm run deploy:migration-digest`                              |

Fresh installs additionally set `LINKETRY_FRESH_INSTALL_CONFIRMED=true`. Existing installs set the backup, migration-review, and target-confirmation variables documented in [Deployment Preflight](docs/DEPLOYMENT_PREFLIGHT.md). The gate runs before Worker-secret, D1 migration, Worker deploy, or Pages deploy writes.

After Pages deployment, the workflow keeps the run active until the configured Admin origin advertises the exact release and its initial JavaScript and CSS assets return executable MIME types. This readiness check covers custom-domain propagation before an older Admin tab can treat an online upgrade as complete and refresh.

If either Cloudflare secret is missing, the workflow skips all Cloudflare migration/deploy steps and leaves manual Wrangler deployment as the source of production updates.
If either Admin variable is missing, the workflow still builds Admin but skips the Pages deploy so it does not publish a build with the wrong API URL.
If any core Worker variable is missing, the workflow skips Worker deploy instead of relying on a committed production `wrangler.toml`. Missing R2 and Queue variables only disable those advanced bindings.

On the first successful deployment, the workflow generates `LINKETRY_ADMIN_TOKEN` and uploads it alongside the first Worker deployment, then prints it once in the **Prepare Worker secrets** step. Later deployments preserve the existing Worker secret. If the token is lost, set a replacement GitHub repository secret named `LINKETRY_ADMIN_TOKEN` and rerun deployment once.

### Official Project Site

The public project site is isolated from the Admin under `apps/site`. Maintainers can validate it with `npm run test:site` and `npm run build:site`. Set `LINKETRY_SITE_PROJECT=linketry-site` to deploy the build through the same release-bound workflow.

The automatic preview is `https://linketry-site.pages.dev`, and the purchased apex is active at `https://linketry.com` through the Pages project's **Custom domains** configuration. Keep the Pages custom-domain association in place; an apex DNS record by itself is not a substitute for that association.

---

## 12. Production Smoke Test

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
curl https://go.example.com/api/v1/auth/me
```

Expected:

```txt
401 Unauthorized
```

Check Admin:

```txt
https://linketry-admin.pages.dev
```

Login with `LINKETRY_ADMIN_TOKEN`, then verify:

- Links list loads
- Create/Edit link works
- Copy/Open short link uses the configured short domain
- Import preview reports conflicts instead of overwriting slugs
- Export downloads a valid file
- Backups page can create or list R2 backup records

---

## 13. Shlink Cutover Checklist

Use this when moving an existing Shlink domain to Linketry.

Before cutover:

- Deploy Linketry to a stable API domain, for example `go.example.com`
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
- Keep Linketry data intact

Do not delete Shlink immediately. Keep it available for rollback during the first days after cutover.

# Self-Hosting Linketry

This guide is for people who fork or clone Linketry and want to deploy it to their own Cloudflare account.

## Deployment Track

This document is the **fresh beginner self-hosting** track. It creates new resources in your own Cloudflare account and never uses the Linketry maintainer's production or Demo resource IDs, domains, tokens, or data. If you already run an installation older than 0.10, stop here and follow [Upgrading pre-0.10 installations](UPGRADING_PRE_0_10.md) instead.

Use [Fresh Cloudflare Account Rehearsal](FRESH_ACCOUNT_REHEARSAL.md) as the final owner checklist. Its GitHub CLI examples always include `--repo`, so they also work when PowerShell was opened outside the clone.

Linketry keeps three deployment tracks separate:

| Track                       | Purpose                                       | Resource rule                                                                                                        |
| --------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Fresh self-hosting          | A new user installs Linketry                  | Create new resources in the user's own Cloudflare account                                                            |
| Existing production upgrade | Upgrade an already deployed Linketry instance | Reuse that instance's bindings only after a verified backup; apply incremental migrations without reset or Demo data |
| Official Demo               | Public Linketry demonstration                 | Use isolated Demo resources and synthetic data; never share production bindings                                      |

Do not use the official Demo workflow to upgrade an existing deployment. Do not use an existing production database as the target for this fresh-install guide.

Linketry is free and open source first. The recommended basic setup requires only one custom hostname:

| Hostname      | Purpose                                               | Example                    |
| ------------- | ----------------------------------------------------- | -------------------------- |
| Admin URL     | React Admin dashboard, created automatically by Pages | `linketry-admin.pages.dev` |
| Worker domain | Short-link redirects and `/api/v1/*`                  | `go.example.com`           |

Advanced deployments can optionally add `admin.example.com` as a branded Admin domain or `s.example.com` as a separate public short-link domain.

Use your own domains everywhere below. Do not copy another deployment's domains, resource IDs, or secrets.

## 1. Prerequisites

- Node.js 24.x
- npm 10+
- GitHub CLI (`gh`) authenticated to the account that owns your fork
- A Cloudflare account
- A domain managed by Cloudflare DNS
- Wrangler 4 and a completed login

```bash
npm install
gh auth status
npx wrangler --version
npx wrangler login
```

The repository pins Wrangler 4. If the version command does not report `4.x`, run `npm install` again before continuing.

Create a Cloudflare API token, never a Global API Key. Restrict it to the selected account and zone with:

- Account: **Workers Scripts Edit**, **Workers KV Storage Edit**, **D1 Edit**, and **Cloudflare Pages Edit**
- Zone: **Workers Routes Edit** for the zone that will host `go.example.com`
- Optional only: **Workers R2 Storage Edit** and **Queues Edit** when you enable those resources

The Zone permission is required because the Worker deployment registers a custom domain. Keep the token in your password manager; the command below prompts for it and does not put it in shell history.

## 2. Choose Names

Choose one unique lowercase prefix for this installation before creating resources. Replace `alice` with your handle, organization, or another name that distinguishes the deployment:

```txt
Resource prefix:   linketry-alice
Worker name:       linketry-alice-worker
D1 database:       linketry-alice-db
KV namespace:      linketry-alice-kv
Pages project:     linketry-alice-admin
Worker domain:     go.example.com
Admin URL:         linketry-alice-admin.pages.dev (automatic)
```

Advanced optional names include a branded Admin domain, the `linketry-backups` R2 buckets, `linketry-visits` Queue, and a separate public short-link domain.

The bootstrap derives every required name from the prefix. It rejects the reserved official Demo prefix and does not contain any maintainer account, domain, token, database, or resource ID.

When optional advanced bindings are enabled, keep their binding names unchanged:

```txt
DB
KV
BACKUPS
VISITS_QUEUE
```

## 3. Create Cloudflare Resources

Run the bootstrap without `--apply` first. This authenticates against the selected account, lists D1/KV resources, and prints an exact create/reuse plan without changing anything:

```bash
npm run deploy:bootstrap -- --prefix linketry-alice --domain go.example.com --account-id <your-cloudflare-account-id>
```

Review the masked account suffix and every target name. The dry-run prints a confirmation phrase tied to that account and prefix. Only then rerun the same command with the printed suffix:

```bash
npm run deploy:bootstrap -- --prefix linketry-alice --domain go.example.com --account-id <your-cloudflare-account-id> --apply --confirm <phrase-from-dry-run>
```

Apply mode creates only missing D1/KV resources, reads them back, and prints the complete GitHub repository variables and Wrangler binding snippet. Rerunning it with the same prefix is idempotent: exact existing resources are reused and no writes occur.

The script does not apply migrations, deploy Worker/Admin code, write secrets, change DNS, or create optional infrastructure. If an apply is interrupted after one resource succeeds, rerun the dry-run; the completed resource is reused and only the missing resource is planned.

After apply, rerun the dry-run. It should reuse the same D1 and KV IDs and plan no replacements. See [Deployment Preflight](DEPLOYMENT_PREFLIGHT.md) for the complete validation and redaction guarantees.

Optional: create a separate KV preview namespace manually and add its ID later:

```bash
npx wrangler kv namespace create linketry-alice-kv-preview
```

Advanced optional: create R2 buckets for scheduled backups and one-click restore:

```bash
npx wrangler r2 bucket create linketry-backups
npx wrangler r2 bucket create linketry-backups-dev
```

Advanced optional: create the visit queue for asynchronous analytics:

```bash
npx wrangler queues create linketry-visits --message-retention-period-secs 60
```

## 4. Configure GitHub And Deploy (Recommended)

Set your fork once in PowerShell, then add the Cloudflare API token through GitHub CLI's hidden prompt:

```powershell
$repo = 'OWNER/REPOSITORY'
gh secret set CLOUDFLARE_API_TOKEN --repo $repo
gh api --method PUT "repos/$repo/environments/production"
```

Run the repository configuration in dry-run mode. It reads the exact D1/KV resources created above, verifies the clean local release metadata, and prints the complete GitHub plan without changing the repository:

```powershell
npm run deploy:configure -- --repo $repo --prefix linketry-alice --domain go.example.com --account-id <account-id>
```

Review the masked account, domain, Pages/Worker/D1/KV names, release, commit, and migration digest. Then repeat it with the exact confirmation phrase printed by the dry-run:

```powershell
npm run deploy:configure -- --repo $repo --prefix linketry-alice --domain go.example.com --account-id <account-id> --apply --confirm <phrase-from-dry-run>
```

Apply mode verifies `gh` authentication, the target repository, and that the reviewed local commit is already on that fork's `main` branch before writing. It sends the account ID through standard input and creates the complete minimum repository-variable set; it never reads or prints either token. Rerunning the same command is safe and verifies the resulting values.

Start the guarded first deployment:

```powershell
gh workflow run deploy.yml --repo $repo --ref main --field confirm_release=true
gh run watch --repo $repo
```

The workflow runs the deployment tests and safety gate before Cloudflare writes. It creates the Admin Pages project only when missing, generates the first Admin token when needed, deploys Worker secrets alongside the first Worker deployment, applies D1 migrations, and deploys Admin. Continue at [First Login](#first-login) after it succeeds.

## Advanced Manual Deployment

Use this alternative only when you intentionally do not want GitHub Actions. Do not mix its local `wrangler.toml` and secret steps into the recommended workflow above.

### Configure the Worker

Copy the template. If `apps/worker/wrangler.toml` already exists from another deployment, replace it with your own values before deploying.

```bash
cp -f apps/worker/wrangler.toml.example apps/worker/wrangler.toml
```

On Windows PowerShell:

```powershell
Copy-Item apps/worker/wrangler.toml.example apps/worker/wrangler.toml -Force
```

Edit `apps/worker/wrangler.toml` and replace:

| Placeholder              | Value                                                                       |
| ------------------------ | --------------------------------------------------------------------------- |
| `<your-short-domain>`    | Your short-link and API hostname, for example `go.example.com`              |
| `<your-d1-database-id>`  | The D1 ID printed by `deploy:bootstrap --apply`                             |
| `<your-kv-namespace-id>` | The KV ID printed by `deploy:bootstrap --apply`                             |
| `<your-kv-preview-id>`   | Optional preview KV namespace ID; remove the `preview_id` line when omitted |

For a manual Wrangler deployment, set the production admin token:

```bash
cd apps/worker
npx wrangler secret put LINKETRY_ADMIN_TOKEN
cd ../..
```

Use a long random value. Do not commit `.dev.vars` or real secrets.
Do not deploy with someone else's Cloudflare resource IDs.

Do not repeat this manual token step when using the GitHub Actions first-deployment path below: that path generates the Worker secret once and reports it in the deployment log. A GitHub repository secret named `LINKETRY_ADMIN_TOKEN` is only a recovery or intentional-rotation override.

### Apply D1 Migrations

```bash
npm run db:migrate:remote --workspace=apps/worker
```

The workspace command uses the stable `DB` binding, so it works with the unique database name generated by Bootstrap.

For local development:

```bash
npm run db:migrate:local --workspace=apps/worker
```

### Deploy the Worker

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
{ "success": true, "data": { "status": "ok", "name": "Linketry", "version": "0.28.4" } }
```

### Build and Deploy Admin

Build Admin with your stable API domain:

```bash
VITE_LINKETRY_API_URL=https://go.example.com npm run build --workspace=apps/admin
```

On Windows PowerShell:

```powershell
$env:VITE_LINKETRY_API_URL="https://go.example.com"
npm run build --workspace=apps/admin
```

Create and deploy a Cloudflare Pages project:

```bash
npx wrangler pages project create linketry-admin --production-branch main
npx wrangler pages deploy apps/admin/dist --project-name linketry-admin --branch main
```

Open the automatically created `https://linketry-admin.pages.dev` URL. Adding `admin.example.com` under the Pages project's **Custom domains** is optional and can be done later.

## GitHub Actions Details

The included workflow can apply D1 migrations and deploy on pushes to `main`. The recommended setup above keeps Cloudflare resource IDs out of the repository and removes the need to enter repository variables one by one.

### Required for any deployment

The basic deployment uses two repository secrets:

```txt
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Enter `CLOUDFLARE_API_TOKEN` through the hidden `gh secret set` prompt. `deploy:configure --apply` writes `CLOUDFLARE_ACCOUNT_ID` through standard input after verifying the exact repository.

`LINKETRY_ADMIN_TOKEN` does not need to be created manually. On the first deployment, the workflow generates it as a Worker secret and prints it once in the deployment log. A repository secret with the same name is only an optional recovery override if the generated value is lost.

For in-app one-click upgrades, add the optional repository secret `LINKETRY_GITHUB_UPDATE_TOKEN`. Use a fine-grained GitHub token restricted to this Linketry repository with only **Actions: write** repository permission. The deployment workflow copies it into the Worker secret store; it is never included in the Admin build. If omitted, the Admin keeps the manual GitHub Actions fallback.

1. In GitHub account settings, create a fine-grained personal access token for only this Linketry repository.
2. Grant repository permission **Actions: Read and write**; do not grant organization or unrelated repository access.
   For unattended upgrades, choose **No expiration** when the account policy allows it. If an expiry is mandatory, rotate the token and rerun the deployment before that date.
3. In the Linketry repository, open **Settings → Secrets and variables → Actions → Secrets** and create `LINKETRY_GITHUB_UPDATE_TOKEN`.
4. For a fresh install, run **Deploy Linketry** once; it copies the token into the Worker secret store without printing it. For an existing installation that must stay on its current version, manually run **Sync Online Upgrade Secret**, entering the exact protected Worker name.
5. Confirm the next update from the Admin banner. Rotate the repository secret and rerun deployment before the token expires.

To let GitHub Actions maintain a custom Admin-domain CNAME automatically, add an optional `CLOUDFLARE_DNS_API_TOKEN` secret restricted to Zone Read and DNS Write for your zone. Without it, deployment still succeeds and reports the CNAME target for manual setup.

`deploy:configure --apply` creates and verifies these basic repository variables:

```txt
LINKETRY_API_URL=https://go.example.com
LINKETRY_PAGES_PROJECT=linketry-alice-admin
LINKETRY_WORKER_NAME=linketry-alice-worker
LINKETRY_SHORT_DOMAIN=go.example.com
LINKETRY_D1_DATABASE_NAME=linketry-alice-db
LINKETRY_D1_DATABASE_ID=<your-d1-database-id>
LINKETRY_KV_NAMESPACE_ID=<your-kv-namespace-id>
LINKETRY_DEPLOYMENT_TRACK=fresh
LINKETRY_APPROVED_RELEASE=0.28.4
LINKETRY_APPROVED_COMMIT=<40-character-commit-sha>
LINKETRY_APPROVED_MIGRATIONS_SHA256=<migration-digest>
LINKETRY_FRESH_INSTALL_CONFIRMED=true
```

The configuration command reads the exact commit and `npm run deploy:migration-digest` result for you, and refuses to approve a dirty worktree. The workflow checks these approvals before its first Cloudflare write. After the first successful deployment, switch `LINKETRY_DEPLOYMENT_TRACK` to `upgrade` and set the verified-backup and migration-review variables in [Deployment Preflight](DEPLOYMENT_PREFLIGHT.md) before later releases.

Push the approved commit to `main` or start the confirmed manual run. The workflow will type-check, build, enforce the deployment gate, create the Pages project when missing, migrate D1, deploy the Worker with its secrets, and deploy Admin.

After the first deployment, the Admin update banner provides **Online upgrade**. When `LINKETRY_GITHUB_UPDATE_TOKEN` is configured, the primary instance Admin token can trigger this repository's fixed `deploy.yml` and branch directly. The banner follows the GitHub run, waits for a successful conclusion, verifies that the Worker's public cross-origin `/health` endpoint reports the expected version, and then reloads the Admin. Keep credential-free GET/OPTIONS CORS enabled on `/health` when Admin Pages and the Worker use separate origins. It cannot accept a repository, branch, commit, workflow, or target from the browser.

The confirmation approves only the configured branch's exact package version and commit; the migration digest, verified backup reference, migration review, target confirmation, and remote-resource checks still have to pass. Scoped Linketry API tokens cannot trigger an upgrade. When the GitHub secret is absent, invalid, or expired, use the banner's manual Actions fallback, rotate the repository secret if needed, and rerun deployment once to update the Worker secret.

Normal `push` deployments remain bound to `LINKETRY_APPROVED_RELEASE` and `LINKETRY_APPROVED_COMMIT`. **Sync Online Upgrade Secret** changes only the named protected Worker's secret and does not deploy code or run migrations. The online path is an explicit repository-owner action, not an automatic background update.

The completed workflow includes a **Linketry access** summary with the Admin and API URLs.

> On the first deployment, the workflow automatically generates `LINKETRY_ADMIN_TOKEN`. Open GitHub **Actions** → the first successful **Deploy Linketry** run → **Prepare Worker secrets**, copy the one-time token from that step log, and save it to your password manager. Later deployments detect and preserve the existing Worker secret instead of rotating it. If the value is lost, create a new repository secret named `LINKETRY_ADMIN_TOKEN` and rerun deployment once to replace the Worker token.

### Optional advanced variables

Leave these unset for the basic deployment; enable them later from the Admin Advanced mode.

```txt
LINKETRY_KV_PREVIEW_ID=<your-kv-preview-id>
LINKETRY_VERSION=0.28.4
LINKETRY_COMPATIBILITY_DATE=2026-07-08
LINKETRY_WORKER_DOMAINS=go.example.com,s.example.com
LINKETRY_R2_BUCKET=linketry-backups
LINKETRY_R2_PREVIEW_BUCKET=linketry-backups-dev
LINKETRY_VISITS_QUEUE=linketry-visits
LINKETRY_DAILY_CRON=0 18 * * *
LINKETRY_HEALTH_CRON=0 * * * *
```

`LINKETRY_WORKER_DOMAINS` replaces the single-domain fallback when set. Configure both R2 variables together. Queue and R2 are independent advanced capabilities; leaving them unset no longer blocks the basic Worker deployment.

### Move imported links to a new short domain

Shlink imports preserve the domain stored in each original short URL. If the imported links use `s.y8o.de` but Linketry should publish them as `go.uukk.de`, open **Links**, switch to **Advanced** mode, and choose **Migrate short-link domain**.

1. Enter `s.y8o.de` as the current short-link domain.
2. Enter `go.uukk.de` as the new short-link domain.
3. Preview the matching count and sample URLs.
4. Confirm only after the new domain's DNS and Worker custom-domain route are active.

This operation updates only the stored short-link `domain` and generated `short_url`. It keeps every slug and destination/Aff `long_url` unchanged, clears old/new KV cache entries, and downloads a migration record CSV. The separate **Replace URLs** tool continues to modify destination/Aff URLs instead.

The workflow still type-checks and builds when Cloudflare secrets are missing, but Cloudflare migration and deployment are skipped. Worker deployment uses these variables to generate `apps/worker/wrangler.toml` during CI.

## First Login

Open the automatic Pages Admin URL shown in the deployment summary:

```txt
https://linketry-alice-admin.pages.dev
```

To find the token after an automatic deployment:

1. Open the forked repository on GitHub.
2. Select **Actions**, then the latest successful **Deploy Linketry** run.
3. Open the **Prepare Worker secrets** step.
4. Copy the generated `linketry_...` value from the one-time log.
5. Save it in a password manager. Later deployments preserve it automatically.

If the generated value is lost, add a new value under **Settings → Secrets and variables → Actions → Secrets → LINKETRY_ADMIN_TOKEN** and rerun deployment once. This recovery override replaces the Worker secret.

Log in with `LINKETRY_ADMIN_TOKEN`, then open Settings and set:

| Setting               | Value             |
| --------------------- | ----------------- |
| Site Name             | Your project name |
| Default Domain        | `go.example.com`  |
| Default Redirect Type | `302`             |

Then open **Setup** in the sidebar. It summarizes whether the Admin can reach the API, whether a default short domain is configured, whether the domain catalog has an active default, whether R2 backups are available, and whether the first link has been created.

The Admin starts in **Simple mode**. Switch to **Advanced mode** from the sidebar or Settings to reveal Analytics, Domains, Redirect Rules, R2 Backups, API Tokens, Audit Logs, and other operator tools. This interface switch does not create Cloudflare resources.

### Scheduled original destination/Aff monitoring

Linketry uses a daily Cron for backups, reports, and cleanup, plus a separate hourly Cron for target health checks. In **Advanced Settings**:

1. Enable **Scheduled target health monitoring**.
2. Choose how many active links to check per run (1-50).
3. Set the consecutive-failure threshold and repeat-suppression period.
4. Configure one or more notification channels: Telegram, Discord, Slack, Feishu, DingTalk, or WeCom.
5. Save each channel and send a test notification.

The monitor checks each active link's stored `long_url`, follows redirects, retries selected HEAD failures with a one-byte GET request, and records HTTP status, final URL, response time, and error state. Notifications are sent only when the failure threshold is reached and when the target later recovers. The existing signed generic Webhook remains available separately.

Notification channels use Linketry's built-in plain-text failure and recovery formats. They include the short link, target URL, status, HTTP status, response time, and UTC detection time; operators configure channel credentials and targets, not message templates.

Notification tokens and Incoming Webhook URLs are stored as write-only instance settings: they are not returned by the API and are excluded from Linketry backup exports. Keep D1 access restricted to the deployment account.

### Scheduled traffic anomaly alerts

In **Advanced mode**, open **Analytics → Traffic Anomaly Alerts** to enable a daily aggregate comparison between the latest 24 hours and the previous 7-day daily baseline. Configure:

1. A minimum daily visit count so low-volume samples are ignored.
2. The volume multiplier that indicates a traffic spike.
3. The bot-rate percentage-point increase that indicates unusual automation traffic.
4. The repeat-suppression period.

Use **Check now** after saving to inspect the current aggregate evidence. Alerts and recovery notices use the same notification channels configured for target monitoring. Only aggregate visit/bot counts and rates are stored; no new visitor, IP, or session identifiers are collected. Detection and delivery run outside the redirect path.

## Smoke Test

Run these after every first deployment:

```bash
curl https://go.example.com/health
curl -i https://go.example.com/api/v1/auth/me
```

Expected:

- `/health` returns `success: true` and `status: ok`
- `/api/v1/auth/me` returns `401` without an Authorization header

Then use Admin to verify:

- Create a link with slug `test`
- Open `https://go.example.com/test`
- Confirm it redirects to the destination URL
- Disable the link and confirm it no longer redirects
- Export links as CSV or JSON
- Run an import preview and confirm slug conflicts are not overwritten
- Open Overview and confirm the dashboard counters load
- Open Analytics and confirm the selected date range loads, even if it is empty

## Local Development Check

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

## Migration Notes

Linketry can import from Shlink, Bitly CSV, Short.io CSV, Sink, YOURLS, Dub, Linketry backup JSON, and generic CSV/JSON. Bitly and Short.io files can be auto-detected from their documented headers or selected explicitly in **Import / Export**. Always review the preview; existing slugs are skipped unless you deliberately select another conflict strategy. One file is limited to 10 MiB UTF-8 content and 50,000 normalized links; split larger migrations into reviewed batches.

For a Shlink migration:

1. Keep Shlink running.
2. Deploy Linketry with a stable API domain like `go.example.com`.
3. Import Shlink data and verify important slugs.
4. Cut over the old short domain only after testing.
5. Keep Shlink available for rollback for 1-2 weeks.

## Troubleshooting

| Issue                                     | Check                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------- |
| Admin cannot call API                     | Confirm `VITE_LINKETRY_API_URL` was set before building Admin         |
| Worker cannot read D1/KV/R2               | Confirm binding names and resource IDs in `apps/worker/wrangler.toml` |
| Login fails                               | Confirm `LINKETRY_ADMIN_TOKEN` was set with `wrangler secret put`     |
| GitHub Actions builds but does not deploy | Confirm Cloudflare secrets are set                                    |
| Pages deploys to the wrong project        | Confirm `LINKETRY_PAGES_PROJECT` repository variable                  |
| Short links use the wrong copied domain   | Update Admin Settings -> Default Domain                               |
| Local Worker starts without bindings      | Confirm `apps/worker/wrangler.toml` was copied from the example       |

For reproducible bugs and documentation problems, follow [Support and compatibility](../SUPPORT.md). Report an unpatched vulnerability through the private channel in [Security policy](../SECURITY.md), never in a public issue or with live credentials attached.

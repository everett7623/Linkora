# Deployment Preflight

Linketry keeps fresh self-hosting, existing production upgrades, and the official Demo as separate deployment tracks. The deployment preflight validates the selected track before any migration or deployment command is run.

```bash
npm run deploy:preflight -- --track fresh
npm run deploy:preflight -- --track upgrade
npm run deploy:preflight -- --track demo
```

The command is read-only. It never creates resources, applies migrations, deploys code, changes domains, initializes D1, resets an instance, or seeds Demo data.

## What It Checks

All tracks validate:

- Cloudflare account and API-token presence without printing the token
- Worker, Pages, D1, and KV target configuration
- HTTPS API URL and Worker-domain consistency
- non-example hostnames and valid resource IDs
- optional KV preview configuration
- paired R2 production/preview buckets when R2 is enabled
- Queue remaining optional for the basic deployment

Add `--check-cloudflare` to run read-only Wrangler account and resource inventory commands:

```bash
npm run deploy:preflight -- --track fresh --check-cloudflare
```

This verifies `wrangler whoami`, lists D1 databases and KV namespaces, and confirms that the configured D1/KV IDs exist in the selected account. When optional R2 buckets or a Queue are configured, it also lists those services before any deployment write. Existing optional resources pass; resources that have not been created yet produce a warning so the guarded workflow can create them later. An unavailable service or denied inventory call fails the gate. Cloudflare R2 error `10042` is reported explicitly as R2 not being enabled for the selected account.

The read checks do not claim to prove write permission; the later provisioning/deployment command still needs the documented Workers, D1, KV, Pages, and optional R2/Queues permissions.

Use `--json` for a machine-readable redacted report. Cloudflare tokens are never included, and account/D1/KV identifiers are masked.

## Common Environment

Set these values in the current shell or CI environment before running the preflight:

```txt
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN (required in CI; optional locally after `wrangler login`)
LINKETRY_WORKER_NAME
LINKETRY_WORKER_DOMAINS (or LINKETRY_SHORT_DOMAIN)
LINKETRY_API_URL
LINKETRY_PAGES_PROJECT
LINKETRY_D1_DATABASE_NAME
LINKETRY_D1_DATABASE_ID
LINKETRY_KV_NAMESPACE_ID
```

`LINKETRY_KV_PREVIEW_ID`, both R2 bucket variables, the Queue, branded Admin URL, extra Worker domains, and advanced Cron settings remain optional. Configure `LINKETRY_R2_BUCKET` and `LINKETRY_R2_PREVIEW_BUCKET` together.

Do not put real tokens in a committed environment file. Set them in the current shell, a password manager, or GitHub Actions secrets. A manual local run may omit `CLOUDFLARE_API_TOKEN` when Wrangler is already authenticated; `--check-cloudflare` then verifies that login directly.

## Fresh Self-Hosting

The fresh track is only for a brand-new installation in the user's own Cloudflare account. Start with the idempotent bootstrap dry-run:

```bash
npm run deploy:bootstrap -- --prefix linketry-alice --domain go.example.com --account-id <your-cloudflare-account-id>
```

It generates unique D1, KV, Worker, and Pages names, shows an exact create/reuse plan, and prints a confirmation phrase without writing anything. Add `--apply --confirm <printed-phrase>` only after reviewing the selected account and names. Apply creates missing D1/KV resources and prints reusable binding output; it does not migrate or deploy the application.

Load the resulting variables into the shell, then set:

```txt
LINKETRY_FRESH_INSTALL_CONFIRMED=true
```

Then run `deploy:preflight -- --track fresh --check-cloudflare` before migrations or deployment. The preflight remains read-only and confirms the created IDs belong to the selected account.

For the rest of the first-install procedure, follow [Self-Hosting Linketry](SELF_HOSTING.md).

## Existing Production Upgrade

The upgrade track reuses an existing installation's bindings. It fails unless all three gates and a concrete backup reference are present:

```txt
LINKETRY_BACKUP_VERIFIED=true
LINKETRY_MIGRATIONS_REVIEWED=true
LINKETRY_UPGRADE_TARGET_CONFIRMED=true
LINKETRY_BACKUP_REFERENCE=<backup filename, R2 object, or D1 restore-point timestamp>
```

The following flags must remain unset or false during an upgrade:

```txt
LINKETRY_ALLOW_INITIALIZATION
LINKETRY_ALLOW_FACTORY_RESET
LINKETRY_ALLOW_DEMO_SEED
LINKETRY_ALLOW_RESOURCE_RECREATION
LINKETRY_ALLOW_DOMAIN_REPLACEMENT
```

## GitHub Actions Production Gate

When Cloudflare credentials are configured, `.github/workflows/deploy.yml` runs a fail-closed gate after generating the temporary Worker config and before setting secrets, applying migrations, or deploying. Every run requires these repository variables:

```txt
LINKETRY_DEPLOYMENT_TRACK=fresh | upgrade
LINKETRY_APPROVED_RELEASE=<exact package version>
LINKETRY_APPROVED_COMMIT=<exact 40-character GitHub commit SHA>
LINKETRY_APPROVED_MIGRATIONS_SHA256=<reviewed migration digest>
```

Generate the migration value from the reviewed checkout:

```bash
npm run deploy:migration-digest
```

A fresh deployment also requires `LINKETRY_FRESH_INSTALL_CONFIRMED=true`. An upgrade requires the backup and review variables above. Update the exact release and commit approval for every production release, and update the migration approval whenever any file under `migrations/` changes.

For an authenticated online upgrade, configure the optional Worker secret `LINKETRY_GITHUB_UPDATE_TOKEN` from a fine-grained token limited to this repository with **Actions: write**. The primary instance Admin token can then confirm an upgrade in the update banner. The Worker dispatches only its deployment-time repository, `deploy.yml`, and branch; GitHub returns the workflow run ID, and the Admin follows that run before verifying the new `/health` version. Scoped Linketry API tokens cannot dispatch deployments.

If the optional secret is unavailable, use the banner's manual **Actions** → **Deploy Linketry** fallback, choose the release branch, check the release-safety confirmation, and run the workflow. Both paths bind the run to the selected/configured branch's exact package version and GitHub SHA, so they do not require editing `LINKETRY_APPROVED_RELEASE` or `LINKETRY_APPROVED_COMMIT` first. All migration, backup, target, destructive-operation, and remote-resource checks remain mandatory.

Push-triggered runs do not use this manual approval path. They continue to require the exact repository variables above and fail closed when those values are stale.

The gate rejects the Demo track in this production workflow, scans migrations for destructive SQL, reruns the full account/resource preflight, and reads remote D1 migration status. The official Demo uses the separate, manual-only `.github/workflows/deploy-demo.yml` workflow.

## Official Demo

Create a protected GitHub environment named `linketry-demo`. Add only these Demo-specific secrets:

```txt
LINKETRY_DEMO_CLOUDFLARE_API_TOKEN
LINKETRY_DEMO_CLOUDFLARE_ACCOUNT_ID
LINKETRY_DEMO_ADMIN_TOKEN
```

The API token must be restricted to the isolated Demo account and must have no access to the production account. The workflow does not read the production deployment secrets.

Add these environment variables after creating and reviewing the isolated Demo resources:

```txt
LINKETRY_DEMO_CREDENTIAL_SCOPE_CONFIRMED=true
LINKETRY_DEMO_ISOLATION_CONFIRMED=true
LINKETRY_DEMO_SYNTHETIC_DATA_ONLY=true
LINKETRY_DEMO_APPROVED_RELEASE=<exact package version>
LINKETRY_DEMO_APPROVED_COMMIT=<exact 40-character GitHub commit SHA>
LINKETRY_DEMO_APPROVED_MIGRATIONS_SHA256=<reviewed migration digest>
LINKETRY_DEMO_WORKER_NAME=linketry-demo-worker
LINKETRY_DEMO_USE_WORKERS_DEV=true
LINKETRY_DEMO_WORKER_DOMAINS=linketry-demo-worker.<Demo account subdomain>.workers.dev
LINKETRY_DEMO_API_ORIGIN_URL=https://linketry-demo-worker.<Demo account subdomain>.workers.dev
LINKETRY_DEMO_API_URL=https://demoapi.linketry.com
LINKETRY_DEMO_API_PAGES_PROJECT=linketry-demo-api
LINKETRY_DEMO_API_CUSTOM_DOMAIN=demoapi.linketry.com
LINKETRY_DEMO_ADMIN_URL=https://demo.linketry.com
LINKETRY_DEMO_ACCESS_CODE=LinketryDemo
LINKETRY_DEMO_PAGES_PROJECT=linketry-demo-admin
LINKETRY_DEMO_D1_DATABASE_NAME=linketry-demo-d1
LINKETRY_DEMO_D1_DATABASE_ID=<isolated Demo D1 ID>
LINKETRY_DEMO_KV_NAMESPACE_ID=<isolated Demo KV ID>
LINKETRY_DEMO_R2_BUCKET=linketry-demo-backups
LINKETRY_DEMO_R2_PREVIEW_BUCKET=linketry-demo-backups-preview
LINKETRY_DEMO_VISITS_QUEUE=linketry-demo-visits
LINKETRY_DEMO_COMPATIBILITY_DATE=2026-07-16
LINKETRY_PROTECTED_ACCOUNT_IDS=<comma-separated production Cloudflare account IDs>
LINKETRY_PROTECTED_RESOURCE_IDS=<comma-separated production D1/KV IDs>
LINKETRY_PROTECTED_RESOURCE_NAMES=<comma-separated production Worker/Pages/D1/R2/Queue names>
LINKETRY_PROTECTED_DOMAINS=<comma-separated production hostnames>
```

The isolated Worker uses the Demo account's automatic `workers.dev` hostname as `LINKETRY_DEMO_API_ORIGIN_URL`. With `LINKETRY_DEMO_USE_WORKERS_DEV=true`, the workflow enables `workers_dev` and does not misconfigure that hostname as a custom Worker domain. `LINKETRY_DEMO_API_URL` is the address compiled into the Admin: keep it on the Worker origin for the first gateway deployment, then change it to `https://demoapi.linketry.com` only after the Pages custom domain and DNS record are active.

The `linketry-demo-api` Pages Function has one `DEMO_API` Service Binding to `linketry-demo-worker`. It proxies only `/health` and `/api/*`; redirects, synthetic short-link URLs, and every D1/KV/Queue binding remain on the isolated Worker origin. The workflow idempotently creates the API Pages project after the safety gate, deploys it, verifies its `pages.dev` address, and registers `demoapi.linketry.com` with the project. It does not edit the `linketry.com` zone. Add a DNS-only CNAME named `demoapi` pointing to `linketry-demo-api.pages.dev`, wait for Pages to report the custom domain active, update `LINKETRY_DEMO_API_URL`, approve the new commit, and rerun the workflow. Keep `LINKETRY_DEMO_API_ORIGIN_URL` unchanged as the fallback and sample-redirect hostname.

Generate the migration digest with `npm run deploy:migration-digest`. Update the approved release, commit, and digest for every reviewed Demo deployment.

Run **Deploy Isolated Linketry Demo** from GitHub Actions and type the exact confirmation `DEPLOY LINKETRY DEMO`. Before setting a Worker secret, applying migrations, or deploying, the workflow verifies that:

- the event is a manual dispatch with the exact confirmation;
- the Demo account differs from every protected production account;
- Worker, Admin/API Pages, D1, optional R2, and optional Queue names are unique and use the reserved `linketry-demo-*` prefix;
- D1/KV IDs, resource names, and hostnames do not overlap protected production targets;
- the selected core resources exist in the Demo account, and configured optional R2/Queue services permit read-only inventory;
- the release, Git commit, non-destructive migration policy, and reviewed migration digest match.

The workflow deploys only the isolated Demo Worker, API gateway, and Admin. After the safety gate and migrations, it idempotently refreshes synthetic links, visits, conversions, tags, a Demo domain, settings, audit samples, and disabled advanced-feature configuration. The Demo Admin asks for the public `LINKETRY_DEMO_ACCESS_CODE` preview code, while browser and Worker layers reject writes, redirect analytics does not record real visitors, and API reads use Cloudflare's native Rate Limiting binding with a hashed client key and a 120-request/minute policy. The preview code is a UX gate, not API authentication; the internal `LINKETRY_ADMIN_TOKEN` remains a random Worker secret and is never exposed in the frontend. After deployment, live parity gates verify the exact Admin/Worker version, canonical dark/light Logo assets, 18 production read APIs, and the `403` write boundary through both the API gateway and configured public API. The workflow does not deploy automatically, deploy the production project site, modify DNS, or copy production data.

## Admin Token: Choose One Deployment Path

Manual deployment and GitHub Actions intentionally handle `LINKETRY_ADMIN_TOKEN` differently:

| Path | First deployment | Later deployment |
|---|---|---|
| Manual Wrangler | Run `npx wrangler secret put LINKETRY_ADMIN_TOKEN --cwd apps/worker` and enter a long random value | Leave it unchanged unless intentionally rotating it |
| GitHub Actions fresh install | Leave the repository secret unset; the workflow creates the Worker secret and shows the value once in the first deployment log | The workflow preserves the existing Worker secret |
| GitHub Actions recovery | Set repository secret `LINKETRY_ADMIN_TOKEN` only when the saved value was lost or an intentional rotation is required | Rerun once, save the replacement, then remove the override if desired |

Never put the real Admin token in repository variables, code, `wrangler.toml`, screenshots, or preflight output.

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

Add `--check-cloudflare` to run three additional read-only Wrangler commands:

```bash
npm run deploy:preflight -- --track fresh --check-cloudflare
```

This verifies `wrangler whoami`, lists D1 databases, lists KV namespaces, and confirms that the configured D1/KV IDs exist in the selected account. It does not claim to prove write permission; the later provisioning/deployment command still needs the documented Workers, D1, KV, and Pages permissions.

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

The gate rejects the Demo track in this production workflow, scans migrations for destructive SQL, reruns the full account/resource preflight, and reads remote D1 migration status. A separate isolated Demo workflow remains planned.

## Official Demo

The Demo track fails closed unless isolation and synthetic-data use are confirmed and protected production targets are supplied:

```txt
LINKETRY_DEMO_ISOLATION_CONFIRMED=true
LINKETRY_DEMO_SYNTHETIC_DATA_ONLY=true
LINKETRY_PROTECTED_RESOURCE_IDS=<comma-separated production D1/KV IDs>
LINKETRY_PROTECTED_RESOURCE_NAMES=<comma-separated production Worker/Pages/D1/R2/Queue names>
LINKETRY_PROTECTED_DOMAINS=<comma-separated production hostnames>
```

Any overlap between the Demo targets and a protected ID, name, or hostname fails the preflight. The dedicated Demo workflow and reset/read-only policy are still planned separately.

## Admin Token: Choose One Deployment Path

Manual deployment and GitHub Actions intentionally handle `LINKETRY_ADMIN_TOKEN` differently:

| Path | First deployment | Later deployment |
|---|---|---|
| Manual Wrangler | Run `npx wrangler secret put LINKETRY_ADMIN_TOKEN --cwd apps/worker` and enter a long random value | Leave it unchanged unless intentionally rotating it |
| GitHub Actions fresh install | Leave the repository secret unset; the workflow creates the Worker secret and shows the value once in the first deployment log | The workflow preserves the existing Worker secret |
| GitHub Actions recovery | Set repository secret `LINKETRY_ADMIN_TOKEN` only when the saved value was lost or an intentional rotation is required | Rerun once, save the replacement, then remove the override if desired |

Never put the real Admin token in repository variables, code, `wrangler.toml`, screenshots, or preflight output.

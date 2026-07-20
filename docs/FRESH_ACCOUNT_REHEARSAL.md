# Fresh Cloudflare Account Rehearsal

Updated: 2026-07-20

Use this checklist after reading [Self-hosting](SELF_HOSTING.md). It captures the complete owner workflow that should pass before a Linketry release is considered beginner-deployable.

## Safety Rules

- Use an account-owned Cloudflare API token, never the Global API Key.
- Restrict the token to the selected account and grant only Workers Scripts Edit, Workers KV Storage Edit, D1 Edit, and Cloudflare Pages Edit for the basic profile.
- Add Workers R2 Storage Edit and Queues Edit only when those optional resources are configured.
- Never reuse production credentials for a Demo or test account.
- Never paste a token into an issue, commit, command argument, or chat transcript.

## 1. Verify Local Tools

Run these commands from the cloned fork:

```powershell
npm ci
gh auth status
npx wrangler --version
npx wrangler whoami
```

Linketry currently uses Node.js 24 and Wrangler 4. A GitHub CLI command can run outside the repository only when `--repo OWNER/REPOSITORY` is supplied explicitly.

## 2. Rehearse Required Resource Creation

Run the idempotent bootstrap in dry-run mode first:

```powershell
npm run deploy:bootstrap -- --prefix linketry-alice --domain go.example.com --account-id <account-id>
```

Check the masked account suffix and exact D1/KV names. Apply only with the confirmation phrase printed by the dry-run:

```powershell
npm run deploy:bootstrap -- --prefix linketry-alice --domain go.example.com --account-id <account-id> --apply --confirm <phrase-from-dry-run>
```

Rerun the dry-run. It must report the same D1 and KV resources as reusable and must not plan replacements.

## 3. Configure GitHub Without Directory Assumptions

Set the repository once. Each mutation below includes `--repo`, so it works even when PowerShell is opened in the user home directory:

```powershell
$repo = 'OWNER/REPOSITORY'
gh secret set CLOUDFLARE_API_TOKEN --repo $repo
gh secret set CLOUDFLARE_ACCOUNT_ID --repo $repo
gh api --method PUT "repos/$repo/environments/production"
```

`gh secret set` prompts for the value without placing it in shell history. The environment command creates the deployment-history target used by the production workflow; review its branch and approval protection in the repository settings before deployment. Configure the exact release approval values:

```powershell
$repo = 'OWNER/REPOSITORY'
$release = node -p "require('./package.json').version"
$commit = git rev-parse HEAD
$digest = npm run --silent deploy:migration-digest
gh variable set LINKETRY_APPROVED_RELEASE --body $release --repo $repo
gh variable set LINKETRY_APPROVED_COMMIT --body $commit --repo $repo
gh variable set LINKETRY_APPROVED_MIGRATIONS_SHA256 --body $digest --repo $repo
gh variable set LINKETRY_DEPLOYMENT_TRACK --body fresh --repo $repo
gh variable set LINKETRY_FRESH_INSTALL_CONFIRMED --body true --repo $repo
```

Add the resource variables printed by the bootstrap through the repository UI or the same `gh variable set ... --repo $repo` form. Do not copy IDs from another Linketry installation.

## 4. Verify Before Deployment

Load the printed variables into the current shell, then run:

```powershell
npm run deploy:preflight -- --track fresh --check-cloudflare
npm run test:deployment
```

The preflight must identify the intended account, D1 database, and KV namespace without printing credentials. Warnings for optional R2 or Queue resources are acceptable only when those variables are intentionally unset.

## 5. Deploy And Complete First Login

Push the approved commit or manually run **Deploy Linketry**. Verify all of the following:

- The workflow run and deployment history both identify the `production` environment.
- `GET /health` reports the package version.
- The Admin Pages URL loads and accepts the one-time generated `LINKETRY_ADMIN_TOKEN`.
- Setup reports a reachable API and the expected default domain.
- The first link can be created, opened, disabled, restored, exported, and deleted.
- A missing slug returns the Linketry 404 page.
- A disabled link returns the disabled page instead of redirecting.
- An unauthenticated Admin API request returns 401.

Save the generated Admin token in a password manager before closing the first deployment log.

## 6. Configure Cross-account Pages DNS

A DNS zone and a Pages project do not have to live in the same Cloudflare account. Keep the zone in its owner account and choose **My DNS provider** when the Pages project asks how to configure a custom domain.

For the official isolated Demo, the zone owner adds DNS-only records:

| Name | Type | Target | Proxy |
| ---- | ---- | ------ | ----- |
| `demo` | CNAME | `linketry-demo-admin.pages.dev` | DNS only |
| `demoapi` | CNAME | `linketry-demo-api.pages.dev` | DNS only |

Then use **Check DNS records** in the Pages project and wait for **Domain activated**. Do not transfer the `linketry.com` zone into the Demo account and do not point either hostname at a production Worker.

## 7. Distinguish R2 Activation From Linketry Binding

Opening R2 in the Cloudflare dashboard only activates the service. Linketry reports R2 configured only after both buckets exist and both variables are present:

```txt
LINKETRY_R2_BUCKET
LINKETRY_R2_PREVIEW_BUCKET
```

The isolated Demo uses:

```txt
LINKETRY_DEMO_R2_BUCKET
LINKETRY_DEMO_R2_PREVIEW_BUCKET
```

Confirm `npx wrangler r2 bucket list` succeeds with the deployment token, set both variables together, and rerun deployment. A workflow step named **Upload isolated synthetic Demo artifacts** is skipped when the variables are absent; that skip does not mean the Cloudflare R2 service itself is disabled.

## 8. Upgrade And Rollback Rehearsal

After the first deployment:

1. Create and verify a backup reference.
2. Switch `LINKETRY_DEPLOYMENT_TRACK` from `fresh` to `upgrade`.
3. Approve the next release, commit, and migration digest.
4. Deploy the next version and verify `/health`, Admin assets, and one redirect.
5. Confirm the documented rollback can redeploy the previous approved commit without changing D1/KV bindings.

Record the workflow run IDs and the checked URLs in `PROGRESS.md` or the release task record.

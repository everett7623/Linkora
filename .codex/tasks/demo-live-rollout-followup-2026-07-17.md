# Demo Live Rollout And Advanced Cloudflare Follow-up - 2026-07-17

## Status

Core Demo rollout is complete and live at `https://demo.linketry.com`. The account is the recorded fresh-account core rehearsal. R2 subscription activation and the optional GitHub online-upgrade token remain external owner actions.

## Delivered

- [x] Pushed responsive Demo parity in commit `b7cc135451cc19fad7f85f542b98c73aeafa7832`.
- [x] Pushed the Wrangler R2/Queue discovery repair in commit `b65bef258e3964af3ed796a51a59f10989c12246`.
- [x] Completed the isolated manual deployment in GitHub Actions run `29536944045`.
- [x] Deployed D1 migrations, deterministic synthetic data, the Worker, and the Admin Pages project.
- [x] Verified all 17 Admin routes load without application errors after their API data resolves.
- [x] Verified 5 links, 84 visits, 3 redirect rules, 2 import jobs, 2 API tokens, 2 backup records, health samples, Analytics samples, and audit history.
- [x] Verified the 390x844 layout has a 390px document/main width, no horizontal overflow, and a drawer containing all routes.
- [x] Verified a live create attempt is rejected with `ApiError: The public Linketry Demo is read-only.`
- [x] Verified Setup reports 5 successful core checks, 0 failures, and Linketry version `0.25.1` for the deployed runtime.

## Current Cloudflare State

- D1, KV, Queue, Worker, Pages, the `workers.dev` API hostname, and `demo.linketry.com` are live in the isolated Demo account.
- The exposed old Demo API token was revoked/replaced and the protected GitHub environment secret was updated.
- The replacement token passes account, D1, KV, Queue, Worker, and Pages checks, but the isolated account returns Cloudflare R2 error `10042` before bucket inventory.
- The successful core rollout therefore omitted only R2 bindings and synthetic R2 artifact uploads; the two R2 environment variables are temporarily unset.
- `demoapi.linketry.com` is not active; the isolated API continues to use `https://linketry-demo-worker.tuomeixi.workers.dev`.
- Guarded v0.26.4 R2 recheck run `29639154619` still returned account-level code `10042`; all mutation and deployment steps were skipped and both R2 variables were removed again.
- `demoapi.linketry.com` was rejected as the default design because it would depend on the production `linketry.com` DNS zone. A future branded API should use a separate domain fully owned by the Demo account.

## Follow-up

- [x] Revoke/replace the old Demo API token because it was shared in conversation history.
- [x] Replace `LINKETRY_DEMO_CLOUDFLARE_API_TOKEN` in the protected `linketry-demo` GitHub environment.
- [x] Verify account identity, D1, KV, Queue, Worker, Pages, and guarded core deployment run `29600589228`.
- [ ] Enable R2 API access in the exact isolated account so `wrangler r2 bucket list` no longer returns `10042`.
- [ ] Restore the two R2 environment variables, approve the exact release/commit/digest, and rerun the isolated Demo workflow.
- [ ] Verify R2 backup downloads and report downloads after the successful R2 rollout.
- [x] Keep the isolated API on `workers.dev`; use a separate Demo-owned domain only if branded Admin/API hostnames become necessary.

## Safety Boundary

- Production Cloudflare resources, credentials, DNS, data, deployment workflow, and redirect behavior were not modified.
- The Demo remains synthetic-only, public-read-only, rate-limited, and isolated from the protected production account.
- R2 and Queue provisioning remains behind the fail-closed Demo deployment gate.
- Cloudflare's [R2 getting-started guide](https://developers.cloudflare.com/r2/get-started/) requires an R2 subscription; activate it from **Storage & databases → R2 → Overview** in the isolated account before retrying.
- Cloudflare documents [subdomain zone setup](https://developers.cloudflare.com/dns/zone-setups/subdomain-setup/) as Enterprise-only; the free-account isolation path therefore does not delegate `demo.linketry.com` into the Demo account.

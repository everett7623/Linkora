# Demo Live Rollout And Advanced Cloudflare Follow-up - 2026-07-17

## Status

Core Demo rollout is complete and live at `https://demo.linketry.com`. The responsive Admin and expanded synthetic dataset shipped in v0.25.0, Wrangler inventory compatibility shipped in v0.25.1, and this v0.25.2 record captures the verified live state and remaining Cloudflare credential work.

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

## Follow-up

- [x] Revoke/replace the old Demo API token because it was shared in conversation history.
- [x] Replace `LINKETRY_DEMO_CLOUDFLARE_API_TOKEN` in the protected `linketry-demo` GitHub environment.
- [x] Verify account identity, D1, KV, Queue, Worker, Pages, and guarded core deployment run `29600589228`.
- [ ] Enable R2 API access in the exact isolated account so `wrangler r2 bucket list` no longer returns `10042`.
- [ ] Restore the two R2 environment variables, approve the exact release/commit/digest, and rerun the isolated Demo workflow.
- [ ] Verify R2 backup downloads and report downloads after the successful R2 rollout.
- [ ] Decide whether `demoapi.linketry.com` should be implemented through an owner-managed cross-account domain arrangement or remain on `workers.dev`.

## Safety Boundary

- Production Cloudflare resources, credentials, DNS, data, deployment workflow, and redirect behavior were not modified.
- The Demo remains synthetic-only, public-read-only, rate-limited, and isolated from the protected production account.
- R2 and Queue provisioning remains behind the fail-closed Demo deployment gate.

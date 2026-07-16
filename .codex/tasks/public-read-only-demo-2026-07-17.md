# Public Read-Only Demo - 2026-07-17

## Status

Complete and live. The v0.23.0 safety layer is deployed in an isolated Cloudflare account, v0.24.0 exposes the public Admin at `https://demo.linketry.com` without a visitor token, and v0.25.0 completes responsive Admin parity and advanced synthetic samples.

## Completed

- [x] Verified `https://linketry.com` on the independent `linketry-site` Pages project.
- [x] Updated `LINKETRY_SITE_URL` and the stale repository runtime version.
- [x] Created the `linketry-demo` GitHub environment with fail-closed confirmation values.
- [x] Added the production Cloudflare account, resource IDs/names, and domains to Demo protection lists.
- [x] Added public read-only Admin access without exposing an Admin token.
- [x] Enforced write rejection at both Admin client and Worker API boundaries.
- [x] Prevented public redirect visits from changing the synthetic Demo analytics dataset.
- [x] Added privacy-safe API abuse control through Cloudflare's native Rate Limiting binding.
- [x] Added an idempotent synthetic seed with five links, 84 visits, and 12 conversions.
- [x] Expanded the synthetic seed with redirect rules, imports, API tokens, health history, saved views, reports, backups, and audit activity.
- [x] Extended the manual Demo workflow to build, migrate, seed, deploy, and summarize the isolated targets.
- [x] Added safety-gated Demo-only R2 buckets and Queue plus downloadable synthetic R2 artifacts.
- [x] Added explicit `workers.dev` routing so the first isolated launch needs no production-zone DNS permission.
- [x] Defaulted fresh Demo sessions to the complete Admin navigation and fixed the narrow-screen Sidebar layout.

## Live Activation

- [x] Added a second Cloudflare account that is different from the protected production account.
- [x] Created isolated `linketry-demo-*` D1, KV, Worker, and Pages resources in that account.
- [x] Added a narrowly scoped Demo API token/account ID and separate `workers.dev` Worker hostname to the protected GitHub environment.
- [x] Approved the exact release/commit/migration digest, deployed manually, and completed live smoke tests.
- [x] Activated `demo.linketry.com` on the Demo Pages project through owner-managed DNS.
- [x] Kept the internal Admin token random and unexposed; visitors open the read-only Demo without a token.

## Verification

- Worker type-check passed; 72 Worker tests passed.
- 38 Admin unit tests passed; focused 390px Chromium layout coverage and the production build passed.
- 39 deployment safety tests passed.
- Generated SQL executed against local D1 with 5 synthetic links, 84 visits, 12 conversions, 3 redirect rules, 2 imports, 2 API tokens, and 2 backups.

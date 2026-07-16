# Public Read-Only Demo - 2026-07-17

## Status

Code and GitHub safety configuration are complete in v0.23.0. Live Cloudflare Demo provisioning is blocked until a second, production-isolated Cloudflare account and scoped token are available.

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
- [x] Extended the manual Demo workflow to build, migrate, seed, deploy, and summarize the isolated targets.
- [x] Added explicit `workers.dev` routing so the first isolated launch needs no production-zone DNS permission.

## External Blocker

- [ ] Add a second Cloudflare account that is different from protected production account `4cc48c...99e36`.
- [ ] Create `linketry-demo-*` D1, KV, Worker, and Pages resources in that account.
- [ ] Add a narrowly scoped Demo API token/account ID and a separate Demo Worker hostname to the protected GitHub environment.
- [ ] Rerun read-only preflight, approve the exact release/commit/migration digest, deploy manually, and complete live smoke tests.

## Verification

- Worker type-check passed; 72 Worker tests passed.
- 37 Admin unit tests and 13 Chromium tests passed; production Demo build passed.
- 38 deployment safety tests passed.
- Generated SQL executed against local D1 with 5 synthetic links, 84 visits, and 12 conversions.

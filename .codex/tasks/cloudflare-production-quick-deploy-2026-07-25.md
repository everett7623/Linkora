# Production-Only Cloudflare Quick Deploy

Date: 2026-07-25
Target release: 0.29.14
Status: Complete; source publication and existing-instance deployment are separate operations

## Goal

Make the public Cloudflare Deploy Button create a complete normal Linketry production instance for another user without exposing, provisioning, or enabling any part of the maintainer's isolated Demo environment.

## Reconstructed Baseline

- Local `main` was clean at `009f1e6` and three commits behind `origin/main`.
- The worktree was fast-forwarded to remote commit `a050831` / v0.29.13 before implementation.
- The prior language-icon task was committed and pushed, but its task record still awaited full regression and workflow verification.
- Cloudflare documents that `.env.example` and `.dev.vars.example` entries become Deploy Button secrets; Linketry's root file contained the complete official Demo environment.
- The old button had no deployable root Wrangler configuration and Cloudflare Deploy Buttons do not deploy a separate Pages application.

## Scope

- Add a root production Wrangler profile with fresh D1/KV bindings and no Demo configuration.
- Bundle the authenticated Admin under `/admin/` for the one-Worker Quick Deploy topology.
- Keep normal Worker + Pages GitHub Actions deployments unchanged.
- Limit Cloudflare-scanned secrets to the production Admin token.
- Apply production migrations after the initial Worker deployment.
- Update public English/Chinese deployment copy and operator documentation.
- Add GEO-ready public facts, structured data, agent-readable discovery, and explicit crawl-use policy.

## Safety Boundaries

- Do not enable `LINKETRY_DEMO_MODE`, run Demo seed scripts, or create Demo resources.
- Do not change redirect evaluation or the `ctx.waitUntil()` analytics boundary.
- Keep D1 authoritative and KV cache-only.
- Do not mutate Cloudflare, GitHub, DNS, migrations, or stored data during local verification.

## Status

- [x] Read remote/local state and previous task records.
- [x] Verify the Cloudflare Deploy Button contract against current official documentation.
- [x] Implement the production-only root deployment profile and bundled Admin build.
- [x] Add focused contract coverage and pass the normal Admin/site builds plus Worker type-check.
- [x] Add visible canonical facts, JSON-LD, `llms.txt`, sitemap dates, and AI-aware robots directives.
- [x] Complete 87 deployment, 110 Worker, 64 Admin unit, 25 Admin browser, 6 Demo API, and 10 site tests.
- [x] Complete Worker type-check, normal Admin, Quick Deploy Admin, and site builds plus a local Wrangler dry-run with temporary IDs.
- [x] Verify desktop and mobile homepage, deployment page, and bundled `/admin/` behavior without overflow, console errors, or failed responses.
- [x] Stop temporary local Worker and remove verification-only configuration and scripts.

## Publication Boundary

- Local validation did not create or modify Cloudflare resources, run remote migrations, or change DNS.
- Publishing this source release uses `[skip ci]` because the existing push-triggered production and isolated Demo workflows deploy separate maintained resources.
- Production and the isolated Demo remain on the v0.29.12 release workflows until their respective reviewed deployments are explicitly requested.

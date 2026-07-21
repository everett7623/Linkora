# Production Admin Cache Hardening - 2026-07-22

## Objective

Prevent `admin.uukk.de` from returning a blank Admin when a proxied custom-domain cache retains an HTML fallback under an entry asset URL, while preserving the DNS-only target state and deployment readiness checks.

## Scope

- [x] Add the release version as a query cache key to built Admin entry JavaScript and CSS URLs.
- [x] Keep MIME and unsafe-cache validation on the browser-facing asset URLs.
- [x] Let production DNS convergence use the dedicated DNS token or the configured Cloudflare API token.
- [x] Keep the isolated Demo redirect origin on `workers.dev`; do not add another branded redirect hostname.
- [ ] Run full regression, push `v0.29.2`, deploy, and verify the production Admin through its canonical domain.

## Safety

- Redirect routes and redirect decisions are unchanged.
- D1, KV, migrations, analytics ingestion, and stored data are unchanged.
- DNS automation is limited to the configured Admin hostname and preserves a DNS-only CNAME to the configured Pages project.

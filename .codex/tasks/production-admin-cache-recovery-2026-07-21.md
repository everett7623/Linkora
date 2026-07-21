# Production Admin Cache Recovery

Status: in progress; implementation and local verification are complete, production rollout remains.

## Incident

The production Admin document and its v0.28.8 CSS loaded, but `#root` remained empty. The canonical entry URL `/assets/index-DXTGNYQE.js` returned a cached v0.28.7 HTML fallback with HTTP 200 and `Content-Type: text/html`; adding an arbitrary query returned the correct JavaScript. The direct `linketry-admin.pages.dev` asset was healthy.

The custom `admin.uukk.de` path was proxied through the zone cache. During Pages propagation, a missing hashed asset fell through to the SPA document and was retained under the JavaScript cache key. The deployment readiness request used `Cache-Control: no-cache`, so it bypassed the poisoned key that normal browsers received.

## Scope

- [x] Request canonical Admin JavaScript and CSS without cache-bypass headers during readiness checks.
- [x] Reject HTML fallbacks, incorrect MIME types, `immutable`, or positive `max-age` asset responses.
- [x] Maintain custom Admin Pages CNAMEs as DNS-only records so zone cache rules cannot override Pages delivery.
- [x] Add Admin-owned security headers, require asset revalidation, and move theme initialization to a CSP-compatible external script.
- [x] Replace the project-site one-year asset cache override with deployment-safe revalidation.
- [x] Record the owner decision that a branded redirect hostname is unnecessary for the isolated test-only Demo.
- [x] Pass the full release regression and push v0.29.1; production deployment completed but canonical readiness exposed the remaining proxied edge-cache behavior.
- [x] Continue the final production recovery in `.codex/tasks/production-admin-cache-hardening-2026-07-22.md`.

Local verification currently passes 81 deployment, 110 Worker, 64 Admin unit, 25 Admin browser, 6 Demo API, and 4 project-site tests; Worker type-check, Admin/Site builds, and the official npm audit also pass.

## Safety Boundaries

- Redirect handlers, redirect decisions, asynchronous analytics, D1/KV ownership, migrations, Worker routes, production records, and stored data are unchanged.
- The production DNS change is limited to the existing Admin CNAME proxy flag and target; no Worker or short-link hostname changes.

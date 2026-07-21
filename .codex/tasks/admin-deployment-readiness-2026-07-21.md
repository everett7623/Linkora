# Admin Deployment Readiness

Date: 2026-07-21
Version: 0.28.5
Status: Complete

## Goal

Prevent an online upgrade from refreshing the Admin while the custom Pages domain still serves the SPA HTML fallback for newly deployed JavaScript or CSS assets.

## Evidence

- Production workflow run `29798209627` completed successfully for v0.28.4.
- `https://admin.uukk.de/` advertised v0.28.4 but rendered an empty `#root`.
- Its initial `/assets/index-DkNX9uEz.js` request returned the 1,627-byte Admin HTML document with `Content-Type: text/html` instead of JavaScript.
- The Pages default domain served the same asset as `application/javascript`; the custom domain served it correctly only after propagation and cache revalidation.

## Work

- [x] Capture production HTML, asset headers, DOM state, and workflow evidence.
- [x] Add an Admin readiness verifier for version metadata and initial asset MIME types.
- [x] Keep the deployment run active until the configured Admin origin is ready.
- [x] Add deterministic regression coverage for the transient Pages HTML fallback.
- [x] Synchronize v0.28.5 release metadata and pass 78 deployment, 104 Worker, 58 Admin unit, and 25 Admin browser checks plus affected builds.

## Safety Boundary

- The check is read-only and sends no Admin token, API token, or browser credential.
- Redirect handlers, Worker request behavior, D1, KV, migrations, production data, and Demo isolation are unchanged.

# Browser Health CORS Caused A False Upgrade Timeout

Date: 2026-07-20
System: Linketry Admin, Cloudflare Pages, Cloudflare Workers, GitHub Actions

## Symptom

The protected production workflow completed successfully and deployed the expected release, but the still-open Admin page eventually reported that the expected version was not published in time.

## Production Evidence

- Workflow run `29723961805` completed successfully for commit `be9823d6743e49d0f5b8cbb521378a8df2098749`.
- GitHub deployment `5518104020` recorded the same commit under `production`.
- `https://go.uukk.de/health` returned v0.27.4 with `Cache-Control: no-store, private`.
- Fresh Admin HTML reported v0.27.4, while the open page still contained the v0.27.3 meta version and JS asset.
- Sending `Origin: https://admin.uukk.de` to `/health` returned no `Access-Control-Allow-Origin` header.

## Root Cause

Worker CORS middleware covered `/api/*` only. Online-upgrade runtime verification used the public `/health` endpoint across the separately hosted Admin and Worker origins. The browser blocked the readable response, every check was treated as a transient interruption, and the old page eventually mapped the exhausted checks to a deployment timeout.

## Fix

- Reuse a dedicated Hono CORS middleware for `/health` GET and OPTIONS requests.
- Keep the endpoint public, credential-free, and limited to existing health/version metadata.
- Return `verification_failed` after a successful workflow when the runtime version cannot be confirmed, instead of claiming the deployment timed out.
- Preserve both exact-version fast reload and the bounded finalizing reload fallback.

## Regression Boundary

- Worker tests assert cross-origin GET and OPTIONS headers and the absence of credential exposure.
- Admin unit tests cover stale versions and fetch failures after workflow success.
- A browser test uses separate Admin and Worker origins and verifies the fast success reload path.

## Lesson

Route mocks that return JSON can hide browser CORS enforcement. Cross-origin status checks need a server-side response-header assertion plus a browser test that uses distinct origins.

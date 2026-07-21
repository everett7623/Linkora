# Security

## Secrets

- Do not commit `.dev.vars`.
- Do not commit real `LINKETRY_ADMIN_TOKEN` values.
- Use `wrangler secret put LINKETRY_ADMIN_TOKEN` for production.
- Store the optional `LINKETRY_GITHUB_UPDATE_TOKEN` only as a GitHub repository secret and Worker secret. Restrict it to one repository with `Actions: write`; never expose it through `VITE_*` variables.
- Fresh self-hosting Cloudflare API tokens also need Workers Routes Edit scoped to the selected custom-domain zone; keep R2 and Queues permissions disabled unless those bindings are enabled.
- The manual-only **Sync Online Upgrade Secret** workflow validates the protected account and Worker inventory before writing that one Worker secret; it cannot deploy code or apply migrations.
- Keep migration tokens and Shlink API keys out of source control.

## Admin API

Admin login uses bearer-token auth:

```http
Authorization: Bearer <LINKETRY_ADMIN_TOKEN>
```

API tokens are stored as SHA-256 hashes in D1 and can be scoped as `read`, `write`, or `admin`. New token plaintext is returned only once when it is created.

All `/api/v1/*` routes must pass through `src/auth/index.ts`.

The online-upgrade dispatch endpoint requires the primary instance Admin token, not a scoped Linketry API token. Repository, workflow, and branch come only from Worker deployment configuration. The browser receives a sanitized run ID, status, conclusion, and GitHub URL, never the GitHub token.

### Official Public Demo Exception

The official Demo sets `LINKETRY_DEMO_MODE=read-only` only in its isolated Worker. In that mode, GET/HEAD/OPTIONS Admin API requests may run without an owner token so the public can explore synthetic data. Every mutating API method is rejected before routing, the Admin client independently rejects writes, and real redirect visits are not persisted. API reads also pass through a dedicated Cloudflare Rate Limiting binding keyed by a hash of the client address. If that binding is missing or fails, the Demo API fails closed with 503.

The Demo Admin asks for `VITE_LINKETRY_DEMO_ACCESS_CODE` before showing the synthetic dashboard. This is a public preview code stored only as a local browser grant; it is not API authentication and must not be reused as `LINKETRY_ADMIN_TOKEN`. The Worker API intentionally keeps public read access for a low-friction preview, while its read-only gate and native rate limiter remain the actual API boundary.

Production and normal self-hosted configurations must not set `LINKETRY_DEMO_MODE`. The Demo workflow also requires a separate Cloudflare account, resource inventory, scoped credentials, and protected production account/resource/domain lists. Its Cloudflare credential should be an account-owned API token restricted to the Demo account with only the bindings the workflow uses: Workers Scripts Edit, Workers KV Storage Edit, D1 Edit, Cloudflare Pages Edit, plus Workers R2 Storage Edit and Queues Edit when those optional resources are enabled. DNS or Workers Routes permissions are only needed when the selected routing mode manages those resources. Never reuse the production deployment token.

Demo advanced-feature fixtures use synthetic values and keep notification channels and webhooks disabled. The post-deployment parity check reads public assets and safe API endpoints only; its mutation probe targets a nonexistent route and must be rejected by Demo middleware before routing. The Demo workflow accepts only an isolated push from `main` or an explicitly confirmed manual run, and fails when its public Admin version, brand assets, read surface, or write boundary does not match the reviewed release.

## URL Safety

Long URLs must use `http://` or `https://`.

Rejected examples:

- empty URLs
- invalid URLs
- `javascript:`
- `data:`

Validation lives in `packages/shared/src/validators/index.ts`.

## Slug Safety

Allowed slug characters:

```txt
a-z A-Z 0-9 - _
```

Reserved paths such as `api`, `admin`, `health`, `login`, `settings`, static asset paths, and common metadata files are blocked.

## Redirect Safety

- Redirect stability is the top priority.
- Stats must run through `ctx.waitUntil()`.
- Stats failures must not break redirects.
- KV is a cache only; D1 remains the source of truth.
- Disabled, archived, expired, or max-clicked links must not keep redirecting through stale KV.

## Import Safety

- Preview before import.
- Default conflict strategy is skip.
- Never silently overwrite existing slugs.
- Admin downloads a pre-import backup before confirm import mutates data.

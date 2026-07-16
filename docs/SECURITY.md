# Security

## Secrets

- Do not commit `.dev.vars`.
- Do not commit real `LINKETRY_ADMIN_TOKEN` values.
- Use `wrangler secret put LINKETRY_ADMIN_TOKEN` for production.
- Keep migration tokens and Shlink API keys out of source control.

## Admin API

Admin login uses bearer-token auth:

```http
Authorization: Bearer <LINKETRY_ADMIN_TOKEN>
```

API tokens are stored as SHA-256 hashes in D1 and can be scoped as `read`, `write`, or `admin`. New token plaintext is returned only once when it is created.

All `/api/v1/*` routes must pass through `src/auth/index.ts`.

### Official Public Demo Exception

The official Demo sets `LINKETRY_DEMO_MODE=read-only` only in its isolated Worker. In that mode, GET/HEAD/OPTIONS Admin API requests may run without an owner token so the public can explore synthetic data. Every mutating API method is rejected before routing, the Admin client independently rejects writes, and real redirect visits are not persisted. API reads also pass through a dedicated Cloudflare Rate Limiting binding keyed by a hash of the client address. If that binding is missing or fails, the Demo API fails closed with 503.

Production and normal self-hosted configurations must not set `LINKETRY_DEMO_MODE`. The Demo workflow also requires a separate Cloudflare account, resource inventory, scoped credentials, and protected production account/resource/domain lists.

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

# Upgrading Pre-0.10 Installations

Linketry 0.11 completes the product-identity cutover and accepts only the canonical `LINKETRY_*` configuration, browser-storage keys, KV keys, backup marker, and Webhook headers. This guide is for installations that have not yet completed that cutover.

## Before You Deploy

1. Create and download a verified backup from the existing Admin.
2. Record the current D1 database ID, KV namespace IDs, R2 buckets, Queue, Worker routes, Pages project, and Admin token.
3. Copy every existing GitHub Actions value to its matching `LINKETRY_*` variable without changing resource IDs until the data migration is verified.
4. Set the Worker secret `LINKETRY_ADMIN_TOKEN` to the saved Admin token so existing clients continue to authenticate.
5. Confirm the generated `wrangler.toml` binds `DB` to the intended database ID before deploying.

Do not initialize, reset, seed Demo data, or copy production identifiers from the fresh-install guide during an upgrade.

## Canonical Resource Names

Use these names for a completed Linketry deployment:

| Resource | Name |
|---|---|
| Worker | `linketry-worker` |
| D1 | `linketry-db` |
| KV | `LINKETRY_KV` |
| KV preview | `LINKETRY_KV_PREVIEW` |
| R2 production | `linketry-backups` |
| R2 preview | `linketry-backups-dev` |
| Queue | `linketry-visits` |
| Pages | `linketry-admin` |

Cloudflare does not provide an in-place rename for every resource type. For D1, R2, Worker, and Pages, create the canonical resource, copy and verify the data or deployment, switch bindings and domains, and only then remove the superseded resource. KV namespaces and Queues can retain their IDs while their display names change.

## Compatibility Removed In 0.11

- Worker configuration reads only `LINKETRY_ADMIN_TOKEN`, `LINKETRY_VERSION`, and other `LINKETRY_*` variables.
- Admin storage uses only the canonical Linketry keys.
- Redirect caching uses only `linketry:slug:<domain>:<slug>`; D1 remains the source of truth.
- Backup import and restore require the `Linketry Backup` marker.
- Webhooks send only `X-Linketry-*` headers.
- `/api/v1/*` remains the canonical Admin API.

## Verification

After deploying against the verified bindings:

1. `GET /health` returns `name: "Linketry"` and the current release version.
2. An unauthenticated `GET /api/v1/auth/me` returns `401`.
3. Login succeeds with the saved token.
4. Existing links, tags, visits, domains, backups, and settings remain visible.
5. An existing short link redirects to the unchanged destination.
6. A newly exported backup has the expected link count and the `Linketry Backup` marker.

Keep the verified pre-cutover backup until all checks pass. Roll back by restoring the previous application revision and its recorded Cloudflare bindings; never recreate or overwrite D1 without a verified database-level reason.

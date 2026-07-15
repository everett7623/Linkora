# Upgrading From Linkora To Linketry

This is the non-destructive upgrade path for an existing Linkora deployment. It is intentionally separate from the fresh-install and official Demo guides.

## What This Upgrade Changes

- Product and runtime brand: `Linkora` → `Linketry`
- Package scope: `@linkora/*` → `@linketry/*`
- Canonical API namespace: `/api/v1/*`
- Canonical Worker variables and secret: `LINKETRY_*`
- Canonical Admin build variable: `VITE_LINKETRY_API_URL`
- Canonical browser storage and KV cache prefixes: `linketry_*` and `linketry:slug:*`
- New backup marker: `Linketry Backup`

It does not rename D1 tables, change link IDs or slugs, delete visits, reset settings, or seed data. Version `0.10.0` adds no D1 migration.

## Before You Deploy

1. Create and download a verified backup from the existing Admin.
2. Record the current D1 `database_id`, KV namespace IDs, R2 bucket names, Queue name, Worker routes, and Pages project.
3. Keep the existing production identifiers. Do not run `wrangler d1 create linketry` for this upgrade.
4. Confirm the generated `wrangler.toml` still binds `DB` to the existing D1 `database_id`.
5. Do not run factory reset, import Demo data, or copy identifiers from the fresh-install guide.

Resource display names such as `linkora-db` may remain unchanged. Data safety depends on the binding ID, not on renaming the resource in Cloudflare.

## Repository Variables

The `0.10.x` workflow prefers the new `LINKETRY_*` repository variables but falls back to the existing `LINKORA_*` values. This prevents an upgrade from silently selecting a new database or skipping deployment.

Copy each old value to the matching new name when convenient, without changing the value:

```txt
LINKORA_D1_DATABASE_ID       → LINKETRY_D1_DATABASE_ID
LINKORA_D1_DATABASE_NAME     → LINKETRY_D1_DATABASE_NAME
LINKORA_KV_NAMESPACE_ID      → LINKETRY_KV_NAMESPACE_ID
LINKORA_KV_PREVIEW_ID        → LINKETRY_KV_PREVIEW_ID
LINKORA_WORKER_NAME          → LINKETRY_WORKER_NAME
LINKORA_WORKER_DOMAINS       → LINKETRY_WORKER_DOMAINS
LINKORA_API_URL              → LINKETRY_API_URL
LINKORA_PAGES_PROJECT        → LINKETRY_PAGES_PROJECT
LINKORA_R2_BUCKET            → LINKETRY_R2_BUCKET
LINKORA_R2_PREVIEW_BUCKET    → LINKETRY_R2_PREVIEW_BUCKET
LINKORA_VISITS_QUEUE         → LINKETRY_VISITS_QUEUE
```

Do not delete the old variables until the upgraded Worker and Admin pass the checks below.

## Admin Token

The Worker reads `LINKETRY_ADMIN_TOKEN` first and falls back to the existing `ADMIN_TOKEN`. The deployment workflow preserves an existing Worker `ADMIN_TOKEN` instead of rotating it.

- If the old Worker secret exists, the first Linketry deployment keeps it and existing logins continue working.
- To finish the rename, set `LINKETRY_ADMIN_TOKEN` to the same saved token value.
- Do not generate a different token unless you intentionally want to revoke existing Admin sessions and clients.

## API And Browser Compatibility

- New Admin builds call `/api/v1/*`.
- The Worker continues serving legacy `/api/*` during the `0.10.x` compatibility window and marks those responses deprecated.
- The Admin copies legacy `linkora_token`, `linkora_api_base`, `linkora.locale`, and `linkora_admin_mode` values to their Linketry keys on first read.
- Logout removes both token generations so a stale legacy token cannot reappear.

## Cache, Backup And Webhook Compatibility

- D1 remains the source of truth. A miss in the new `linketry:slug:*` KV key falls back to the legacy `linkora:slug:*` key and then to D1.
- Link updates and deletes clear both cache generations.
- New exports use `Linketry Backup`; restore and import still recognize `Linkora Backup`.
- Webhook deliveries use `X-Linketry-*` headers and temporarily include the matching `X-Linkora-*` headers for existing consumers.

## Verification

After deploying the Worker and Admin against the existing bindings:

1. `GET /health` returns `name: "Linketry"` and the current release version, `0.10.4` for this release.
2. An unauthenticated `GET /api/v1/auth/me` returns `401`.
3. Login succeeds with the existing saved token.
4. Existing links, tags, visits, domains, backups, and settings remain visible.
5. Test one existing short link and confirm the redirect target is unchanged.
6. Create a temporary link, test its redirect, then delete only that temporary link.
7. Download a new backup and verify its link count before removing any old repository variables.

## Rollback

Re-deploy the previous application revision while keeping the same Cloudflare bindings. Do not restore or recreate D1 unless a verified database-level problem requires it. Linketry writes new cache keys but deletes both cache generations on link mutation, so the previous Worker can safely fall back to the same D1 source of truth.

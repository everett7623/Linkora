# Backup And Restore

Linkora supports manual exports, pre-import backup downloads, and R2 backup snapshots.

## Available Exports

| Endpoint | Contents |
|----------|----------|
| `GET /api/export/links.csv` | Link records as CSV |
| `GET /api/export/links.json` | Link records as JSON |
| `GET /api/export/visits.csv` | Visit records as CSV |
| `GET /api/export/backup.json` | Links, tags, redirect rules, and settings |

All export endpoints require `Authorization: Bearer <ADMIN_TOKEN>`.

## Admin Exports

Open Admin, then Import / Export, then use the download buttons.

Before confirming an import, Admin downloads a file named like:

```txt
linkora-pre-import-backup-YYYY-MM-DD-HHMMSS.json
```

The import only proceeds after that backup download request succeeds.

## R2 Backups

Create the R2 buckets before deploying a Worker that has the `BACKUPS` binding:

```bash
npx wrangler r2 bucket create linkora-backups
npx wrangler r2 bucket create linkora-backups-dev
```

`apps/worker/wrangler.toml` binds production and preview buckets:

```toml
[[r2_buckets]]
binding = "BACKUPS"
bucket_name = "linkora-backups"
preview_bucket_name = "linkora-backups-dev"
```

The Admin Backups page can create an immediate R2 snapshot, download completed snapshots, preview restores, and restore a snapshot back into D1. The Worker also runs a daily scheduled backup through Cloudflare Cron Triggers.

Authenticated API endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/backups` | List recent backup records |
| `POST /api/backups/create` | Create an R2 backup now |
| `GET /api/backups/:id/download` | Download a completed R2 backup |
| `POST /api/backups/:id/restore-preview` | Preview restore counts and conflicts |
| `POST /api/backups/:id/restore` | Restore a completed R2 backup after confirmation |

## Backup Format

```json
{
  "name": "Linkora Backup",
  "version": "0.8.0",
  "exportedAt": "2026-07-01T00:00:00.000Z",
  "links": [],
  "tags": [],
  "redirectRules": [],
  "settings": {}
}
```

## Restore

Linkora `backup.json` files can be imported from the Admin Import / Export page by selecting `Linkora backup.json`.

Restore imports links, tag catalog entries, and redirect rules for links that are imported or overwritten. Conflict handling follows the selected import strategy:

- `skip` leaves existing slugs untouched.
- `rename` imports conflicting links with a new slug suffix.
- `overwrite` updates existing links.

Redirect rules for skipped links are skipped. Redirect rules for renamed links are attached to the new link ID. Redirect rules for overwritten links replace that link's existing rules.

## R2 One-Click Restore

The Admin Backups page can restore a completed R2 snapshot with a preview-first flow:

1. Choose `Restore` on a completed backup record.
2. Select `skip`, `rename`, or `overwrite`.
3. Review the dry-run summary for creates, overwrites, renames, skips, invalid rows, and redirect rules.
4. Confirm the restore.

Before applying a restore, Linkora creates a fresh `pre-restore` R2 snapshot. If the selected backup is too large for one-click restore, the API rejects it with a clear error so the operator can download and restore manually.

## Factory Reset Safety

The Admin Settings danger zone includes a factory reset workflow for cleaning a test or migration instance before long-term use.

Factory reset:

- previews affected table row counts before deletion;
- requires the exact confirmation phrase `RESET LINKORA`;
- creates a `pre-reset` R2 backup by default;
- clears short-link KV cache;
- deletes links, analytics, tags, domains, imports, API tokens, audit logs, redirect rules, and settings;
- restores default settings after deletion;
- preserves R2 backup records, R2 backup objects, and the environment `ADMIN_TOKEN`.

Reset does not delete R2 backups. Backup deletion and retention are handled separately so recovery points are not removed by accident.

Keep exported backups and D1 backups for disaster recovery, especially before using overwrite.

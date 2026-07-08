# Backup And Restore

Linkora supports manual exports, pre-import backup downloads, and R2 backup snapshots.

## Available Exports

| Endpoint | Contents |
|----------|----------|
| `GET /api/export/links.csv` | Link records as CSV |
| `GET /api/export/links.json` | Link records as JSON |
| `GET /api/export/visits.csv` | Visit records as CSV |
| `GET /api/export/backup.json` | Links, tags, and settings |

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

The Admin Backups page can create an immediate R2 snapshot and download completed snapshots. The Worker also runs a daily scheduled backup through Cloudflare Cron Triggers.

Authenticated API endpoints:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/backups` | List recent backup records |
| `POST /api/backups/create` | Create an R2 backup now |
| `GET /api/backups/:id/download` | Download a completed R2 backup |

## Backup Format

```json
{
  "name": "Linkora Backup",
  "version": "0.1.0",
  "exportedAt": "2026-07-01T00:00:00.000Z",
  "links": [],
  "tags": [],
  "settings": {}
}
```

## Restore

Linkora `backup.json` files can be imported from the Admin Import / Export page by selecting `Linkora backup.json`.

Restore imports links and tag catalog entries. Conflict handling follows the selected import strategy:

- `skip` leaves existing slugs untouched.
- `rename` imports conflicting links with a new slug suffix.
- `overwrite` updates existing links.

Keep exported backups and D1 backups for disaster recovery, especially before using overwrite.

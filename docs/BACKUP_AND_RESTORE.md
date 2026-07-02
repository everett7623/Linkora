# Backup & Restore

## Export Formats (V1)

Linkora supports three export formats:

| Format | Endpoint | Use Case |
|--------|----------|----------|
| CSV | `GET /api/export/links.csv` | Spreadsheet viewing, basic backup |
| JSON | `GET /api/export/links.json` | Programmatic access, reimport |
| Full Backup | `GET /api/export/backup.json` | Complete system backup with settings/tags |

## Exporting Data

### Via Admin Panel

1. Navigate to **Import / Export** page
2. Click the export button for your desired format
3. The file will download automatically

### Via API

```bash
# Export links as CSV
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://go.y8o.de/api/export/links.csv \
  -o linkora-links-$(date +%Y-%m-%d).csv

# Export links as JSON
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://go.y8o.de/api/export/links.json \
  -o linkora-links-$(date +%Y-%m-%d).json

# Full backup (links + settings + tags)
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://go.y8o.de/api/export/backup.json \
  -o linkora-backup-$(date +%Y-%m-%d).json
```

## Backup JSON Structure

```json
{
  "name": "Linkora Backup",
  "version": "0.1.0",
  "exportedAt": "2026-07-01T00:00:00.000Z",
  "links": [
    {
      "id": "lnk_abc123",
      "slug": "my-link",
      "long_url": "https://example.com",
      "title": "Example",
      "tags": "[\"tag1\",\"tag2\"]",
      "status": "active",
      "redirect_type": 302,
      "clicks": 42,
      "created_at": "2026-01-01T00:00:00.000Z",
      "updated_at": "2026-01-01T00:00:00.000Z"
    }
  ],
  "settings": {
    "default_redirect_type": "302",
    "default_domain": "go.y8o.de",
    "site_name": "Linkora"
  },
  "tags": [
    {
      "id": "tag_xyz",
      "name": "marketing",
      "color": "#3b82f6",
      "created_at": "2026-01-01T00:00:00.000Z",
      "updated_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

## File Naming Convention

```
linkora-backup-YYYY-MM-DD.json    # Full backup
linkora-links-YYYY-MM-DD.csv      # Links CSV
linkora-links-YYYY-MM-DD.json     # Links JSON
linkora-visits-YYYY-MM-DD.csv     # Visits CSV (V2)
```

## Restore (V2+)

Full backup restore via `backup.json` import is planned for V2. In V1, you can:

1. Re-import links using the Generic JSON import adapter
2. Manually set settings via the Settings page
3. Recreate tags via the Tags page

## Backup Best Practices

1. **Regular exports**: Download a `backup.json` weekly at minimum
2. **Before imports**: The system exports data before any import operation
3. **Before major changes**: Export before bulk edits or migrations
4. **Store off-site**: Keep backups outside of Cloudflare (local disk, S3, etc.)

## V3 Auto-Backup (Planned)

V3 will add:

- Automatic daily backup to Cloudflare R2
- Configurable retention (default: 30 days)
- One-click restore from any backup
- Backup status in the dashboard
- Cron Trigger for scheduled backups

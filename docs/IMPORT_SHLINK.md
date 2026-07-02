# Shlink Import Guide

## Supported Formats

- **JSON**: Shlink export JSON (array of short URL objects)
- **JSONL**: One JSON object per line
- **CSV**: Shlink-style CSV export

## Export Data from Shlink

### Via Shlink CLI

```bash
shlink short-url:list --format=json > shlink-export.json
```

### Via Shlink API

```bash
curl -H "X-Api-Key: YOUR_SHLINK_API_KEY" \
  "https://your-shlink.example.com/rest/v3/short-urls?itemsPerPage=-1" \
  | jq '.shortUrls.data' > shlink-export.json
```

### Via Database Export

Export the `short_urls` table from your Shlink database as JSON or CSV.

## Field Mapping

| Shlink Field | Linkora Field | Notes |
|-------------|---------------|-------|
| `shortCode` | `slug` | Preserved as-is |
| `shortUrl` | `short_url` | Full short URL |
| `longUrl` | `long_url` | Target URL |
| `title` | `title` | Optional |
| `tags` | `tags` | Array converted to JSON string |
| `dateCreated` | `created_at` | ISO 8601 |
| `visitsSummary.total` | `clicks` | Total click count |
| (auto) | `source` | Set to `"shlink"` |

## Import Process

### 1. Preview

Upload your Shlink export file via the admin Import/Export page or API:

```bash
curl -X POST https://go.y8o.de/api/import/preview \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "shlink",
    "data": <file_contents>
  }'
```

The preview response shows:

```json
{
  "success": true,
  "data": {
    "totalCount": 150,
    "validCount": 148,
    "conflictCount": 2,
    "invalidCount": 0,
    "conflicts": ["abc", "xyz"],
    "items": [...]
  }
}
```

### 2. Review Conflicts

- **Conflicts** are slugs that already exist in Linkora
- V1 strategy: **skip** conflicting items (no data loss)
- V2 will add: rename, overwrite options

### 3. Confirm Import

```bash
curl -X POST https://go.y8o.de/api/import/confirm \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "shlink",
    "data": <file_contents>,
    "conflictStrategy": "skip"
  }'
```

### 4. Import Report

After import completes, you'll receive a report:

```json
{
  "success": true,
  "data": {
    "jobId": "imp_abc123",
    "totalCount": 150,
    "successCount": 148,
    "skippedCount": 2,
    "conflictCount": 2,
    "failedCount": 0
  }
}
```

## Important Notes

- **Original slugs are preserved** - imported short codes remain the same
- **Conflicts are never overwritten** silently in V1
- **Click counts are imported** but visit details are not (Shlink doesn't export individual visits)
- **Tags are imported** and auto-created if they don't exist in Linkora
- After import, test a sample of your most-visited slugs to verify redirects work

## Data Integrity

- The import adapter validates all URLs (must be `http://` or `https://`)
- Invalid slugs (containing special characters) are sanitized or skipped
- Empty `longUrl` entries are skipped
- The import system records all skipped/failed items in the job report

## Example Shlink JSON Format

```json
[
  {
    "shortCode": "abc",
    "shortUrl": "https://s.y8o.de/abc",
    "longUrl": "https://example.com/some-very-long-url",
    "title": "Example Link",
    "tags": ["marketing", "social"],
    "dateCreated": "2024-01-15T10:30:00+00:00",
    "visitsSummary": {
      "total": 1234,
      "nonBots": 1100,
      "bots": 134
    }
  }
]
```

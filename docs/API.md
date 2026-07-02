# API Reference

Base URL: `https://go.y8o.de` (or your configured domain)

## Authentication

All `/api/*` endpoints (except health) require a Bearer token:

```
Authorization: Bearer <ADMIN_TOKEN>
```

## Response Format

All API responses follow:

```json
{
  "success": true,
  "data": <response_data>
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Public Endpoints

### Health Check

```
GET /health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "name": "Linkora",
    "version": "0.1.0"
  }
}
```

### Redirect

```
GET /:slug
```

- Returns `302` (or `301`) redirect to `long_url`
- Returns `404` if slug not found
- Returns disabled page if link is disabled
- Async records visit statistics

---

## Auth

### Login

```
POST /api/auth/login
```

Body:
```json
{
  "token": "your-admin-token"
}
```

Response:
```json
{
  "success": true,
  "data": { "authenticated": true }
}
```

### Current User

```
GET /api/auth/me
```

Response:
```json
{
  "success": true,
  "data": { "role": "admin" }
}
```

---

## Links

### List Links

```
GET /api/links
```

Query parameters:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `keyword` | string | - | Search slug, URL, title, tags |
| `tag` | string | - | Filter by tag name |
| `status` | string | - | Filter: active, disabled, expired, archived |
| `source` | string | - | Filter by import source |
| `sort` | string | `created_at_desc` | Sort: `created_at_desc`, `created_at_asc`, `clicks_desc`, `clicks_asc`, `last_clicked_at_desc` |
| `page` | number | 1 | Page number |
| `pageSize` | number | 20 | Items per page |

Response:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "total": 150
  }
}
```

### Create Link

```
POST /api/links
```

Body:
```json
{
  "slug": "my-link",
  "long_url": "https://example.com/very-long-url",
  "title": "Example Link",
  "tags": "[\"marketing\"]",
  "redirect_type": 302,
  "status": "active"
}
```

- If `slug` is omitted, a random 6-character slug is generated
- `long_url` must start with `http://` or `https://`
- `slug` can only contain `a-z`, `A-Z`, `0-9`, `-`, `_`

### Get Link

```
GET /api/links/:id
```

### Update Link

```
PUT /api/links/:id
```

Body (partial update):
```json
{
  "long_url": "https://new-destination.com",
  "title": "Updated Title"
}
```

KV cache is automatically updated on edit.

### Delete Link

```
DELETE /api/links/:id
```

Permanently deletes the link and removes KV cache.

### Disable Link

```
POST /api/links/:id/disable
```

Sets status to `disabled`. Removes from KV cache (disabled links show a disabled page).

### Enable Link

```
POST /api/links/:id/enable
```

Sets status back to `active`. Re-populates KV cache.

---

## Tags

### List Tags

```
GET /api/tags
```

Response:
```json
{
  "success": true,
  "data": [
    { "id": "tag_abc", "name": "marketing", "color": "#3b82f6", ... }
  ]
}
```

### Create Tag

```
POST /api/tags
```

Body:
```json
{
  "name": "marketing",
  "color": "#3b82f6",
  "description": "Marketing links"
}
```

### Update Tag

```
PUT /api/tags/:id
```

### Delete Tag

```
DELETE /api/tags/:id
```

---

## Settings

### Get Settings

```
GET /api/settings
```

Response:
```json
{
  "success": true,
  "data": {
    "default_redirect_type": "302",
    "default_domain": "go.y8o.de",
    "site_name": "Linkora"
  }
}
```

### Update Settings

```
PUT /api/settings
```

Body:
```json
{
  "default_redirect_type": "301",
  "default_domain": "go.y8o.de",
  "site_name": "My Links"
}
```

---

## Import

### Preview Import

```
POST /api/import/preview
```

Body:
```json
{
  "source": "shlink",
  "data": [...]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "totalCount": 100,
    "validCount": 98,
    "conflictCount": 2,
    "invalidCount": 0,
    "conflicts": ["existing-slug-1", "existing-slug-2"],
    "items": [...]
  }
}
```

### Confirm Import

```
POST /api/import/confirm
```

Body:
```json
{
  "source": "shlink",
  "data": [...],
  "conflictStrategy": "skip"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "jobId": "imp_abc123",
    "totalCount": 100,
    "successCount": 98,
    "skippedCount": 2,
    "conflictCount": 2,
    "failedCount": 0
  }
}
```

### List Import Jobs

```
GET /api/import/jobs
```

### Get Import Job

```
GET /api/import/jobs/:id
```

---

## Export

### Export Links (CSV)

```
GET /api/export/links.csv
```

Returns CSV file download.

### Export Links (JSON)

```
GET /api/export/links.json
```

Returns JSON array of all links.

### Full Backup

```
GET /api/export/backup.json
```

Returns complete backup including links, settings, and tags.

---

## Overview Stats

```
GET /api/overview
```

Response:
```json
{
  "success": true,
  "data": {
    "totalLinks": 150,
    "totalClicks": 45000,
    "todayClicks": 120,
    "recentLinks": [...],
    "topLinks": [...]
  }
}
```

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate slug) |
| 500 | Internal server error |

# Linkora API

All `/api/*` endpoints require either the admin token or a scoped API token:

```http
Authorization: Bearer <ADMIN_TOKEN>
```

API token scopes:

| Scope | Access |
|-------|--------|
| `read` | Read-only `GET` endpoints |
| `write` | Read and mutating link/import/export helper endpoints |
| `admin` | Full access, including settings, audit logs, and API token management |

Responses use:

```json
{ "success": true, "data": {} }
```

or:

```json
{ "success": false, "error": "message" }
```

## Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/:slug` | Short-link redirect |
| `POST` | `/:slug` | Password-protected short-link continuation |

Redirect analytics are recorded asynchronously. Stats failures must not block redirects.

## Auth

| Method | Path |
|--------|------|
| `POST` | `/api/auth/login` |
| `GET` | `/api/auth/me` |
| `POST` | `/api/auth/logout` |

Admin login still uses `ADMIN_TOKEN`. API tokens are for API requests and are managed from the Admin panel.

## API Tokens

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tokens` | List API tokens without hashes |
| `POST` | `/api/tokens` | Create a token and return the plaintext value once |
| `POST` | `/api/tokens/:id/revoke` | Revoke a token |
| `DELETE` | `/api/tokens/:id` | Revoke a token |

## Domains

Domain endpoints require admin access. Link creation and update payloads can include a `domain` string. Redirects resolve by request host plus slug, with a fallback for legacy links that do not have a stored domain.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/domains` | List registered short domains |
| `POST` | `/api/domains` | Create a domain |
| `PUT` | `/api/domains/:id` | Update domain, default flag, or status |
| `DELETE` | `/api/domains/:id` | Delete a domain catalog entry |
| `POST` | `/api/domains/:id/set-default` | Mark a domain as the default |

## Redirect Rules

Redirect rule endpoints require admin access. Rules are evaluated by ascending `priority`; if no enabled rule matches, or if rule evaluation fails, the redirect uses the link's default `long_url`.

Supported `rule_type` values:

```txt
country
device
browser
referer
language
weighted
```

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/redirect-rules` | List all redirect rules |
| `GET` | `/api/redirect-rules?linkId=:id` | List rules for one link |
| `GET` | `/api/redirect-rules/:id` | Read one rule |
| `POST` | `/api/redirect-rules` | Create a rule |
| `PUT` | `/api/redirect-rules/:id` | Update a rule |
| `DELETE` | `/api/redirect-rules/:id` | Delete a rule |

Non-weighted rule payload:

```json
{
  "link_id": "link-id",
  "rule_type": "country",
  "priority": 10,
  "enabled": true,
  "values": ["us", "ca"],
  "targetUrl": "https://example.com/north-america"
}
```

Weighted/A-B rule payload:

```json
{
  "link_id": "link-id",
  "rule_type": "weighted",
  "priority": 20,
  "enabled": true,
  "targets": [
    { "url": "https://example.com/a", "weight": 70 },
    { "url": "https://example.com/b", "weight": 30 }
  ]
}
```

## Webhooks

Webhook endpoints require admin access. Deliveries are sent asynchronously and do not block link, import, backup, or redirect flows.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/webhooks/config` | Read webhook config without returning the signing secret |
| `PUT` | `/api/webhooks/config` | Update enabled state, URL, events, and optional signing secret |
| `POST` | `/api/webhooks/test` | Send a test delivery to the configured URL |

Supported event names:

```txt
link.created
link.updated
link.deleted
link.disabled
link.enabled
link.archived
link.restored
link.bulk
import.completed
backup.completed
backup.failed
```

Delivery headers include `X-Linkora-Event`, `X-Linkora-Timestamp`, and, when a secret is configured, `X-Linkora-Signature: sha256=<hex-hmac>`.

## Links

| Method | Path |
|--------|------|
| `GET` | `/api/links` |
| `POST` | `/api/links` |
| `GET` | `/api/links/:id` |
| `PUT` | `/api/links/:id` |
| `DELETE` | `/api/links/:id` |
| `POST` | `/api/links/:id/disable` |
| `POST` | `/api/links/:id/enable` |
| `POST` | `/api/links/:id/archive` |
| `POST` | `/api/links/:id/restore` |
| `POST` | `/api/links/bulk` |
| `POST` | `/api/links/bulk-tag` |
| `POST` | `/api/links/bulk-create` |

`GET /api/links` supports search, pagination, status, tag, source, domain, created date range, password, warning, limits, and sort query parameters.

`POST /api/links` and `PUT /api/links/:id` accept `domain` to set the short-link domain. If omitted, the Worker request host is used.

`POST /api/links/bulk-create` accepts `{ "items": [...] }` with up to 100 create-link payloads. Existing slugs are not overwritten.

## Import

| Method | Path |
|--------|------|
| `POST` | `/api/import/shlink-api/fetch` |
| `POST` | `/api/import/preview` |
| `POST` | `/api/import/confirm` |
| `GET` | `/api/import/jobs` |
| `GET` | `/api/import/jobs/:id` |
| `GET` | `/api/import/jobs/:id/report.csv` |

Generic CSV / JSON import preview and confirm requests can include `fieldMapping`, for example:

```json
{
  "source": "generic-csv",
  "content": "Code,Destination\nhello,https://example.com",
  "fieldMapping": {
    "slug": "Code",
    "longUrl": "Destination"
  }
}
```

## Export

| Method | Path |
|--------|------|
| `GET` | `/api/export/links.csv` |
| `GET` | `/api/export/links.json` |
| `GET` | `/api/export/visits.csv` |
| `GET` | `/api/export/backup.json` |

## Backups

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/backups` | List recent R2 backup records |
| `POST` | `/api/backups/create` | Create a full backup in R2 |
| `GET` | `/api/backups/:id/download` | Download a completed R2 backup |

Scheduled R2 backups are created by the Worker cron trigger configured in `apps/worker/wrangler.toml`.

## Groups

Campaign and project groups require admin access. They are stored as normal tags using the `campaign:<name>` and `project:<name>` naming convention, so existing link tag filters, bulk tag assignment, import, and backup flows keep working without a new table.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/groups` | List campaign and project groups with link and click totals |
| `GET` | `/api/groups?type=campaign` | List only campaign groups |
| `GET` | `/api/groups?type=project` | List only project groups |
| `POST` | `/api/groups` | Create a campaign or project group |
| `PUT` | `/api/groups/:id` | Rename or update a group tag |
| `DELETE` | `/api/groups/:id` | Delete a group and remove its tag from links |

Payload:

```json
{
  "type": "campaign",
  "name": "summer-launch",
  "color": "#38bdf8",
  "description": "Summer launch campaign"
}
```

## Tags And Settings

| Method | Path |
|--------|------|
| `GET` | `/api/tags` |
| `POST` | `/api/tags` |
| `PUT` | `/api/tags/:id` |
| `DELETE` | `/api/tags/:id` |
| `GET` | `/api/settings` |
| `PUT` | `/api/settings` |

## Metadata

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/metadata/title` | Fetch a page title for Create/Edit forms |

## Audit Logs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/audit` | List admin action and import audit events |

## Analytics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/analytics` | Click totals, daily trend, top dimensions, and recent visits |

`GET /api/analytics?days=30` limits the summary window. Visit writes keep using `ctx.waitUntil()` so analytics failures do not block redirects.

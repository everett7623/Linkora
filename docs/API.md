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

## System Capabilities

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| `GET` | `/api/system/capabilities` | `read` | Report core and optional deployment capabilities |

Response data has a stable shape:

```json
{
  "profile": "advanced",
  "core": { "d1": true, "kv": true },
  "advanced": {
    "r2Backups": true,
    "visitQueue": true,
    "configuredDomains": 2,
    "multipleDomains": true
  }
}
```

The endpoint reports runtime bindings and the domain catalog. It does not expose resource IDs, bucket names, queue names, secrets, or Cloudflare account metadata.

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

## Notification Channels

Notification endpoints require admin access. They configure scheduled original destination/Aff link failure and recovery alerts. Credentials are write-only: API responses report only whether each channel is configured.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notifications/config` | List Telegram, Discord, Slack, Feishu, DingTalk, and WeCom channel states |
| `PUT` | `/api/notifications/config/:provider` | Enable or disable a provider and optionally replace its credential |
| `POST` | `/api/notifications/test/:provider` | Send a test through the stored provider credential |

Telegram accepts `credential` as the bot token and `target` as the chat ID or `@channel`. Other providers accept the official Incoming Webhook URL as `credential`. Sending an empty credential preserves the stored value.

Scheduled failure and recovery deliveries use Linkora's built-in plain-text format. Messages include the short link when its domain is available, target URL, target status, HTTP status, response time, and an explicit UTC detection time. Notification templates are not stored per instance.

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
| `POST` | `/api/links/bulk-replace-url/preview` |
| `POST` | `/api/links/bulk-replace-url/confirm` |
| `POST` | `/api/links/migrate-domain/preview` |
| `POST` | `/api/links/migrate-domain/confirm` |

`GET /api/links` supports search, pagination, status, tag, source, domain, created date range, password, warning, limits, and sort query parameters.

`POST /api/links` and `PUT /api/links/:id` accept `domain` to set the short-link domain. If omitted, the Worker request host is used.

`POST /api/links/bulk-create` accepts `{ "items": [...] }` with up to 100 create-link payloads. Existing slugs are not overwritten.

Destination URL replacement and short-link domain migration are separate operations. Domain migration accepts a source and target hostname, updates every matching link's stored `domain` and generated `short_url`, and never changes `slug` or `long_url`.

Preview a domain migration first:

```json
{
  "source_domain": "s.y8o.de",
  "target_domain": "go.uukk.de"
}
```

Confirm with the exact `total` returned by preview. Linkora rejects the confirmation if the matching count changed in the meantime:

```json
{
  "source_domain": "s.y8o.de",
  "target_domain": "go.uukk.de",
  "expected_count": 195
}
```

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
| `GET` | `/api/export/analytics.csv` |
| `GET` | `/api/export/backup.json` |

## Backups

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/backups` | List recent R2 backup records |
| `POST` | `/api/backups/create` | Create a full backup in R2 |
| `GET` | `/api/backups/:id/download` | Download a completed R2 backup |
| `POST` | `/api/backups/:id/restore-preview` | Preview a restore plan without mutating data |
| `POST` | `/api/backups/:id/restore` | Restore a completed R2 backup after confirmation |

Scheduled R2 backups are created by the Worker cron trigger configured in `apps/worker/wrangler.toml`.

Restore preview payload:

```json
{
  "conflictStrategy": "skip"
}
```

`conflictStrategy` can be `skip`, `rename`, or `overwrite`. The restore endpoint requires an explicit confirmation and creates a `pre-restore` R2 snapshot before mutating D1:

```json
{
  "conflictStrategy": "rename",
  "confirm": true
}
```

## Maintenance

Maintenance endpoints require admin access. Reset is destructive and should be previewed first.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/maintenance/reset-preview` | Count rows and cache prefix affected by a factory reset |
| `POST` | `/api/maintenance/reset` | Reset the instance after exact confirmation |

Reset payload:

```json
{
  "confirmation": "RESET LINKORA",
  "createBackup": true
}
```

Reset deletes links, analytics, tags, domains, imports, API tokens, audit logs, redirect rules, settings, and short-link KV cache. It preserves R2 backup records, R2 backup objects, and the environment `ADMIN_TOKEN`. When `createBackup` is true, Linkora creates a `pre-reset` R2 backup before deleting data.

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
| `POST` | `/api/metadata/suggestions` | Suggest slug, title, description, and tags from URL/page metadata |

Suggestions payload:

```json
{
  "url": "https://example.com/path"
}
```

Suggestions response data:

```json
{
  "url": "https://example.com/path",
  "final_url": "https://example.com/path",
  "title": "Example Page",
  "description": "Short page summary",
  "slugs": ["example-page", "example"],
  "tags": ["example"],
  "metadata_fetched": true,
  "error": null
}
```

## Health Checks

Health check endpoints require admin access. Checks are manual and do not run in the redirect path, so slow or broken target pages do not affect short-link redirects.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/health-checks/url` | Check an arbitrary target URL |
| `POST` | `/api/health-checks/links/:id` | Check one stored link target |
| `POST` | `/api/health-checks/batch` | Check up to 50 active or selected links |

Batch payload:

```json
{
  "limit": 20
}
```

Or:

```json
{
  "ids": ["link-id-1", "link-id-2"]
}
```

## Audit Logs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/audit` | List admin action and import audit events |

## Analytics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/analytics` | Click totals, daily trend, top dimensions, UTM breakdowns, target breakdowns, conversions, and recent visits |
| `GET` | `/api/analytics/links/:id` | Single-link analytics detail with the same summary shape |
| `POST` | `/api/conversions` | Record a conversion or goal event for a link |

`GET /api/analytics?days=30` limits the summary window. Supported ranges are clamped to 1-365 days.

Supported analytics filters:

```txt
days
link_id
slug
domain
tag
campaign
project
country
device
browser
referer
utm_source
utm_medium
utm_campaign
utm_term
utm_content
```

Campaign and project filters map to managed tags, for example `campaign:launch`.

Response data includes:

- `totalClicks`
- `uniqueVisitors` — approximate, based on distinct hashed IPs
- `uniqueLinks`
- `botClicks`
- `conversionsTotal`
- `conversionRate`
- `daily`
- `topLinks`
- `topCountries`
- `topReferrers`
- `topBrowsers`
- `topDevices`
- `topOperatingSystems`
- `topUtmSources`
- `topUtmMediums`
- `topUtmCampaigns`
- `topUtmTerms`
- `topUtmContents`
- `topTargets`
- `topConversionEvents`
- `recentVisits`

Conversion payload:

```json
{
  "link_id": "link-id",
  "event_name": "signup",
  "value": 29,
  "currency": "USD",
  "metadata": { "plan": "starter" }
}
```

`POST /api/conversions` requires write access. The link can be identified by `link_id`, or by `slug` with optional `domain`.

Visit writes keep using `ctx.waitUntil()` or the optional queue path so analytics failures do not block redirects.

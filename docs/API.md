# Linketry API

The canonical API namespace is `/api/v1`. During the `0.10.x` upgrade window, the Worker also accepts legacy unversioned `/api/*` routes and adds a `Deprecation: true` response header. New Admin builds and integrations must use `/api/v1`; the compatibility alias is not the long-term contract.

The authenticated machine-readable contract is available at `GET /api/v1/openapi.json`. An authenticated Swagger UI is available at `GET /api/v1/docs`. Supply an Admin token or scoped API token as `Authorization: Bearer <token>` when loading either resource; the generated contract contains no real token or secret examples. The OpenAPI inventory is checked against mounted Hono route declarations in the Worker test suite so new or removed endpoints require an intentional contract update.

Online upgrade capability and status are exposed through `GET /api/v1/system/upgrade` and `GET /api/v1/system/upgrade/{runId}`. `POST /api/v1/system/upgrade` dispatches only the fixed deployment workflow and requires the primary instance Admin token; scoped API tokens cannot trigger it. Responses never contain the Worker-side GitHub token.

Browser extensions, Raycast commands, Shortcuts, MCP bridges, and other clients should generate or validate integrations against this `/api/v1` contract. They must store bearer tokens in their platform's secret storage, request the narrowest useful scope, tolerate the standard `{ success, data }` / `{ success, error }` envelopes, and must not target the deprecated `/api` alias.

`GET /api/v1/links/duplicates?url=<destination>&excludeId=<link-id>&limit=5` returns existing links with the same normalized destination. The comparison normalizes URL parsing, host casing, default ports, and query-parameter order while preserving meaningful protocols, paths, query values, and fragments. `excludeId` should be supplied while editing. Results are advisory and bounded; link creation and editing continue to allow intentional duplicates.

All `/api/v1/*` endpoints require either the admin token or a scoped API token:

```http
Authorization: Bearer <LINKETRY_ADMIN_TOKEN>
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
| `GET` | `/health` | Public health and runtime version; supports credential-free cross-origin Admin checks |
| `GET` | `/:slug` | Short-link redirect |
| `POST` | `/:slug` | Password-protected short-link continuation |

Redirect analytics are recorded asynchronously. Stats failures must not block redirects.

`/health` allows cross-origin GET and OPTIONS requests because the static Admin and Worker are normally hosted on different origins. The response contains only public health and version metadata, never Admin credentials or private instance data.

## Auth

| Method | Path |
|--------|------|
| `POST` | `/api/v1/auth/login` |
| `GET` | `/api/v1/auth/me` |
| `POST` | `/api/v1/auth/logout` |

Admin login still uses `LINKETRY_ADMIN_TOKEN`. API tokens are for API requests and are managed from the Admin panel.

## System Capabilities

| Method | Path | Scope | Description |
|--------|------|-------|-------------|
| `GET` | `/api/v1/system/capabilities` | `read` | Report core and optional deployment capabilities |

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
| `GET` | `/api/v1/tokens` | List API tokens without hashes |
| `POST` | `/api/v1/tokens` | Create a token and return the plaintext value once |
| `POST` | `/api/v1/tokens/:id/revoke` | Revoke a token |
| `DELETE` | `/api/v1/tokens/:id` | Revoke a token |

## Domains

Domain endpoints require admin access. Link creation and update payloads can include a `domain` string. Redirects resolve by request host plus slug, with a fallback for legacy links that do not have a stored domain.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/domains` | List registered short domains |
| `POST` | `/api/v1/domains` | Create a domain |
| `PUT` | `/api/v1/domains/:id` | Update domain, default flag, or status |
| `DELETE` | `/api/v1/domains/:id` | Delete a domain catalog entry |
| `POST` | `/api/v1/domains/:id/set-default` | Mark a domain as the default |

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
| `GET` | `/api/v1/redirect-rules` | List all redirect rules |
| `GET` | `/api/v1/redirect-rules?linkId=:id` | List rules for one link |
| `GET` | `/api/v1/redirect-rules/:id` | Read one rule |
| `POST` | `/api/v1/redirect-rules` | Create a rule |
| `PUT` | `/api/v1/redirect-rules/:id` | Update a rule |
| `DELETE` | `/api/v1/redirect-rules/:id` | Delete a rule |

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
| `GET` | `/api/v1/webhooks/config` | Read webhook config without returning the signing secret |
| `PUT` | `/api/v1/webhooks/config` | Update enabled state, URL, events, and optional signing secret |
| `POST` | `/api/v1/webhooks/test` | Send a test delivery to the configured URL |

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
link.clicked
import.completed
backup.completed
backup.failed
health_check.failed
health_check.recovered
```

Delivery headers include `X-Linketry-Event`, `X-Linketry-Timestamp`, and, when a secret is configured, `X-Linketry-Signature: sha256=<hex-hmac>`.

`link.clicked` is a high-volume opt-in event and is excluded from the default event set. It is emitted only after core visit accounting from Queue or `ctx.waitUntil()` post-processing. Its payload contains only an opaque click ID, `occurred_at`, `is_bot`, and the link ID/slug/domain; it excludes IP/IP hash, User-Agent, Referer, country, signing credentials, and destination URLs.

Webhook deliveries retry transient network, `408`, `425`, `429`, and `5xx` failures up to three total attempts. All attempts reuse the same event ID, timestamp, body, and signature so receivers can deduplicate by the envelope `id`. Other `4xx` responses are not retried.

## Notification Channels

Notification endpoints require admin access. They configure scheduled original destination/Aff link failure and recovery alerts. Credentials are write-only: API responses report only whether each channel is configured.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/notifications/config` | List Telegram, Discord, Slack, Feishu, DingTalk, and WeCom channel states |
| `PUT` | `/api/v1/notifications/config/:provider` | Enable or disable a provider and optionally replace its credential |
| `POST` | `/api/v1/notifications/test/:provider` | Send a test through the stored provider credential |

Telegram accepts `credential` as the bot token and `target` as the chat ID or `@channel`. Other providers accept the official Incoming Webhook URL as `credential`. Sending an empty credential preserves the stored value.

Scheduled failure and recovery deliveries use Linketry's built-in plain-text format. Messages include the short link when its domain is available, target URL, target status, HTTP status, response time, and an explicit UTC detection time. Notification templates are not stored per instance.

The same configured channels also receive opt-in aggregate traffic anomaly and recovery notices. Those messages include only the 24-hour visit count, previous 7-day daily baseline, bot-rate comparison, and the thresholds that fired.

## Traffic Anomaly Alerts

Traffic anomaly endpoints require admin or appropriately scoped API-token access.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/analytics-alerts` | Read the opt-in configuration and latest aggregate state |
| `PUT` | `/api/v1/analytics-alerts/config` | Set minimum volume, volume/bot-rate thresholds, suppression, and enabled state |
| `POST` | `/api/v1/analytics-alerts/run` | Run the same bounded check used by the daily Cron; returns `409` while disabled |

Configuration fields are `enabled`, `minimumVisits` (10-100000), `volumeMultiplier` (1.25-10), `botRateDeltaPercentagePoints` (5-100), and `suppressionMinutes` (0-10080). The response state contains only aggregate counts/rates and timestamps.

## Links

| Method | Path |
|--------|------|
| `GET` | `/api/v1/links` |
| `POST` | `/api/v1/links` |
| `GET` | `/api/v1/links/:id` |
| `PUT` | `/api/v1/links/:id` |
| `DELETE` | `/api/v1/links/:id` |
| `POST` | `/api/v1/links/:id/disable` |
| `POST` | `/api/v1/links/:id/enable` |
| `POST` | `/api/v1/links/:id/archive` |
| `POST` | `/api/v1/links/:id/restore` |
| `POST` | `/api/v1/links/bulk` |
| `POST` | `/api/v1/links/bulk-tag` |
| `POST` | `/api/v1/links/bulk-create` |
| `POST` | `/api/v1/links/bulk-replace-url/preview` |
| `POST` | `/api/v1/links/bulk-replace-url/confirm` |
| `POST` | `/api/v1/links/migrate-domain/preview` |
| `POST` | `/api/v1/links/migrate-domain/confirm` |

`GET /api/v1/links` supports search, pagination, status, tag, source, domain, created date range, password, warning, limits, and sort query parameters. `page` is a positive integer capped at 100,000; `pageSize` is capped at 100. Invalid values fall back to the documented defaults. Every sort uses the link ID as a deterministic tie-breaker so equal timestamps or click counts cannot move unpredictably between pages.

`POST /api/v1/links` and `PUT /api/v1/links/:id` accept `domain` to set the short-link domain. If omitted, the Worker request host is used.

`POST /api/v1/links/bulk-create` accepts `{ "items": [...] }` with up to 100 create-link payloads. Existing slugs are not overwritten.

Destination URL replacement and short-link domain migration are separate operations. Domain migration accepts a source and target hostname, updates every matching link's stored `domain` and generated `short_url`, and never changes `slug` or `long_url`.

Preview a domain migration first:

```json
{
  "source_domain": "s.y8o.de",
  "target_domain": "go.uukk.de"
}
```

Confirm with the exact `total` returned by preview. Linketry rejects the confirmation if the matching count changed in the meantime:

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
| `POST` | `/api/v1/import/shlink-api/fetch` |
| `POST` | `/api/v1/import/preview` |
| `POST` | `/api/v1/import/confirm` |
| `GET` | `/api/v1/import/jobs` |
| `GET` | `/api/v1/import/jobs/:id` |
| `GET` | `/api/v1/import/jobs/:id/report.csv` |

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

Import `content` is limited to 10 MiB after UTF-8 encoding, and one preview or confirmation job can normalize at most 50,000 items. Preview and confirm reject oversized content with HTTP `413`; an asynchronous confirm job that exceeds the item limit finishes as `failed` before any D1 link write. The Shlink API pull endpoint has a lower 5,000-item and 100-page operating limit because it performs sequential external requests; it returns HTTP `413` instead of silently truncating larger pagination results. Use reviewed file-import batches for larger migrations.

## Export

| Method | Path |
|--------|------|
| `GET` | `/api/v1/export/links.csv` |
| `GET` | `/api/v1/export/links.json` |
| `GET` | `/api/v1/export/visits.csv` |
| `GET` | `/api/v1/export/analytics.csv` |
| `GET` | `/api/v1/export/backup.json` |

## Backups

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/backups` | List recent R2 backup records |
| `POST` | `/api/v1/backups/create` | Create a full backup in R2 |
| `GET` | `/api/v1/backups/:id/download` | Download a completed R2 backup |
| `POST` | `/api/v1/backups/:id/restore-preview` | Preview a restore plan without mutating data |
| `POST` | `/api/v1/backups/:id/restore` | Restore a completed R2 backup after confirmation |

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
| `GET` | `/api/v1/maintenance/reset-preview` | Count rows and cache prefix affected by a factory reset |
| `POST` | `/api/v1/maintenance/reset` | Reset the instance after exact confirmation |

Reset payload:

```json
{
  "confirmation": "RESET LINKETRY",
  "createBackup": true
}
```

Reset deletes links, analytics, tags, domains, imports, API tokens, audit logs, redirect rules, settings, and short-link KV cache. It preserves R2 backup records, R2 backup objects, and the environment `LINKETRY_ADMIN_TOKEN`. When `createBackup` is true, Linketry creates a `pre-reset` R2 backup before deleting data.

## Groups

Campaign and project groups require admin access. They are stored as normal tags using the `campaign:<name>` and `project:<name>` naming convention, so existing link tag filters, bulk tag assignment, import, and backup flows keep working without a new table.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/groups` | List campaign and project groups with link and click totals |
| `GET` | `/api/v1/groups?type=campaign` | List only campaign groups |
| `GET` | `/api/v1/groups?type=project` | List only project groups |
| `POST` | `/api/v1/groups` | Create a campaign or project group |
| `PUT` | `/api/v1/groups/:id` | Rename or update a group tag |
| `DELETE` | `/api/v1/groups/:id` | Delete a group and remove its tag from links |

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
| `GET` | `/api/v1/tags` |
| `POST` | `/api/v1/tags` |
| `PUT` | `/api/v1/tags/:id` |
| `DELETE` | `/api/v1/tags/:id` |
| `GET` | `/api/v1/settings` |
| `PUT` | `/api/v1/settings` |

## Metadata

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/metadata/title` | Fetch a page title for Create/Edit forms |
| `POST` | `/api/v1/metadata/suggestions` | Suggest slug, title, description, and tags from URL/page metadata |

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
| `POST` | `/api/v1/health-checks/url` | Check an arbitrary target URL |
| `POST` | `/api/v1/health-checks/links/:id` | Check one stored link target |
| `POST` | `/api/v1/health-checks/batch` | Check up to 50 active or selected links |

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
| `GET` | `/api/v1/audit` | List admin action and import audit events |

Audit pagination uses the same bounded `page` and `pageSize` contract as Links, with a default page size of 50 and deterministic `created_at DESC, id DESC` ordering.

## Analytics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/analytics` | Click totals, current/previous trends, weekday/hour heatmap, top dimensions, targets, conversions, and recent visits |
| `GET` | `/api/v1/analytics/links/:id` | Single-link analytics detail with the same summary shape |
| `POST` | `/api/v1/conversions` | Record a conversion or goal event for a link |

`GET /api/v1/analytics?days=30&timezone_offset=480` limits the summary window. Supported ranges are clamped to 1-365 days. `timezone_offset` is an integer number of minutes east of UTC from `-720` to `840`; invalid or omitted values use UTC.

Supported analytics filters:

```txt
days
timezone_offset
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
- `timezoneOffsetMinutes`, `rangeStart`, and `rangeEnd` — explicit local-day contract and UTC boundaries
- `uniqueVisitors` — approximate, based on distinct hashed IPs
- `uniqueLinks`
- `botClicks`
- `eligibleClicks` — total clicks minus classified bot clicks
- `conversionsTotal`
- `conversionRate` — conversion events per eligible human click, as a percentage
- `conversionAttributionAvailable`
- `daily` — zero-filled local dates with `clicks`, `humanClicks`, `botClicks`, and `uniqueVisitors`
- `previousPeriod` — the immediately preceding equal-length range with explicit boundaries, totals, and a zero-filled daily series
- `hourlyHeatmap` — exactly 168 fixed-offset local buckets with `weekday` (`0` Sunday through `6` Saturday), `hour` (`0`-`23`), total, human, and bot visits
- `topLinks`
- `topCountries`
- `geography` — up to 250 ISO country rows plus mapped and unknown click totals
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
  "event_id": "order:2026-0001",
  "link_id": "link-id",
  "event_name": "signup",
  "value": 29,
  "currency": "USD",
  "metadata": { "plan": "starter" }
}
```

`POST /api/v1/conversions` requires write access. The link can be identified by `link_id`, or by `slug` with optional `domain`. It is intended for trusted server-to-server integrations; never embed the Admin token or a write-scoped API token in browser code.

`event_id` is an optional idempotency key. The first insert returns `201` with the stored event and `duplicate: false`; a retry with the same identifier returns only `{ "id": "...", "duplicate": true }` with status `200`. If omitted, Linketry generates a new event identifier. Conversion value totals in `topConversionEvents` are grouped by `event_name` and `currency`.

Country, device, browser, and referrer filters are visit-only until session or visitor attribution is implemented. When any of those filters is active, `conversionAttributionAvailable` is `false`, conversion totals/rate are `null`, and the conversion event list is empty.

Visit writes keep using `ctx.waitUntil()` or the optional queue path so analytics failures do not block redirects.

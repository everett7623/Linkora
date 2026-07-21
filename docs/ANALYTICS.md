# Analytics And Tracking

Linketry records redirect analytics asynchronously so a statistics failure never blocks a redirect.

## Dashboard Coverage

The Admin panel has two dashboard-style pages:

| Page           | Purpose                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| Overview       | High-level dashboard with total links, total clicks, today's clicks, recently created links, and top links by clicks |
| Analytics      | Filterable traffic dashboard for trends, geography, audience composition, attribution, targets, and conversions      |
| Link Analytics | Single-link detail page with daily trend, referrers, devices, redirect targets, and conversions                      |

## Tracked Visit Data

Each visit can store:

- Link ID and slug
- Short-link domain
- Referer
- Cloudflare country code
- User agent
- Detected browser
- Detected operating system
- Detected device type
- Hashed visitor IP
- Basic bot flag
- Timestamp

V6 also records the resolved redirect target in `visit_targets` when smart redirect or A/B rules are evaluated. The target record is written separately from the core visit write, so failures in target analytics do not affect click counts or redirects.

## Analytics Filters

`GET /api/v1/analytics` and the Admin Analytics page support:

- `days`
- `timezone_offset` (minutes east of UTC; the Admin supplies the current browser offset)
- `link_id`
- `slug`
- `domain`
- `tag`
- `campaign`
- `project`
- `country`
- `device`
- `browser`
- `referer`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`

Campaign and project filters map to managed group tags, for example `campaign:launch` and `project:website`.

## Dashboard Metrics

The Analytics page currently shows:

- Total clicks
- Approximate unique visitors based on distinct hashed IPs
- Unique clicked links
- Bot clicks and bot rate
- Conversion Overview with eligible human clicks, conversion event count, Event Rate, goal breakdown, and currency-separated recorded values
- Browser-local daily trend with total, human, bot, and approximate unique-visitor series
- Line, area, and stacked-bar trend views
- Selected-range metrics compared with the immediately preceding equal-length period
- Dashed previous-period total overlaid on the current daily trend
- Browser-local weekday/hour activity heatmap with human and bot detail
- Local interactive world traffic map with the complete bounded country distribution
- Device donut and browser composition charts
- Top links
- Top countries
- Top referrers
- Top browsers
- Top devices
- Top operating systems
- Top UTM source, medium, campaign, term, and content values
- Redirect target / A-B target breakdown
- Conversion event breakdown
- Recent visits

Analytics summary reports can be exported from `GET /api/v1/export/analytics.csv`. Raw visits can still be exported from `GET /api/v1/export/visits.csv`.

The Analytics and Link Analytics pages refresh every 10 seconds by default. Operators can select a 5, 10, or 30 second interval, disable automatic refresh, or refresh manually. This is bounded near-real-time polling, not a WebSocket stream. Automatic refresh pauses while the browser tab is hidden, and the latest completed request wins if filters change while a request is running.

Overview and Analytics define "today" using the browser's current fixed UTC offset. The Admin sends `timezone_offset` in minutes east of UTC (for example, `480` for UTC+08:00). The Worker returns `timezoneOffsetMinutes`, `rangeStart`, and `rangeEnd`, fills every local date in the selected 1-365 day range, and keeps UTC as the storage format. API clients that omit the parameter receive the UTC boundary. A fixed offset is used for the selected range; it does not model a daylight-saving transition inside a historical range.

`previousPeriod` covers the immediately preceding equal-length range and reuses every active filter. It contains explicit UTC boundaries, total/human/bot counts, approximate unique visitors, and a zero-filled daily series aligned by position with the current range. When both periods are zero the comparison is steady; when only the previous period is zero the Admin displays new traffic instead of an infinite percentage.

`hourlyHeatmap` always contains 168 local-time cells. `weekday` uses SQLite's stable `0` (Sunday) through `6` (Saturday) numbering, and `hour` uses `0` through `23`. Each cell contains total, human, and bot visits. Aggregation uses the same fixed UTC offset as the daily range and therefore has the same documented daylight-saving limitation.

The `geography` response contains at most 250 grouped ISO 3166-1 alpha-2 country rows plus explicit `mappedClicks` and `unknownClicks` totals. The map geometry ships with the Admin bundle and never calls a third-party map service. `topCountries` remains available for compatible clients. CSV exports include the full country distribution, current and previous daily series, previous-period totals, and weekday/hour activity cells.

Period comparison and heatmap enrichment use three fixed aggregate queries: one previous summary, one previous daily grouping, and one current weekday/hour grouping. The query count does not grow with visits, days, or populated heatmap buckets.

Event Rate is calculated as conversion events divided by eligible human clicks. Classified bot clicks are excluded from the denominator. It is an event-performance metric, not a session/user conversion rate, and it can exceed 100% when one click creates multiple events. Conversion events do not currently store visit-level country, device, browser, or referrer attribution, so applying any of those filters makes conversion events, Event Rate, goal breakdowns, and recorded values unavailable rather than combining filtered clicks with unfiltered events.

## Conversion Events

Authenticated API clients can record conversion or goal events:

```http
POST /api/v1/conversions
Authorization: Bearer <token-with-write-scope>
Content-Type: application/json
```

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

`event_id` is optional and is limited to letters, numbers, dot, underscore, colon, and dash. When supplied, it is the idempotency key: repeating the same event returns the existing identifier with `duplicate: true` instead of inserting another row. Without `event_id`, Linketry generates a new identifier.

`event_name` uses the same bounded character set. Metadata is stored as a bounded JSON string. Conversion value totals are grouped by both event name and currency, so unlike currencies are never added together.

The Admin summarizes values by currency and retains the per-goal breakdown. Analytics CSV reports include the eligible human-click denominator, per-goal values, and currency-separated totals.

This endpoint requires a write-scoped API token and is intended for trusted server-to-server calls. Do not place an Admin token or write-scoped API token in public browser JavaScript. Browser-side conversion collection requires a future dedicated public ingestion boundary.

## Retention

The `analytics_retention_days` setting controls cleanup of old raw analytics rows during the scheduled Worker cron run:

- `0` keeps analytics indefinitely
- `1` to `3650` deletes older visits, daily stats, redirect target records, and conversion events

Retention cleanup runs separately from scheduled backups. Cleanup failures are logged but do not block backups or redirects.

## Traffic Anomaly Alerts

Traffic anomaly alerts are opt-in under **Analytics → Traffic Anomaly Alerts**. The daily Cron compares two bounded aggregate windows:

- Current window: the latest 24 hours
- Baseline window: the preceding 7 complete 24-hour periods, represented as a daily average

The detector currently covers:

- Visit volume at or above the configured baseline multiplier
- Bot rate at or above the configured percentage-point increase

Both windows must meet the configured minimum daily visit count before either signal is eligible. Operators can configure the minimum visits, volume multiplier, bot-rate increase, and repeat-suppression period. An authenticated **Check now** action uses the same policy and can send notifications when the feature is enabled.

Active signals, the most recent aggregate snapshot, and alert/recovery timestamps are stored in D1 settings. Alerts and recoveries use the existing configured notification channels. A delivery failure is logged and does not affect redirects or visit ingestion.

## Privacy Notes

Linketry stores a hash of the visitor IP rather than the raw IP address. The unique visitor count is approximate because it is based on distinct hashed IPs in the selected date range.

Public read-only statistics are implemented with per-link opt-in, hashed share tokens, bounded date ranges, optional country/referrer disclosure, noindex/nofollow responses, and private no-store caching. Public sharing is disabled by default.

Traffic anomaly detection stores only aggregate visit counts, bot counts, rates, windows, and alert state. It does not add or persist new visitor, IP, session, referrer, or country identifiers.

## Future Analytics Ideas

- Privacy-safe session or visitor-level conversion attribution
- More conversion attribution fields, such as external campaign IDs and client-provided visitor IDs
- Additional bounded anomaly dimensions, such as aggregate referrer or country shifts, only after a minimum-volume privacy contract is defined

Any additional traffic anomaly detection must keep using bounded scheduled or post-processing work. It must not add synchronous queries, target probes, or notification delivery to the redirect path.

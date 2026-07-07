# Linkora Roadmap

## V1: Stable Shlink Replacement

Status: complete and production smoke tested.

- Redirects with KV cache and D1 fallback
- Admin login
- Links CRUD
- Disable, enable, archive, restore, delete
- Tags field
- Basic click counts
- Shlink import
- Generic CSV / JSON import
- CSV / JSON / backup export
- Import preview and conflict detection
- Settings
- Health check

## V2: Admin Enhancements

Status: in progress.

Done:

- QR code generation
- Bulk disable, enable, archive, restore, delete
- Bulk tag assignment
- Expiry time
- Max clicks
- Auto-fetch page title
- Visits CSV export
- Tags management page
- Sink importer
- YOURLS importer
- Dub importer
- Rename/overwrite import conflict strategies
- `backup.json` restore import

Backlog:

- Password-protected links
- Safety warning page
- UTM templates
- Audit logs

## V3: Analytics And Automation

- Advanced analytics dashboard
- Daily stats aggregation
- R2 backups
- API token management
- Cloudflare Queues for async stats
- Cron backups
- Multi-domain management
- Webhooks

## V4: Smart Redirects And Operations

- Country/device/browser/referer redirect rules
- A/B tests and weighted traffic splitting
- Campaign or project grouping
- Link health checks
- AI slug and title suggestions
- UTM automation

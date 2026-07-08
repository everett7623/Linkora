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

Status: complete.

Done:

- QR code generation
- Bulk disable, enable, archive, restore, delete
- Bulk tag assignment
- Expiry time
- Max clicks
- Auto-fetch page title
- Visits CSV export
- Tags management page
- Password-protected links
- Safety warning page
- UTM templates
- Audit logs
- Shlink API pull import
- Sink importer
- YOURLS importer
- Dub importer
- Rename/overwrite import conflict strategies
- `backup.json` restore import
- Bulk create links
- Generic CSV field mapping enhancements
- Generic JSON / JSONL field mapping enhancements
- Links advanced filters

## V3: Analytics And Automation

Done:

- Advanced analytics dashboard
- Daily stats aggregation
- R2 backups
- API token management
- Cloudflare Queues for async stats
- Cron backups
- Multi-domain management
- Webhooks

## V4: Smart Redirects And Operations

Status: complete for the currently tracked V4 scope.

Done:

- Country/device/browser/referer/language redirect rules
- A/B tests and weighted traffic splitting
- Admin Redirect Rules page
- Redirect rules in `backup.json` export and restore
- Campaign and project grouping with `campaign:*` / `project:*` tags
- Manual URL and link health checks
- Local smart slug, title, description, and tag suggestions from URL/page metadata

Future optional enhancements:

- Bulk UTM automation
- Target failure alerts and periodic status monitoring
- Public stats pages, OpenGraph previews, link notes, and long-idle auto-archive

## V5: Open Source Release And Self-Hosted Deployment

Status: next recommended phase.

Product direction:

- Keep Linkora free and open source first
- Prioritize self-hosted deployment on the user's own Cloudflare account
- Do not add paid SaaS, subscription billing, or multi-tenant hosting complexity yet
- Preserve a complete, practical free self-hosted version even if paid services are considered later

Planned:

- Rewrite README for first-time external users
- Add a clean self-hosted deployment guide with example domains only
- Add `wrangler.toml.example` and clear copy/edit instructions
- Parameterize GitHub Actions with repository variables instead of project-specific domains
- Document all Cloudflare resources: Workers, D1, KV, R2, Queues, Pages, secrets, and custom domains
- Add post-deploy smoke test commands
- Remove or isolate personal deployment values such as `go.y8o.de`, `admin.y8o.de`, and `linkora-admin`
- Improve first-run guidance in Admin so new self-hosters can verify system status quickly

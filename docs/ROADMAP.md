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

- Moved into V7 and V9 planning below: target failure alerts, periodic monitoring, bulk URL/UTM operations, public stats pages, OpenGraph previews, link notes, and long-idle auto-archive

## V5: Open Source Release And Self-Hosted Deployment

Status: complete.

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
- Remove or isolate maintainer-specific deployment values from reusable public setup paths
- Improve first-run guidance in Admin so new self-hosters can verify system status quickly

Completed in the first V5 pass:

- Public self-hosting guide
- Worker `wrangler.toml` example
- Admin `.env.example`
- GitHub Actions variables for reusable Admin builds and Pages deploys
- Admin Setup page for first-run deployment checks
- Generated Worker deploy config from repository variables instead of a tracked production `wrangler.toml`
- GPL-3.0-only license and public repository readiness cleanup
- Analytics documentation for the current dashboard and next tracking gaps

## V6: Analytics Depth And Product Polish

Status: first pass complete.

Done:

- Per-link analytics detail page
- Filter analytics by link, domain, tag, campaign, project, country, device, browser, referer, and UTM values
- UTM source, medium, and campaign breakdown
- Smart redirect and A/B target breakdown through `visit_targets`
- Authenticated conversion or goal event API
- Exportable Analytics CSV reports
- Configurable raw analytics retention

Future optional enhancements:

- Done: better bot classification for search, preview, AI, SEO, monitoring, and automation clients
- Public read-only stats pages
- Session or visitor-level conversion attribution

## Long-Term Product Principles

Linkora is intended to remain useful for long-term self-hosted operation, not just a one-time migration tool.

- Redirect stability stays higher priority than dashboards, automation, and integrations
- The free self-hosted version should remain complete enough for personal sites, small teams, SEO projects, affiliate operations, and campaign tracking
- Advanced features should be progressive, optional, and easy to hide for users who only need simple short links
- Operational features should prefer safe previews, backups, dry runs, and reversible changes before mutation
- Public or shared views must be privacy-first and disabled by default
- Paid hosting, paid migration help, or managed support can be considered later, but should not weaken the self-hosted product

## V7: Operations, Recovery, And Monitoring

Status: in progress. R2 backup restore preview, one-click restore, pre-restore backup, restore reporting, and factory reset are implemented.

Goal: make Linkora safer to operate for years, with stronger recovery paths and proactive monitoring.

Planned:

- Done: one-click restore from R2 backup records in the Backups page
- Done: restore dry-run preview, conflict summary, pre-restore backup, and restore report
- Done: factory reset with preview, confirmation phrase, pre-reset backup, and KV cache clearing
- Done: backup retention policy for R2 objects and D1 backup records, with a configurable 30-day default
- Done: opt-in periodic target health monitoring through Cron, with manual checks kept available
- Target status history for links, including last status code, last checked time, and failure count
- Partial: scheduled anomalies emit optional signed webhooks; Admin notices and persisted alert state remain
- Alert controls, including retry windows, suppression, and recovery notifications
- Done: first-class `fallback_url` editing in Create/Edit Link, without changing redirect behavior
- Custom 404, expired, disabled, and warning page templates with safe defaults
- Done: operations dashboard for backup freshness, monitoring status, current failed targets, queue configuration, and deployment health
- Done: better bot classification for analytics and monitoring noise reduction

## V8: Usability Modes And Internationalization

Status: complete. Simple / Advanced mode, the required first-run wizard, full English / Simplified Chinese Admin coverage, locale-aware formatting, and browser smoke tests are implemented.

Goal: keep the product approachable for simple users while preserving advanced tools for power users.

Planned:

- Simple / Advanced mode toggle in Admin
- Simple mode hides or de-emphasizes advanced navigation such as Redirect Rules, Webhooks, API Tokens, advanced Analytics filters, backup internals, and bulk tooling
- Advanced mode exposes the full operator interface
- Instance-level feature visibility settings for optional modules
- Per-browser or per-admin preference for sidebar density, table density, and advanced panels
- Done: required first-run setup wizard verifies API readiness, one default short domain, and the first link from real instance state
- In progress: language switcher with English as the default and Simplified Chinese as an option
- In progress: i18n foundation covers core and advanced link management, deployment, operations, audit, backup/restore, and analytics workflows
- Done: public 404, disabled, expired, password, and warning pages support English and Simplified Chinese without changing redirect semantics
- Locale-aware date, time zone, number, and CSV/export formatting settings
- Help text that explains advanced fields only when advanced mode is enabled

## V9: Growth Tools, Reporting, And Link Intelligence

Status: planned.

Goal: support ongoing campaign, SEO, affiliate, and content operations without compromising redirect stability.

Planned:

- Bulk replace destination URLs with preview and rollback guidance
- Bulk append or normalize UTM parameters
- Saved UTM templates and campaign presets
- Link notes and affiliate/internal notes
- OpenGraph preview cards for destination pages
- Public read-only stats pages with privacy controls, share tokens, and per-link enablement
- Scheduled analytics report exports
- Saved Analytics filters and reusable report views
- Session or visitor-level conversion attribution where privacy-safe
- More conversion attribution fields, such as external campaign IDs and client-provided visitor IDs
- Long-idle auto-archive rules with review queue and dry-run mode
- Additional import adapters when demand is clear, such as Bitly

## V10: Collaboration And Governance

Status: future optional.

Goal: support teams only when the single-admin self-hosted product is stable enough to justify the added complexity.

Potential scope:

- Multi-user accounts
- Roles and permissions
- Team or workspace separation
- API token ownership and rotation policies
- Audit log export and retention policies
- Per-project access controls
- Optional managed hosting, migration services, or support offerings while preserving the free self-hosted edition

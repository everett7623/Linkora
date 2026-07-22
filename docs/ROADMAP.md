# Linketry Roadmap

## 0.10: Linketry Identity And Versioned API

Status: complete.

- Complete the Linketry project-identity rollout across code, hosting, and documentation
- Standardize author, repository, website, image, package scope, configuration prefix, and fresh-install database name
- Make `/api/v1` canonical while retaining a time-bounded legacy API alias
- Preserve existing D1 data, Cloudflare bindings, Admin sessions, KV cache fallback, backups, secrets, and repository variables during upgrade
- Keep fresh self-hosting, existing production upgrades, and the official Demo as separate deployment tracks

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

- Keep Linketry free and open source first
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
- Protected in-app online upgrades through a fixed repository, branch, and workflow with an owner-controlled confirmation
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
- Idempotent conversion retries through optional client-provided event IDs
- Human-click conversion-event rates, currency-separated values, and unavailable-state guards for unsupported visit-only filters
- Near-real-time Admin refresh with bounded polling and hidden-tab pause behavior
- Exportable Analytics CSV reports
- Configurable raw analytics retention

Future optional enhancements:

- Done: better bot classification for search, preview, AI, SEO, monitoring, and automation clients
- Done: public read-only stats pages with per-link opt-in and privacy controls
- Session or visitor-level conversion attribution
- Done in v0.22.0: scheduled privacy-safe volume and bot-rate anomaly detection with minimum samples, explainable thresholds, suppression, and recovery

## 0.27: Analytics Usability And Admin Performance

Status: complete.

- Progressive Analytics filters keep the date range visible and move attribution dimensions behind an explicit Advanced control
- Conversion Overview shows eligible human clicks, conversion events, Event Rate, goal breakdown, and currency-separated values
- Event Rate wording makes clear that event counts are not session/user conversion attribution and can exceed 100%
- Analytics CSV exports include currency-separated conversion value summaries
- Authenticated Admin pages load as route-level chunks while the shell remains stable during navigation
- The production entry chunk is reduced from about 573.7 KB to 298.0 KB before gzip
- Remaining pre-1.0 and optional product work is prioritized in `docs/PRODUCT_GAP_AUDIT.md`

## 0.27.1: Accessibility And Fresh-account UX

Status: complete and deployed to production and the isolated Demo.

- Core Admin routes, conversion controls, authenticated dialogs, themes, and mobile navigation have automated Axe regression coverage
- Shared modals and the mobile drawer support initial focus, contained Tab navigation, Escape dismissal, focus return, and background scroll containment
- Form errors/hints, notifications, loading controls, icon actions, filters, and template controls expose localized accessible semantics
- Reduced-motion preferences suppress nonessential transitions, and the tested dark/light UI meets the maintained contrast baseline
- A fresh-account owner checklist covers scoped Cloudflare credentials, idempotent bootstrap, GitHub environments, DNS-only Demo domains, optional R2, first-use smoke, upgrades, and rollback
- Admin and site use Vite 6.4.3, and the complete npm dependency tree reports no known vulnerabilities through the official registry
- Redirect handlers, asynchronous analytics, D1/KV ownership, migrations, production data, and Demo isolation are unchanged

## 0.27.8: Beginner Deployment Automation

Status: complete in the repository; production intentionally remains on 0.27.7 for the owner-controlled upgrade rehearsal.

- One dry-run/apply command configures the exact GitHub repository, Cloudflare account secret, core resource variables, and release approvals
- The production workflow creates a missing Admin Pages project and includes Worker secrets in the first code deployment
- A protected manual-only workflow can sync the optional GitHub update capability without deploying code or migrations
- Beginner documentation uses one recommended path and includes the required zone-scoped Workers Routes permission
- Deployment contracts cover command safety, workflow ordering, inventory failures, documentation drift, and protected secret synchronization
- Redirect handlers, asynchronous analytics, D1/KV ownership, migrations, production data, and Demo isolation are unchanged

## 0.28.0: Mainstream File Imports

Status: complete in the repository; production remains owner-controlled.

- Bitly CSV preserves documented custom links, destinations, titles, engagement totals, creation dates, source IDs, and active/deleted status
- Short.io CSV preserves documented source IDs, short domains and paths, destinations, titles, tags, click totals, timestamps, and expiry
- Conservative auto-detection runs before Generic CSV; partial unrelated files remain Generic
- Preview and conflict policy coverage keeps `skip` as the default while `rename` and `overwrite` remain explicit
- CSV parsing supports quoted commas, escaped quotes, CRLF, and multiline quoted values
- Rebrandly remains fixture-gated until a redacted current response and pagination contract are verified
- Redirect handlers, asynchronous analytics, D1/KV ownership, migrations, production data, and Demo isolation are unchanged

## 0.28.1: Import Operating Envelope

Status: complete in the repository; production remains owner-controlled.

- Shared Admin/Worker contract limits import content to 10 MiB UTF-8 and 50,000 normalized items
- Admin rejects oversized files before reading and clears stale import state after failure
- Preview, confirm, and generated Shlink API exports reject oversized content consistently
- Asynchronous confirmation stops before D1 writes when the item limit is exceeded
- Remaining pre-1.0 scale work covers representative D1 fixtures and response-time budgets outside imports
- Redirect handlers, asynchronous analytics, D1/KV ownership, migrations, production data, and Demo isolation are unchanged

## 0.28.2: Data Scale Contract

Status: complete in the repository; production remains owner-controlled.

- Links and Audit pagination use deterministic ID tie-breakers when timestamps or primary sort values match
- Malformed, negative, fractional, and oversized page inputs normalize through one bounded policy
- A Node 24 in-memory SQLite profile applies the maintained migrations and generates 20,000 Links, 100,000 Visits, and 20,000 Audit rows
- Executable budgets cover paginated list reads, representative Analytics aggregation, and a 10,000-row raw Health History payload capped to 200 stored items
- Remote D1 network latency remains an owner-controlled environment rehearsal, not a local-test claim
- Redirect handlers, asynchronous analytics ingestion, D1/KV ownership, migrations, production data, and Demo isolation are unchanged

## 0.28.3: Support And Compatibility Policy

Status: complete in the repository; production remains owner-controlled.

- GitHub private vulnerability reporting is the canonical security channel and live credentials are prohibited from reports
- Repository policy is complete; enabling the GitHub private-reporting setting remains an external pre-1.0 gate
- The latest release on `main` is the maintained pre-1.0 line, with patch/minor compatibility expectations documented
- Node 24, npm 10+, Wrangler 4.111+ within major 4, current browsers, and protected deployment workflows define the supported toolchain
- Instance owners receive one backup checklist, post-upgrade verification sequence, and migration-aware minimum rollback procedure
- Automated deployment tests prevent security links, toolchain metadata, compatibility language, and rollback requirements from drifting
- Redirect handlers, Worker runtime behavior, D1/KV ownership, migrations, production data, and Demo isolation are unchanged

## 0.28.4: Asynchronous Signed Click Webhook

Status: complete in the repository; production remains owner-controlled.

- `link.clicked` is an explicit opt-in event and is not added to existing/default subscriptions automatically
- Delivery begins only after core visit accounting and KV work in Queue or `ctx.waitUntil()` post-processing
- Payloads contain an opaque click ID, timestamp, bot classification, and link ID/slug/domain; visitor identifiers and destination URLs are excluded
- Transient failures receive at most three attempts with one stable event identity and HMAC-SHA256 signature
- Structured failure logs omit URL, secret, body, and visitor data
- Redirect handlers, redirect decisions, D1/KV ownership, migrations, production data, and Demo isolation are unchanged

## 0.28.6: Analytics Visual Depth

Status: complete in the repository; production and Demo rollout remain owner-controlled.

- Overview and Analytics use an explicit browser UTC offset for the local "today" boundary
- Daily Analytics rows are zero-filled and separate total, human, bot, and approximate unique-visitor counts
- Analytics provides line, area, and stacked-bar trends, a local interactive world map, and audience composition charts
- Country aggregation is capped at 250 ISO-code groups and preserves unknown traffic separately
- CSV reports include the explicit range, complete country distribution, and all daily series
- Redirect handlers, asynchronous visit recording, D1/KV ownership, migrations, production data, and Demo isolation are unchanged

## 0.28.7: Analytics Comparison And Heatmap

Status: complete in the repository; production rollout remains owner-controlled.

- The selected Analytics range is compared with the immediately preceding equal-length period under the same filters
- Previous-period totals and zero-filled daily rows are additive API fields and are included in CSV reports
- The current trend overlays the previous total without removing total, human, bot, or approximate unique-visitor series
- A fixed 7 x 24 local-time heatmap exposes total, human, and bot traffic by weekday and hour
- Three fixed aggregate queries keep comparison and heatmap cost independent of visit volume and populated buckets
- Redirect handlers, asynchronous visit recording, D1/KV ownership, migrations, production data, and Demo isolation are unchanged

## 0.28.8: Online Upgrade Readiness State

Status: complete in the repository; rollout remains owner-controlled.

- The real workflow-dispatch `204` response is treated as a no-run-ID deployment instead of assuming a pollable GitHub run
- Automatic reload requires the target Worker version, target Admin HTML version, and executable initial JavaScript/CSS assets
- Successful feedback is persisted before every reload path so the replacement Admin can confirm completion
- Background or offline tabs resume readiness checks immediately after visibility, focus, or connectivity returns
- Admin readiness requests are uncached, bounded by an eight-second timeout, and never include Admin or GitHub credentials
- Redirect handlers, deployment permissions, D1/KV ownership, migrations, analytics, production data, and Demo isolation are unchanged

## 0.29.0: Demo Sync, Upgrade Feedback, And Global Distribution

Status: complete in the repository; the isolated Demo synchronizes after the `main` push while production remains owner-controlled.

- The official isolated Demo follows reviewed pushes to `main` through its own workflow and credentials
- Manual Demo runs retain exact release, commit, migration-digest, and confirmation approvals
- Self-hosted production instances dispatch only their configured repository, branch, and protected deployment workflow
- GitHub workflow polling runs every two seconds and Worker/Admin release-readiness polling every second
- Dual Worker/Admin readiness remains mandatory; upgrade state appears immediately and completion remains visible after refresh
- The world traffic map uses ten intensity colors, per-link country distribution uses ten categorical colors, and Demo data covers ten countries
- Redirect handlers, asynchronous analytics ingestion, D1/KV ownership, migrations, and production resources are unchanged

## 0.29.1: Post-Deployment Status Reconciliation

Status: complete in the repository; deployment remains separated between the automatic isolated Demo and owner-controlled production tracks.

- Live checks confirm the isolated Demo serves v0.29.0 while production intentionally remains on v0.28.8 for upgrade validation
- GitHub update discovery reads the configured repository branch's `package.json`; a GitHub Release or tag is not required
- Optional Demo R2 bindings remain disabled and are not presented as part of the currently verified Demo capability surface
- Public 1.0 still requires independent fresh-account, remote-D1 scale, assistive-technology, and private vulnerability-reporting evidence; the synthetic Demo keeps its isolated `workers.dev` redirect origin
- Redirect handlers, asynchronous analytics ingestion, D1/KV ownership, migrations, production resources, and stored data are unchanged

## 0.29.6: Beginner-Friendly Project Site Deployment

Status: complete in the repository; publication follows the normal reviewed project-site workflow.

- The homepage exposes Live Demo, AI-assisted deployment, and GitHub source as clear first actions
- New self-hosters can choose a copyable AI-assistant prompt or the maintained command-line workflow
- Both routes explain the minimum Worker, D1, KV, Pages, and single-hostname profile without presenting optional infrastructure as required
- Copy feedback is accessible, mobile layouts keep commands readable, and permanent-free or one-click claims are intentionally avoided
- Worker, redirect, Admin, API, D1/KV, migration, and production deployment behavior remain unchanged

## 0.29.7: Public Deployment Page And Localization

Status: complete in the repository; publication follows the normal reviewed project-site workflow.

- The public site has a dedicated `/deploy/` page rather than embedding the full deployment guide on the homepage
- New self-hosters can start Cloudflare's authenticated repository launcher or follow the guarded repository workflow with dry runs and exact confirmation
- The quick launcher is explicit that account selection, D1/KV bindings, Pages/Admin settings, hostnames, and private Admin secrets remain owner choices
- Public-site English is the default; Simplified Chinese is complete, persists locally, accepts a `lang` query parameter, and uses a central locale registry for future translations
- Navigation uses a recognizable labeled GitHub mark and the deployment route is indexed in the sitemap
- Worker, redirect, Admin, API, D1/KV, migration, and production deployment behavior remain unchanged

## 0.29.5: Admin Hashed Cache Readiness

Status: complete; production run `29886864268` and isolated Demo run `29886793473` both passed readiness.

- Build and live checks require canonical Vite content-hashed JavaScript and CSS without query or fragment identities
- Long-lived caching is accepted only after the content hash is part of the canonical path
- Missing assets, HTML fallbacks, wrong MIME types, and non-hashed paths continue to fail closed
- Production and Demo render authenticated v0.29.5 Overview pages with canonical content-hashed assets
- Redirect logic, analytics, D1/KV ownership, migrations, and stored data remain unchanged

## 0.29.4: Admin Module Identity Recovery

Status: complete; production and Demo authenticated Overview pages render the recovered v0.29.4 Admin.

- Initial Admin JavaScript and CSS use canonical Vite content-hashed paths without query or fragment identities
- Build integrity and live readiness reject identity-changing URL suffixes, non-hashed paths, HTML fallbacks, and wrong MIME types
- Production and Demo deployment tracks render the built lazy Overview route in Chromium before Cloudflare writes
- A localized root fallback replaces silent blank pages after unexpected rendering exceptions
- Redirect logic, analytics, D1/KV ownership, migrations, and stored data remain unchanged

## 0.29.2: Admin Cache-Key And DNS Convergence Hardening

Status: in progress; implementation is complete and the reviewed production rollout remains.

- Versioned Admin JavaScript and CSS entry URLs prevent stale custom-domain cache entries from being reused across releases
- Production deployment can use the dedicated DNS token or the configured Cloudflare API token to enforce the Admin CNAME as DNS-only
- Canonical readiness continues to reject HTML fallbacks, wrong MIME types, and unsafe cache headers
- Redirect logic, analytics, D1/KV ownership, migrations, and stored data remain unchanged

## 0.29.3: Production Readiness Completion

Status: superseded by v0.29.4 after the live lazy-route module-identity regression was captured.

- Readiness requires the exact release query key on initial Admin JavaScript and CSS and continues to reject HTML or incorrect MIME responses
- Long-lived edge caching is accepted only for the release-versioned asset key
- A dedicated DNS token remains strict; a main-token fallback without Zone DNS permission emits an actionable warning and allows live readiness to decide the deployment result
- Live production and Demo verification showed that query-keyed document imports and canonical lazy-chunk imports evaluated two React module identities
- Redirect logic, analytics, D1/KV ownership, migrations, and stored data remain unchanged

## Long-Term Product Principles

Linketry is intended to remain useful for long-term self-hosted operation, not just a one-time migration tool.

- Redirect stability stays higher priority than dashboards, automation, and integrations
- The free self-hosted version should remain complete enough for personal sites, small teams, SEO projects, affiliate operations, and campaign tracking
- Advanced features should be progressive, optional, and easy to hide for users who only need simple short links
- Operational features should prefer safe previews, backups, dry runs, and reversible changes before mutation
- Public or shared views must be privacy-first and disabled by default
- Paid hosting, paid migration help, or managed support can be considered later, but should not weaken the self-hosted product

## V7: Operations, Recovery, And Monitoring

Status: complete for the currently tracked V7 scope.

Goal: make Linketry safer to operate for years, with stronger recovery paths and proactive monitoring.

Planned:

- Done: one-click restore from R2 backup records in the Backups page
- Done: restore dry-run preview, conflict summary, pre-restore backup, and restore report
- Done: factory reset with preview, confirmation phrase, pre-reset backup, and KV cache clearing
- Done: backup retention policy for R2 objects and D1 backup records, with a configurable 30-day default
- Done: opt-in hourly target health monitoring through a dedicated Cron, with manual checks kept available and daily maintenance kept separate
- Done: bounded scheduled target status history, including status code, checked time, response time, and failure count
- Done: scheduled anomalies and recoveries emit optional signed webhooks and appear as persisted Admin notices
- Done: scheduled original destination/Aff alerts support Telegram, Discord, Slack, Feishu, DingTalk, and WeCom with masked credentials and test delivery
- Done: alert controls for consecutive-failure thresholds, repeat suppression, and recovery notifications
- Done: first-class `fallback_url` editing in Create/Edit Link, without changing redirect behavior
- Done: custom 404, expired, disabled, and warning page messages with escaped plain-text variables and safe defaults
- Done: operations dashboard for backup freshness, monitoring status, current failed targets, queue configuration, and deployment health
- Done: better bot classification for analytics and monitoring noise reduction

## V8: Usability Modes And Internationalization

Status: complete. Simple / Advanced mode, the required first-run wizard, full English / Simplified Chinese Admin coverage, locale-aware formatting, per-browser density and themes, instance-level optional-module visibility, and browser smoke tests are implemented.

Goal: keep the product approachable for simple users while preserving advanced tools for power users.

Planned:

- Simple / Advanced mode toggle in Admin
- Simple mode hides or de-emphasizes advanced navigation such as Redirect Rules, Webhooks, API Tokens, advanced Analytics filters, backup internals, and bulk tooling
- Advanced mode exposes the full operator interface
- Done: instance-level feature visibility settings for optional modules, while keeping core and recovery routes reachable
- Done: per-browser sidebar and table density preferences with Simple/Advanced mode compatibility
- Done: accessible per-browser light, dark, and system-following theme preferences
- Done in v0.21.0 and restored to the Sidebar footer in v0.27.3: one compact group for language, light/dark theme, and the owner support link
- Done: required first-run setup wizard verifies API readiness, one default short domain, and the first link from real instance state
- Done: language switcher with English as the default and Simplified Chinese as an option
- Done: i18n foundation covers core and advanced link management, deployment, operations, audit, backup/restore, and analytics workflows
- Done in v0.20.0: typed locale registry, native-language options, catalog/placeholder CI gate, contribution guide, and browser persistence coverage
- Done: public 404, disabled, expired, password, and warning pages support English and Simplified Chinese without changing redirect semantics
- Next language wave: add German, French, Spanish, Portuguese (BR/PT), Indonesian, Italian, Korean, Vietnamese, and Traditional Chinese in small reviewed batches
- Language expansion gate: every new locale must have native-language labels, complete catalog parity, placeholder/interpolation tests, date/number/CSV formatting coverage, and browser smoke coverage for core workflows
- Locale-aware date, time zone, number, and CSV/export formatting settings
- Help text that explains advanced fields only when advanced mode is enabled

## V9: Growth Tools, Reporting, And Link Intelligence

Status: in progress. Privacy-first public read-only statistics sharing is implemented.

Goal: support ongoing campaign, SEO, affiliate, and content operations without compromising redirect stability.

Planned:

- Done: bulk replace destination URLs with preview and rollback guidance
- Done: migrate all matching stored short-link domains with preview, concurrency protection, KV invalidation, and migration records
- Done: bulk append or normalize UTM parameters with filter/selection scope, exact-count preview, a bounded 100-link D1 batch, selective KV invalidation, and a downloadable change record
- Done: saved personal UTM templates and campaign presets in Create/Edit Link
- Done: private internal link notes in Advanced Edit Link
- Done: authenticated OpenGraph preview cards in Advanced Create/Edit Link
- Done: public read-only stats pages with privacy controls, hashed share tokens, and per-link enablement
- Done: scheduled Analytics CSV report exports to R2 with saved-view support
- Done: saved Analytics filters and reusable report views
- Session or visitor-level conversion attribution where privacy-safe
- More attribution fields, such as external campaign IDs and privacy-safe visitor/session identifiers; retry idempotency is already available through `event_id`
- Done in v0.22.0: scheduled volume and bot-rate anomaly alerts with bounded aggregate windows and no redirect-path work; source/country shifts remain deferred pending a minimum-volume privacy contract
- Evaluate opt-in fallback_url failover from previously recorded health state; never probe a destination synchronously during redirect
- Long-idle auto-archive rules with review queue and dry-run mode
- Done in v0.28.0: fixture-backed Bitly and Short.io CSV imports; Rebrandly JSON/API remains second, and other providers wait for a current verified export contract

## Pre-1.0: Integration And Public Launch

Status: in progress. Bulk UTM, the authenticated OpenAPI contract, and duplicate destination detection are complete; implementation continues with deployment bootstrap.

Goal: close the highest-value Sink and public-launch gaps without putting optional presentation or integration work on the redirect hot path.

Ordered delivery:

1. Done: publish an authenticated OpenAPI contract and Swagger documentation, with route drift checks.
2. Done: warn about duplicate normalized destination URLs during create/edit while allowing intentional duplicates.
3. In progress: fresh self-hosting now has dry-run-first, confirmation-gated, idempotent D1/KV provisioning with unique names and binding output. Fresh, upgrade, and Demo tracks share redacted preflight checks, D1/KV account verification, and fail-closed isolation checks. The production workflow enforces approved release/commit/migration state plus backup-backed upgrade gates before any Cloudflare write; the separate Demo workflow adds protected-account enforcement and exact release approvals. Fresh-account rehearsal remains.
4. Done in v0.25.0: the independent official project site is live at `linketry.com`, and the isolated read-only Demo is live at `demo.linketry.com` with separate-account Worker, Pages, D1, KV, Queue, scoped credentials, a responsive complete Admin surface, advanced synthetic data, suppressed real-visitor analytics writes, and a native Worker rate limit. Optional R2 bindings remain disabled until the isolated account capability is activated and verified.
5. The asynchronous signed `link.clicked` webhook is complete in v0.28.4; add optional Cloudflare Access authentication only after JWT, CORS, CSRF, logout, and bearer-token recovery behavior share one reviewed contract.
6. Done in v0.16.0: Admin density and optional-module visibility preferences.
7. Theme preferences completed in v0.17.0, the optional Links card view in v0.19.0, and the community locale workflow in v0.20.0; follow with reviewed locale contributions, per-link social preview controls, and later ecosystem clients built against OpenAPI.

External prerequisites:

- The purchased `linketry.com` apex is active on the `linketry-site` Pages project and has passed DNS, TLS, HTTP, and canonical-metadata verification.
- The owner-managed `https://everettlabs.dev/coffee/` page is the active project and Admin support destination.
- The existing deployed Linketry instance and its data remain protected production resources; Demo workflows may not alter their DNS, bindings, migrations, backups, or stored data.

Deferred presentation and ecosystem work:

- Real-time event logs and a live globe remain optional after the API and deployment foundations are stable.
- Workers AI remains optional; local suggestions continue to work without an AI binding.
- Browser, Raycast, Shortcuts, MCP, and mobile clients wait for a stable OpenAPI contract.
- Iframe cloaking is not a planned core feature, and D1 remains the source of truth.

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

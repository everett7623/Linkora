# TASKS.md — Active Task List

Track active work items here. Move items between sections as they progress.
One item in "In Progress" at a time whenever possible.

---

## 🔴 In Progress

_(none)_

---

## External Prerequisites

- [ ] Activate/configure optional R2 bindings in the isolated Demo account
- [x] Configure the fine-grained `LINKETRY_GITHUB_UPDATE_TOKEN` for one-click upgrades

---

## ✅ Completed - Online Upgrade Health CORS (v0.27.5)

- [x] Add credential-free GET/OPTIONS CORS support to the public `/health` runtime-version endpoint
- [x] Separate runtime-version verification failure from deployment failure and workflow-timeout messaging
- [x] Add Worker, Admin unit, and browser regressions for successful deployment plus cross-origin verification
- [x] Record workflow run `29723961805`, production deployment `5518104020`, and live v0.27.4 evidence
- [x] Synchronize v0.27.5 package, runtime, workflow, example, changelog, progress, task, and deployment documentation
- [x] Pass 50 Admin unit, 22 Admin browser, 84 Worker, 64 deployment, 6 Demo API, and 4 project-site tests plus affected builds
- [x] Publish v0.27.5 to `main` with `[skip ci]` while production remains on v0.27.4 for the owner-controlled upgrade test

---

## ✅ Completed - Online Upgrade Auto Reload (v0.27.4)

- [x] Confirm workflow run `29718967204`, deployment `5517191479`, and production Worker/Admin v0.27.3 state
- [x] Preserve exact runtime-version verification and fast success reload
- [x] Add a bounded 10-second finalizing reload fallback for stale old pages
- [x] Add a real-browser regression for successful workflow plus stale runtime polling
- [x] Move version and update status below the Sidebar Logo while keeping the footer focused on preferences and logout
- [x] Add expanded, collapsed, and mobile Sidebar placement assertions
- [x] Synchronize v0.27.4 package, runtime, workflow, example, changelog, progress, task, and deployment documentation
- [x] Pass 48 Admin unit, 21 Admin browser, 82 Worker, 64 deployment, 6 Demo API, and 4 project-site tests plus affected builds
- [x] Publish v0.27.4 to `main` with `[skip ci]` while production remains on v0.27.3 for the owner-controlled upgrade test

---

## ✅ Completed - Sidebar Footer And Production Deployment Tracking (v0.27.3)

- [x] Move interface mode, language, theme, and owner-support controls from the desktop content toolbar to the Sidebar footer
- [x] Restore the three-icon utility row and separate interface-mode status presentation
- [x] Preserve expanded, collapsed, mobile, version/update, logout, and Demo read-only behavior
- [x] Diagnose online-upgrade run `29717446925` as a successful production deployment whose workflow lacked a GitHub environment binding
- [x] Bind the production deploy job to `production` without changing repository secrets, Cloudflare resources, or release gates
- [x] Add workflow-contract and operator-documentation coverage for the production environment
- [x] Pass 48 Admin unit, 20 Admin browser, 82 Worker, 64 deployment, 6 Demo API, and 4 project-site tests plus affected builds
- [x] Synchronize v0.27.3 package, runtime, workflow fallback, example, changelog, progress, roadmap, and task metadata
- [x] Publish v0.27.3 to `main` with `[skip ci]` so production remains on v0.27.2 for the owner-controlled online-upgrade test

---

## ✅ Completed - Online Upgrade Credential And Discovery Validation (v0.27.2)

- [x] Configure the repository-scoped `LINKETRY_GITHUB_UPDATE_TOKEN` with Actions read and write only
- [x] Redeploy production v0.27.1 and confirm workflow run `29715930612` copies the token into the Worker secret store
- [x] Pass 82 Worker, 64 deployment, 48 Admin unit, 6 Demo API, and 4 project-site tests plus all affected builds
- [x] Publish v0.27.2 to `main` with `[skip ci]` while production remains on v0.27.1
- [x] Confirm the authenticated production Admin detects v0.27.2 and exposes the online-upgrade action
- [x] Leave the final upgrade confirmation to the repository owner

---

## ✅ Completed - Accessibility And Fresh-account UX (v0.27.1)

- [x] Add automated Axe checks for all core Admin routes, conversion controls, dialogs, themes, and the mobile drawer
- [x] Trap and restore keyboard focus in shared modals and mobile navigation while preserving Escape dismissal
- [x] Associate form hints/errors, expose invalid and busy state, and label icon/filter/template controls in English and Chinese
- [x] Honor reduced-motion preferences and correct tested dark/light muted-text and primary-action contrast
- [x] Upgrade Admin/site Vite to 6.4.3 and confirm zero known full-tree npm vulnerabilities
- [x] Publish one fresh-account checklist for scoped Cloudflare credentials, bootstrap, GitHub environments, DNS, R2, first use, upgrade, and rollback
- [x] Add a deployment-document contract test for repository scoping, DNS-only CNAMEs, and both optional R2 bindings
- [x] Pass 64 deployment, 82 Worker, 48 Admin unit, 20 Admin browser, 6 Demo API, and 4 site tests plus all builds
- [x] Deploy production run `29692860714` and isolated Demo run `29692906598`
- [x] Verify three health origins, two Admin version assets, the project-site links, production `401`, and Demo write `403`
- [x] Preserve redirect stability, asynchronous analytics, migrations, D1/KV ownership, production data, and Demo isolation

---

## ✅ Completed - Product Quality And Conversion UX (v0.27.0)

- [x] Audit all maintained roadmap/gap documents and key Admin routes
- [x] Verify production/Demo layouts at 1440x900 and 390x844 without horizontal overflow
- [x] Move fourteen attribution filters behind a saved-view-aware Advanced control
- [x] Fix Reset so it responds to unapplied draft filters
- [x] Add aggregate and per-link Conversion Overview with human clicks, events, Event Rate, goals, and values
- [x] Keep unlike currencies separate in API responses, Admin presentation, and CSV exports
- [x] Add a rolling-deployment fallback when the new currency summary field is absent
- [x] Split authenticated Admin pages into route-level chunks and reduce the entry bundle by about 48%
- [x] Record pre-1.0, core, optional, and deliberate non-goal product gaps
- [x] Confirm zero known production dependency vulnerabilities through the official npm registry
- [x] Pass 63 deployment, 82 Worker, 48 Admin unit, 20 Admin browser, 6 Demo API, and 4 site tests plus all builds
- [x] Deploy production run `29688775610` and isolated Demo run `29688826084`
- [x] Verify both health endpoints and both Admin assets report v0.27.0
- [x] Preserve redirect stability, asynchronous analytics, migrations, D1/KV ownership, and Demo isolation

---

## ✅ Completed - Sidebar Version And Update Status (v0.26.7)

- [x] Remove the version text from the Logo row and the duplicate top-right update control
- [x] Add one bottom-left version/update control for expanded, collapsed, and mobile navigation
- [x] Preserve the automatic check on Admin open and 15-minute visible-session refresh
- [x] Keep available-version status visible after the release banner is dismissed
- [x] Recheck GitHub and resurface the release action when the footer control is clicked
- [x] Add update-notification, toolbar, desktop, collapsed, and mobile regression coverage
- [x] Verify the local Admin at 1440x900 and 390x844 without horizontal overflow
- [x] Preserve explicit upgrade confirmation, protected credentials, redirect behavior, and Demo isolation
- [x] Deploy Demo run `29655669311` and production run `29655669485`
- [x] Verify both health endpoints and both Admin assets report v0.26.7

---

## ✅ Completed - Demo Gateway Repeat Deployment (v0.26.6)

- [x] Diagnose failed cutover run `29646559998` before any Cloudflare runtime write
- [x] Accept Wrangler 4.111's `Project Name` field when inventorying Pages projects
- [x] Preserve the fail-closed deployment ordering and existing Demo resource names
- [x] Add a workflow contract assertion for repeat-project discovery
- [x] Deploy Demo run `29647646987` and production run `29647646808`
- [x] Verify the branded API, compiled Admin origin, 18 read APIs, `403` write boundary, and production/Demo version parity

---

## ✅ Completed - Branded Demo API Gateway (v0.26.5)

- [x] Keep `linketry.com` as the project/Demo namespace while production remains on `admin.uukk.de` and `go.uukk.de`
- [x] Add a Demo-account Pages Function with a Service Binding to `linketry-demo-worker`
- [x] Proxy only `/health` and `/api/*` and fail closed when the binding is unavailable
- [x] Separate the public Demo API URL from the `workers.dev` origin/fallback in deployment preflight
- [x] Guard API Pages project creation, deployment ordering, and custom-domain registration
- [x] Preserve isolated D1/KV/Queue/R2 ownership and avoid redirect-path changes
- [x] Pass gateway, deployment-policy, Wrangler compile, and release-metadata checks

---

## ✅ Completed - Release Readiness Diagnostics (v0.26.4)

- [x] Share one update result across the toolbar, update banner, and Settings page
- [x] Preserve the actual successful check timestamp and surface optional check failures
- [x] Show installed and latest GitHub versions in Settings
- [x] Show one-click, manual, invalid, and unavailable upgrade capability states
- [x] Refresh GitHub metadata and Worker upgrade readiness together on demand
- [x] Keep all credential values protected and preserve existing deployment gates
- [x] Pass deployment, Worker, Admin, site, type-check, browser, and build regression
- [x] Deploy and verify isolated Demo run `29636513938` on v0.26.4
- [x] Deploy production run `29636582863` and verify production/Demo version parity

---

## ✅ Completed - Brand Cache And Update Discovery (v0.26.3)

- [x] Verify the production Admin Logo content matches the canonical project Logo
- [x] Version BrandMark and Admin browser favicon URLs to prevent stale asset reuse
- [x] Reduce the GitHub version cache from six hours to 15 minutes
- [x] Poll for releases in visible long-running Admin sessions
- [x] Add desktop/mobile manual check controls that bypass cached results
- [x] Resurface a dismissed release when the operator explicitly checks again
- [x] Distinguish automatic Online upgrade from the manual Open deployment fallback
- [x] Keep GitHub metadata checks anonymous and preserve redirect/data behavior
- [x] Deploy and verify isolated Demo run `29634990846` on v0.26.3
- [x] Deploy production run `29635088591` and verify production/Demo version parity

---

## ✅ Completed - GitHub Actions Node.js 24 Runtime (v0.26.2)

- [x] Upgrade production and isolated Demo workflows from `actions/checkout@v4` to `@v6`
- [x] Upgrade both workflows from `actions/setup-node@v4` to `@v6`
- [x] Preserve explicit Node.js 24 and npm cache configuration
- [x] Add workflow policy assertions that prevent a regression to the deprecated Node.js 20 actions
- [x] Preserve deployment permissions, safety gates, Cloudflare write ordering, and runtime behavior
- [x] Live-verify both v6 actions without deprecation annotations in isolated Demo run `29604677229`
- [x] Deploy production run `29625316532` and verify production/Demo Worker/Admin version parity on v0.26.2
- [x] Confirm production Queue/R2 bindings and production/Demo authentication boundaries remain intact

---

## ✅ Completed - Optional Cloudflare Capability Preflight (v0.26.1)

- [x] Check configured R2 and Queue services through read-only Wrangler inventory before every deployment write
- [x] Treat missing optional resource names as warnings so the guarded workflow can create them later
- [x] Fail early with exact guidance when the selected Cloudflare account returns R2 code `10042`
- [x] Keep credentials redacted and preserve redirect, D1/KV, migrations, and deployed runtime behavior
- [x] Record the rotated-token core Demo success and the remaining Cloudflare account-level R2 blocker
- [x] Verify live R2 code `10042` stops before every mutation step in run `29602738195`
- [x] Deploy and verify the Queue-enabled v0.26.1 core Demo in run `29602948600`

---

## ✅ Completed - Admin Shell And Analytics Accuracy (v0.26.0)

- [x] Align the Sidebar brand row and desktop content toolbar
- [x] Show the running version under the Logo with a changelog link
- [x] Move desktop language, theme, support, mode, and Demo status controls into the top toolbar
- [x] Add saved 5/10/30 second near-real-time refresh and manual refresh to aggregate and per-link Analytics
- [x] Calculate conversion event rate against human clicks and exclude classified bots
- [x] Mark conversion metrics unavailable for visit-only attribution filters
- [x] Add idempotent client `event_id` support and separate conversion values by currency
- [x] Prevent long Analytics target/referrer labels from creating mobile horizontal overflow
- [x] Prevent Playwright from attaching to an unrelated service on the configured port
- [x] Verify Admin unit/build, Worker type/test, and complete Admin browser smoke coverage
- [x] Preserve redirect, KV, D1 link, and asynchronous visit-recording behavior

---

## ✅ Completed - Main Toolbar Navigation Toggle (v0.25.10)

- [x] Remove the desktop collapse control from the Sidebar navigation area
- [x] Place collapse/expand at the left edge of the main content toolbar
- [x] Preserve mobile navigation and stored desktop collapse behavior
- [x] Verify expanded, collapsed, mobile, dark, and light layouts

---

## ✅ Completed - Sidebar Toggle Placement (v0.25.9)

- [x] Keep the Linketry Logo row free of the desktop collapse control
- [x] Move collapse/expand into a dedicated navigation control row
- [x] Preserve mobile navigation and stored desktop collapse behavior
- [x] Verify expanded, collapsed, mobile, dark, and light layouts

---

## ✅ Completed - Cross-platform Demo Parity Verification (v0.25.8)

- [x] Normalize SVG line endings before strict canonical brand comparison
- [x] Cover Windows `CRLF` and deployed `LF` assets with a regression test
- [x] Deploy v0.25.7 to production and the isolated Demo with the live parity gate passing

---

## ✅ Completed - Demo Production Parity (v0.25.7)

- [x] Diagnose the live Demo as a stale v0.25.1 Admin build
- [x] Keep Demo and production on one Admin route and component inventory
- [x] Enforce byte-identical canonical dark/light Logo assets for Admin and project site
- [x] Add an exact Admin build version marker and cache-safe public verification
- [x] Verify 18 production read APIs and fail closed when the Demo write boundary is missing
- [x] Seed disabled, synthetic advanced-feature configuration without external delivery
- [x] Keep the isolated Demo workflow manual and preserve production resource separation

---

## ✅ Completed - Demo Access And Workspace Layout (v0.25.6)

- [x] Record the staged multilingual expansion roadmap and translation quality gates
- [x] Add a separate public Demo preview access code without exposing or reusing the Admin token
- [x] Keep Demo API reads public, synthetic, read-only, and rate-limited; reject writes before routing
- [x] Record isolated Cloudflare deployment permission requirements and production credential separation
- [x] Add persistent desktop Sidebar collapse with accessible icon labels and mobile drawer compatibility
- [x] Expand the desktop workspace and shared banners to use available width without changing dense form widths
- [x] Synchronize version metadata, changelog, progress, examples, and workflow configuration
- [x] Verify Demo access, desktop collapse, mobile navigation, builds, and deployment policy regression

---

## ✅ Completed - In-App One-Click Upgrade (v0.25.5)

- [x] Research Sub2API release replacement, checksum verification, restart, and rollback behavior
- [x] Adapt the upgrade experience to immutable Cloudflare Workers and Pages deployments
- [x] Keep the fine-grained GitHub token in a Worker secret and fix repository, branch, and workflow targets server-side
- [x] Add authenticated deployment dispatch and workflow-run polling APIs
- [x] Add Admin confirmation, progress, failure details, runtime-version verification, and automatic refresh
- [x] Preserve the protected manual GitHub Actions fallback when automatic upgrades are not configured
- [x] Synchronize workflow configuration, OpenAPI, self-hosting guidance, version metadata, and changelog
- [x] Preserve all deployment safety gates and leave the redirect path unchanged

---

## ✅ Completed - Safe Online Upgrade (v0.25.4)

- [x] Diagnose the stale v0.22.0 production build and recover the approved v0.25.3 deployment
- [x] Add authenticated manual approval for the selected branch's exact version and commit
- [x] Keep normal push deployments bound to repository approval variables
- [x] Add Admin changelog and online-upgrade actions for the current deployment repository
- [x] Preserve migration, backup, target, destructive-operation, and remote-resource gates
- [x] Add deployment and Admin unit coverage
- [x] Complete browser regression and production rollout readiness verification

---

## ✅ Completed - Brand Logo Refresh (v0.25.3)

- [x] Replace GitHub README logo with the canonical `https://linketry.com/favicon.svg` brand mark
- [x] Replace Admin login and Sidebar raster logo usage with theme-aware SVG assets
- [x] Add matching light-mode SVG logo assets for day display
- [x] Add project-site OpenGraph and Twitter logo metadata
- [x] Keep default project presentation in dark/night mode

---

## 🟡 Next - Operations And UX Planning

- [x] Demo follow-up: rotate the exposed old token, verify isolated Queue access, and rerun the guarded core deployment
- [ ] Demo follow-up: activate the account R2 subscription, resolve error `10042`, restore the two R2 variables, rerun deployment, and verify artifact downloads
- [x] Demo follow-up: implement `demoapi.linketry.com` through a Demo-account Pages Function and Service Binding, retaining `workers.dev` as the fallback origin
- [ ] Production follow-up: add a repository-scoped Actions-write token as `LINKETRY_GITHUB_UPDATE_TOKEN`, redeploy, and verify one-click readiness
- [ ] V9+: Integrate next high-value Shlink capabilities into Linketry (multi-segment slugs, extra-path forwarding, expired-link cleanup)

- [x] V7: Add configurable backup retention, starting with a 30-day default
- [x] V7: Add periodic target health monitoring, failure alerts, recovery alerts, and bounded status history
- [x] V7: Add opt-in Cron target monitoring with a configurable 1-50 link batch
- [x] V7: Send signed `health_check.failed` Webhook summaries for scheduled anomalies
- [x] V8: Add Simple / Advanced Admin mode toggle
- [x] V8: Add default-English language switcher and first i18n foundation for global/core Admin UI
- [x] V8: Add required first-run deployment wizard for API, one domain, and the first short link
- [x] V8: Localize Overview, Links basic workflow, Create Link basic workflow, and shared link statuses
- [x] V8: Complete first EN/ZH pass for Edit Link, Import/Export, and Tags
- [x] V8: Localize Import details, Links advanced filters/bulk actions, suggestions, and UTM builder
- [x] V8: Complete first EN/ZH operations pass for Domains, Groups, and Health Checks
- [x] V8: Localize Groups operations details, Health result headings, and Redirect Rules first pass
- [x] V8: Localize Redirect Rules editor, Health statuses, and API Tokens first pass
- [x] V8: Localize API Token dialogs and Backups first pass
- [x] V8: Localize complete restore-preview and overwrite safety workflow
- [x] V8: Localize Audit Logs and prepare Analytics observability messages
- [x] V8: Localize Analytics filters, metrics, charts, visits, exports, and per-link analysis
- [x] V8: Localize Bulk Create, Webhook controls, and complete reset safety workflow
- [x] V8: Audit Admin i18n coverage and add catalog parity/interpolation tests
- [x] V8: Localize public redirect/status templates with redirect regression coverage
- [x] V8: Localize Audit Logs action filters, pagination, Analytics UTM labels, and locale-aware chart formatting
- [x] V8: Add browser smoke tests for English and Simplified Chinese core workflows
- [x] V8: Normalize Admin dates, numbers, status labels, QR labels, placeholders, and API scope labels by selected locale
- [x] V8: Localize redirect rule types, health-check details, group confirmations, and import conflict previews
- [x] V8: Localize remaining long-tail page content, validation wording, and export/report details
- [x] V8: Add per-browser Admin density and instance-level optional-module visibility preferences
- [x] V8: Add accessible per-browser light, dark, and system theme preferences
- [x] V9: Add public read-only stats pages with privacy controls
- [x] V9: Improve bot classification and conversion attribution

---

## ✅ Completed - Demo Live Rollout Record (v0.25.2)

- [x] Record the successful isolated core deployment and exact GitHub Actions run
- [x] Record live verification for all 17 routes, 390px mobile layout, synthetic data, and read-only blocking
- [x] Correct the R2/Queue status from live to pending replacement-token activation
- [x] Record token rotation, advanced capability verification, and `demoapi.linketry.com` as explicit follow-up work
- [x] Confirm that production Cloudflare resources and redirect behavior were not changed

---

## ✅ Completed - Demo Deployment Compatibility (v0.25.1)

- [x] Remove unsupported Wrangler JSON flags from isolated Demo R2 and Queue inventory checks
- [x] Match exact Demo resource names in current Wrangler table output before creating resources
- [x] Add deployment-policy regression coverage and keep the safety gate ahead of every Cloudflare write
- [x] Leave production deployment inputs, resources, redirects, and data unchanged

---

## ✅ Completed - Demo Parity And Responsive Admin (v0.25.0)

- [x] Default fresh public Demo sessions to the complete Advanced navigation without overriding stored user choices
- [x] Replace the fixed mobile Sidebar with an accessible overlay drawer and full-width main content
- [x] Seed synthetic redirect rules, import jobs, API tokens, health history, saved views, reports, backups, and audits
- [x] Bind isolated Demo R2 buckets and Queue only after the fail-closed deployment gate passes
- [x] Upload valid synthetic backup and Analytics report artifacts for Demo downloads
- [x] Replace production token instructions on Demo Setup with public read-only isolation guidance
- [x] Verify the expanded seed against local D1 and add 390px Chromium layout coverage
- [x] Keep redirects, production Cloudflare resources, and production deployment behavior unchanged

---

## ✅ Completed — Public Demo And Coffee Entry Points (v0.24.0)

- [x] Provision and smoke-test isolated D1, KV, Worker, and Pages resources in a separate Cloudflare account
- [x] Activate the read-only Admin at https://demo.linketry.com with synthetic data and no visitor token
- [x] Preserve a random internal Worker Admin token without exposing it in the public frontend
- [x] Add Live Demo entry points to the official site header, hero, and footer
- [x] Activate https://everettlabs.dev/coffee/ as the project and Admin support destination
- [x] Keep redirect logic, production Worker resources, D1, KV, and migrations unchanged

---

## ✅ Completed — Official Site And Public Read-Only Demo Software (v0.23.0)

- [x] Verify `linketry.com` DNS, TLS, HTTP, and canonical metadata on the independent Pages project
- [x] Update GitHub site/runtime variables and create the protected `linketry-demo` environment
- [x] Protect the production Cloudflare account, resource IDs/names, and domains from Demo overlap
- [x] Add no-login public Demo Admin access with an EN/ZH read-only banner
- [x] Reject Demo writes in the Admin API client and Worker middleware
- [x] Preserve redirect responses while suppressing real-visitor analytics writes in Demo mode
- [x] Add hashed-client native Worker rate limiting for Demo API reads
- [x] Seed five synthetic links, 84 visits, 12 conversions, tags, settings, domain, and audit samples
- [x] Extend the manual isolated workflow to migrate, seed, deploy, and summarize Demo targets
- [x] Support the isolated account's `workers.dev` hostname without production DNS access
- [x] Keep live deployment fail-closed until separate-account resources and scoped credentials are supplied

---

## ✅ Completed — Privacy-Safe Traffic Anomaly Alerts (v0.22.0)

- [x] Compare the latest 24 hours with a bounded previous 7-day daily baseline outside the redirect path
- [x] Ignore low-volume samples and explain volume-spike and bot-rate-spike thresholds
- [x] Add opt-in settings for minimum visits, volume multiplier, bot-rate delta, and repeat suppression
- [x] Persist only aggregate alert state and emit recovery-aware notifications through existing channels
- [x] Add authenticated status/config/run endpoints to the published OpenAPI inventory
- [x] Add an EN/ZH Analytics panel and real-browser configuration/manual-check coverage

---

## ✅ Completed — Admin Utility Actions (v0.21.0)

- [x] Group language, light/dark theme, and owner support into three equal Sidebar icon controls
- [x] Keep the complete language selector on Login and Settings
- [x] Centralize the owner-support destination behind one external-link constant
- [x] Open external support without an Admin token and with noopener/noreferrer protection
- [x] Split the 251-line Sidebar into navigation, utility, and Footer modules without changing its 17 routes
- [x] Add EN/ZH accessible labels and Playwright coverage

---

## ✅ Completed — Development Documentation Consolidation (v0.20.2)

- [x] Add a code-backed architecture guide for redirect, cache, async, data, and failure boundaries
- [x] Add a contributor development guide for code placement, verification, deployment tracks, and release hygiene
- [x] Link maintained developer documents from README
- [x] Record Bitly, Rebrandly, and TinyURL as fixture-gated candidate adapters
- [x] Correct completed Analytics documentation and add privacy-safe traffic anomaly detection to future scope
- [x] Preserve automatic fallback_url use as an opt-in, redirect-safe evaluation item rather than current behavior
- [x] Keep historical names, domains, API examples, and obsolete schema assumptions out of current guidance

---

## ✅ Completed — Linketry 0.11 Final Identity Cutover

- [x] Prevent optional password autofill, support edit-then-clear removal, and disable stale Admin API caching
- [x] Set the purchased `linketry.com` domain as the official website in README, package metadata, project records, and GitHub
- [x] Remove superseded product-name compatibility code from Worker, Admin, tests, documentation, and deployment configuration
- [x] Migrate production D1 and R2 data to canonical Linketry resources with complete row/object verification
- [x] Rename KV and Queue resources in place, recreate Worker and Pages projects, and transfer production domains
- [x] Replace all GitHub Actions repository variables with `LINKETRY_*` names and preserve the Admin credential in `LINKETRY_ADMIN_TOKEN`
- [x] Add optionally authenticated Admin custom-domain DNS maintenance without broadening the main deployment token
- [x] Verify production health, authentication, redirect behavior, Admin deployment, and final resource inventory

---

## ✅ Completed — Linketry 0.10 Rebrand And Upgrade Safety

- [x] Rename product, package scope, repository metadata, runtime copy, exports, notifications, and fresh-install resource defaults to Linketry
- [x] Set author `everettlabs`, website `linketry.com`, repository `everett7623/Linketry`, and canonical image name `everett7623/linketry`
- [x] Move the canonical Admin API to `/api/v1` while keeping deprecated `/api/*` aliases for the `0.10.x` compatibility window
- [x] Prefer `LINKETRY_*` Worker/Admin configuration while temporarily accepting superseded repository variables and Worker secrets
- [x] Migrate browser-local auth/API/locale/mode keys without logging users out
- [x] Read old KV cache keys, clear both generations on mutations, and keep D1 as the source of truth
- [x] Export `Linketry Backup` while temporarily retaining the superseded backup import/restore marker
- [x] Add a separate non-destructive pre-0.10 upgrade guide; do not recreate or overwrite existing D1/KV/R2/Queue resources
- [x] Add the Linketry primary Logo to Admin login, navigation, README, and favicon branding

---

## ✅ Completed — V7 R2 Backup Restore

- [x] Add one-click restore from completed R2 backup records in the Backups page
- [x] Add restore dry-run preview with conflict summary
- [x] Add `skip`, `rename`, and `overwrite` restore conflict strategies
- [x] Create a fresh `pre-restore` R2 snapshot before mutating data
- [x] Return restore summary and CSV-style restore report
- [x] Preserve restored link domains and refresh KV cache for restored links
- [x] Document the restore API and operator workflow

---

## ✅ Completed — V7 Instance Reset

- [x] Add reset preview for affected row counts and KV prefix
- [x] Add factory reset API with exact confirmation phrase
- [x] Add pre-reset R2 backup, enabled by default
- [x] Clear short-link KV cache during reset
- [x] Reset links, analytics, tags, domains, imports, API tokens, audit logs, redirect rules, and settings
- [x] Preserve R2 backup records, R2 objects, and environment `LINKETRY_ADMIN_TOKEN`
- [x] Add Admin Settings danger-zone reset panel

---

## ✅ Completed — Project Consistency Cleanup

- [x] Bump Linketry package/runtime version to `0.7.4`
- [x] Add shared version constant for Worker and Admin displays
- [x] Update GitHub Actions version resolution and repository `LINKETRY_VERSION` variable
- [x] Update docs, env examples, wrangler example, changelog, and package lock
- [x] Update GitHub Actions Node runtime to Node 24
- [x] Add release hygiene rule requiring version, changelog, and progress/task updates for every intentional change

---

## ✅ Completed — Domain Split Deployment Safety

- [x] Keep Admin UI, Worker API, and public short-link domains as separate operational roles
- [x] Add `LINKETRY_WORKER_DOMAINS` for comma-separated Worker custom domains
- [x] Preserve legacy `LINKETRY_SHORT_DOMAIN` as a single-domain fallback
- [x] Add Admin login API Origin override for recovery when a build points at the wrong API URL
- [x] Fall back from a stale browser API Origin override to the build-time API URL during Admin auth startup
- [x] Document `admin.example.com`, `go.example.com`, and `s.example.com` deployment roles

---

## ✅ Completed — Shlink Migration Readiness

- [x] Preserve original short domains from Shlink `shortUrl` during import
- [x] Write imported domains to `links.domain`
- [x] Refresh import KV cache using stored link domain instead of API host
- [x] Document reset-then-import cutover safety for `s.y8o.de`

---

## ✅ Completed — Import Async Job Fix (v0.9.11)

- [x] Move heavy import processing out of request handler into background job
- [x] Return `processing` jobId immediately from `POST /api/v1/import/confirm`
- [x] Poll `/api/v1/import/jobs/:id` in Admin UI every 2 s until completion/failure
- [x] Add `importProcessing` EN/ZH i18n messages and disabled button state
- [x] Prevent duplicate confirm clicks while a job is running
- [x] Update `CHANGELOG.md`, package versions, env examples, and docs to `0.9.11`

---

## ✅ Completed — Import Confirm Timeout Follow-up (v0.9.13)

- [x] Create a `pending` import job with total 0 before parsing content
- [x] Move JSON parsing, adapter detection, normalization, validation, and conflict checks behind an asynchronous D1 boundary in `ctx.waitUntil()`
- [x] Update detected source and total count after background parsing
- [x] Persist parsing failures as failed jobs with CSV reports
- [x] Show failed background imports as errors and preserve Admin input for retry
- [x] Add a dedicated 60-second confirm timeout and queue-boundary regression test
- [x] Update `CHANGELOG.md`, package versions, env examples, docs, and task records to `0.9.13`

---

## ✅ Completed — Simplified Deployment Access (v0.9.14)

- [x] Recommend `admin.example.com` for Admin and `go.example.com` for Worker API and basic short links
- [x] Show Admin/API roles and automatic token retrieval steps before login and in the first-run wizard
- [x] Generate `LINKETRY_ADMIN_TOKEN` only on the first deployment and preserve the existing Worker secret later
- [x] Add an explicit repository-secret recovery override for a lost token
- [x] Add Admin/API/token guidance to the GitHub Actions deployment summary
- [x] Document `LINKETRY_ADMIN_URL` and the recommended two-domain setup
- [x] Update release metadata to `0.9.14`

---

## ✅ Completed — Beginner Single-Domain Deployment (v0.9.15)

- [x] Use the automatic `linketry-admin.pages.dev` URL for the beginner Admin flow
- [x] Require only `go.example.com` as the basic custom Worker domain
- [x] Make `admin.example.com` and `LINKETRY_ADMIN_URL` optional advanced configuration
- [x] Update onboarding, deployment summary, smoke checks, README, and self-hosting docs
- [x] Update release metadata to `0.9.15`

---

## ✅ Completed — Large Import Write Cutoff (v0.9.16)

- [x] Reproduce the fixed-count cutoff with the supplied 195-row Linketry CSV
- [x] Confirm Shlink API and CSV imports share the same sequential write bottleneck
- [x] Insert new links in bounded D1 batches while keeping D1 as the source of truth
- [x] Persist import progress after each batch and retry failed batches item by item
- [x] Preserve default `skip` conflict handling and avoid redirect logic changes
- [x] Verify 195/195 links import into a clean local D1 database
- [x] Verify reimport skips 195/195 conflicts without overwriting links
- [x] Update release metadata to `0.9.16`

---

## ✅ Completed — Import Completion UX (v0.9.17)

- [x] Poll the new import job immediately after confirmation
- [x] Avoid overlapping job-status requests
- [x] Stop polling on completed or failed jobs
- [x] Clear the finished file, preview, and importing state after success
- [x] Disable caching for import job status reads
- [x] Add browser regression coverage for pending-to-completed import flow
- [x] Update release metadata to `0.9.17`

---

## ✅ Completed — Aff Target Monitoring Notifications (v0.9.18)

- [x] Confirm scheduled monitoring checks active links' original `long_url` targets
- [x] Split hourly health checks from daily backup/report/cleanup Cron work
- [x] Notify only after configured consecutive failures and on recovery
- [x] Add Telegram, Discord, Slack, Feishu, DingTalk, and WeCom delivery adapters
- [x] Keep the existing signed generic Webhook available
- [x] Add per-channel Advanced Settings configuration and test delivery
- [x] Mask credentials from APIs and exclude them from backup exports
- [x] Restrict Incoming Webhook URLs to official HTTPS endpoints
- [x] Add Worker payload tests and Admin browser coverage
- [x] Leave redirect logic unchanged
- [x] Update release metadata to `0.9.18`

---

## ✅ Completed — Short-Link Domain Migration (v0.9.19)

- [x] Keep destination/Aff URL replacement as a separate bulk tool
- [x] Preview all links stored under one source short-link domain
- [x] Migrate `domain` and generated `short_url` without changing slug or `long_url`
- [x] Re-check the matching count before applying the preview
- [x] Clear old and target KV entries in bounded batches after the D1 update
- [x] Record the audit event and download a migration record CSV
- [x] Add an Advanced Links migration interface with EN/ZH guidance
- [x] Add Worker and Admin regression coverage
- [x] Leave redirect logic unchanged
- [x] Update release metadata to `0.9.19`

---

## ✅ Completed — Default Notification Format (v0.9.20)

- [x] Replace terse target messages with complete built-in failure and recovery formats
- [x] Include short link, target URL, status, HTTP status, response time, and UTC detection time
- [x] Preserve plain-text delivery and existing notification credentials and channel behavior
- [x] Add focused Worker format regression coverage
- [x] Leave redirect logic unchanged
- [x] Update release metadata to `0.9.20`

---

## ✅ Completed — Monitoring Navigation UX (v0.9.21)

- [x] Put scheduled destination/Aff monitoring controls on the Health Checks page
- [x] Link Health Checks directly to Telegram and other notification channel settings
- [x] Group the Advanced sidebar into daily, insights/automation, operations, and system sections
- [x] Use exact route matching so nested link pages do not highlight multiple menu entries
- [x] Mark Shlink key rotation and legacy-domain cutover as deferred while Shlink stays active
- [x] Add Admin browser coverage and update release metadata to `0.9.21`

---

## ✅ Completed — Public Launch And Sink Follow-Up Planning (v0.9.23)

- [x] Keep the bulk UTM workflow as the first implementation priority
- [x] Record an official Linketry project domain for the introduction site and isolated Demo, with domain purchase and DNS deferred until the owner selects the domain
- [x] Keep the future supporter/coffee site on a separate owner-managed domain and do not block Linketry development on it
- [x] Re-audit Sink through v0.2.11 and record the remaining high-value API, deployment, integration, and presentation gaps
- [x] Order the remaining work by dependency so API contracts and deployment safety precede ecosystem clients and visual analytics
- [x] Update release metadata and planning records to `0.9.23`

---

## 🟡 Planned — Ordered Development

### ✅ Priority 1 — Bulk UTM Append And Normalization (v0.9.24)

- [x] Add an Advanced Links bulk UTM tool without changing redirect-path behavior
- [x] Support selection/filter scope and show the exact matching-link count before preview
- [x] Support add-missing, replace-selected, and remove-selected UTM parameter modes
- [x] Preserve unrelated query parameters, URL fragments, credentials safety, and URL encoding
- [x] Preview before/after destination URLs and conflicts before writing
- [x] Update D1 in one bounded 100-link batch and clear affected KV entries only after successful writes
- [x] Download a change-record CSV and provide backup/rollback guidance
- [x] Add Worker policy tests, Admin browser coverage, and maximum-batch regression coverage

### Priority 2 — OpenAPI And Integration Contract

- [x] Inventory authenticated Linketry endpoints, request/response envelopes, pagination, errors, and bearer-token requirements
- [x] Publish a machine-readable OpenAPI document without changing existing API response contracts
- [x] Add an authenticated Swagger documentation view with secrets excluded from examples and logs
- [x] Cover the contract with schema validation and route-declaration drift checks in the Worker test suite
- [x] Document the stable foundation for browser extensions, Raycast, Shortcuts, MCP bridges, and other clients

### Priority 3 — Duplicate Destination Detection (Completed In 0.10.2)

- [x] Detect existing links with the same normalized destination while creating or editing a link
- [x] Show matching short links as a non-blocking warning and preserve the operator's ability to create intentional duplicates
- [x] Reuse current authorization, bounded results, and URL-normalization rules without adding redirect-path work
- [x] Add Worker policy tests and Admin create/edit regression coverage

### Priority 4 — Beginner Deployment Bootstrap

- [x] Define three explicit deployment tracks: existing production upgrade, fresh beginner self-hosting, and isolated official Demo
- [x] Keep the existing owner deployment upgradeable with its current bindings, but require a verified backup, migration-status review, and non-destructive incremental migrations before deploy
- [x] Prohibit production upgrades from running initialization SQL, factory reset, Demo seeding, resource recreation, or automatic binding/domain replacement
- [x] Provide an idempotent guided workflow or script for required D1 and KV provisioning and binding output
- [x] Make the beginner path create brand-new resources in the new user's own Cloudflare account without depending on Linketry maintainer domains, IDs, tokens, databases, or prior deployment state
- [x] Generate or collect unique beginner resource names and confirm the selected account and target resources before the first write
- [x] Keep R2, Queues, extra domains, and advanced Cron resources explicitly optional
- [x] Add permission and configuration preflight checks without printing tokens or secrets
- [x] Reconcile manual and GitHub Actions `LINKETRY_ADMIN_TOKEN` guidance into two clearly separated deployment paths
- [x] Recover the v0.20 deployment through the v0.20.1 workflow fallback fix and exact production release/commit approvals
- [x] Validate the complete basic deployment on the new isolated Demo Cloudflare account and record the smoke-test result
- [x] Add separate upgrade and fresh-install smoke checklists, including existing-link redirect verification for production upgrades and first-link creation for beginners

### Priority 5 — Official Project Site And Safe Demo

- [x] Prepare an official Linketry-domain site with product introduction, feature overview, screenshots, architecture, deployment entry, documentation, roadmap, license, and GitHub links
- [x] Use the owner-supplied `linketry.com` domain while keeping apex-domain activation as an explicit DNS prerequisite
- [x] Deploy the Demo with isolated D1/KV resources and synthetic data only
- [x] Give the Demo unique Worker, Pages, D1, KV, Token, and domain identifiers; never reuse the existing production bindings or project names
- [x] Fail the Demo deployment before migrations or deploy commands when any protected production account, resource identifier, name, or domain matches
- [x] Keep Demo workflows separate from the production `main` deployment workflow and prohibit Demo automation from changing production DNS, bindings, migrations, backups, or data
- [x] Make the Demo read-only and rate-limit abuse-prone API reads
- [x] Use a separate Demo Worker hostname and never expose production credentials or shared writable secrets in the frontend
- [x] Take and verify an independent production backup before any future production deployment change associated with the public launch
- [x] Add deployment and smoke coverage for the project site, Admin Demo, and sample redirect
- [x] Add the supporter link after the owner provided https://everettlabs.dev/coffee/

### Priority 6 — Optional Access And Click Integrations

- [ ] Add optional Cloudflare Access authentication without weakening the existing bearer-token path
- [ ] Define logout, CSRF, JWT verification, and recovery behavior before enabling Access sessions
- [ ] Add an opt-in `link.clicked` webhook using the existing signed webhook conventions
- [ ] Deliver click events asynchronously so webhook or analytics failures can never delay or break redirects
- [ ] Add retry, signature, masking, and failure-observability coverage

### Priority 7 — Admin Display Preferences

- [x] Add compact/comfortable sidebar density as a per-browser preference
- [x] Add compact/comfortable table density as a per-browser preference
- [x] Add instance-level visibility controls for optional Advanced modules
- [x] Keep required recovery, settings, and core link-management routes always reachable
- [x] Preserve Simple/Advanced mode behavior and EN/ZH coverage
- [x] Add unit and browser regression coverage for preference persistence and hidden modules

### Priority 8 — Product Presentation And Ecosystem

- [x] Add light, dark, and system theme preferences with accessible contrast
- [x] Check the canonical GitHub repository when Admin opens and show a cached, dismissible EN/ZH notice for newer versions
- [x] Evaluate and add an optional table/card Links view with existing list fields, compact actions, EN/ZH labels, and per-browser persistence
- [ ] Add privacy-preserving favicon delivery and batched visitor/referrer summaries only after a bounded aggregation and proxy contract is designed
- [ ] Add per-link social preview title, description, and image controls with optional R2 storage outside the redirect hot path
- [x] Expand translations through a typed, community-ready locale registry, catalog gate, contribution guide, and browser regression workflow
- [ ] Consider real-time visit logs, a live globe, and optional Workers AI only after the API and deployment foundations are stable
- [ ] Build browser, Raycast, Shortcuts, MCP, or mobile clients only against the published OpenAPI contract

### Deliberate Non-Goals

- Do not add iframe cloaking as a core Linketry feature
- Do not move primary link storage from D1 to KV
- Do not let real-time visuals, AI, sponsor setup, or external clients block the self-hosted 1.0 path

### Deferred Operations

- [ ] Keep Shlink API-key rotation deferred while Shlink remains active
- [ ] Keep legacy short-domain cutover deferred until no remaining links depend on Shlink

---

## ✅ Completed — Shlink Feature Port (v0.9.12)

- [x] Audit Shlink features and document gap in `docs/SHLINK_FEATURE_GAP.md`
- [x] Port query parameter forwarding: merge short-URL query params into destination URL on redirect
- [x] Exclude internal `linketry_*` query params from forwarding
- [x] Port automatic title resolution: fetch destination page `<title>` when creating a link without a title
- [x] Apply title resolution to single and bulk link creation via `ctx.waitUntil()`
- [x] Add `resolvePageTitle` utility with timeout and HTML entity decoding
- [x] Update `CHANGELOG.md`, package versions, env examples, and docs to `0.9.12`

---

## ✅ Completed — V6 Production Validation

- [x] Apply `migrations/0002_analytics_depth.sql` to production D1
- [x] Deploy Worker and Admin with V6 analytics changes
- [x] Production smoke test Analytics filters and single-link analytics
- [x] Production smoke test `POST /api/v1/conversions`
- [x] Production smoke test `/api/v1/export/analytics.csv`
- [x] Confirm scheduled retention setting is saved
- [x] Clean up temporary `lk-v6-*` smoke links

---

## ✅ Completed — Formal Roadmap Sync

- [x] Compare the private full development document against the public project docs
- [x] Move remaining private-plan gaps into the formal roadmap instead of treating them as completed work
- [x] Add long-term operations, recovery, monitoring, usability, i18n, growth, and collaboration planning
- [x] Keep V1-V6 completion status scoped to the features that are actually implemented

---

## ✅ Completed — V6 Analytics Depth First Pass

- [x] Add per-link analytics detail page
- [x] Add Analytics filters for link, domain, tag, campaign, project, country, device, browser, referer, and UTM values
- [x] Add UTM parameter breakdown
- [x] Add smart redirect rule and A/B target breakdown
- [x] Add conversion or goal event tracking
- [x] Add exportable Analytics reports
- [x] Add configurable raw visit retention controls
- [x] Run Worker type-check, Admin production build, and local D1 migration

---

## ✅ Completed — V5 Open Source Self-Hosted Release

Product direction:

- [x] Keep Linketry free and open source first; do not add paid SaaS or subscription billing yet
- [x] Preserve a complete, practical self-hosted version for personal users and small teams
- [x] Treat paid deployment, migration help, hosted service, or support as future optional business models only

Deployment experience:

- [x] Rewrite README for first-time external users
- [x] Add a clean self-hosted deployment guide with example domains only
- [x] Add `apps/worker/wrangler.toml.example`
- [x] Add GitHub Actions documentation using repo variables for API URL and Pages project name
- [x] Document Cloudflare resources required by a fresh install: Workers, D1, KV, R2, Queues, Pages, secrets, and custom domains
- [x] Add post-deploy smoke test commands for health, auth rejection, create/edit/delete, redirect, import preview, and export
- [x] Isolate personal deployment values from public docs and reusable GitHub Actions defaults
- [x] Improve first-run Admin guidance for system status and missing setup checks
- [x] Move maintainer production Worker config out of the public default path, or generate it from deployment variables
- [x] Change project license to GPL-3.0-only and keep public repository readiness cleanup
- [x] Document current dashboard/analytics coverage and next tracking gaps

---

## 🟡 Pending — V1 Remaining

### Backend

- [x] Create and configure the original Cloudflare D1 database (new installs now use `deploy:bootstrap`)
- [x] Create and configure Cloudflare KV namespace
- [x] Apply production DB migration after Cloudflare D1 is configured
- [x] Set `LINKETRY_ADMIN_TOKEN` secret for production (`wrangler secret put LINKETRY_ADMIN_TOKEN`)

### Frontend

- [x] Verify Links list pagination and search
- [x] Verify Create/Edit link forms
- [x] Verify Import/Export page (preview + confirm + download)
- [x] Verify Settings save/load

### Deployment

- [x] Deploy Worker to Cloudflare (`wrangler deploy`)
- [x] Deploy Admin to Cloudflare Pages or static host
- [x] Add GitHub Actions workflow for automatic Cloudflare deploy on push to `main`
- [x] Test `GET /health` on production URL
- [x] Test short link redirect on production domain
- [x] Verify API auth rejects requests without token
- [x] Configure a test short-link domain
- [x] Add DNS CNAME for the Admin custom domain to the Cloudflare Pages project
- [x] Verify Admin custom domain
- [x] Rebuild and deploy Admin with the Worker/API base URL
- [x] Configure Admin short-link copy/open domain via Settings

### Migration

- [x] Pull Shlink short URLs through Shlink REST API
- [x] Preview Shlink import in production Linketry
- [x] Import 195 Shlink links into production Linketry
- [x] Verify duplicate import preview reports conflicts instead of overwriting
- [x] Spot-check imported redirects on production Worker
- [x] Prepare legacy short-domain cutover and rollback checklist
- [ ] Revoke or rotate the Shlink API key used for migration (deferred while Shlink remains active)
- [ ] Cut over the legacy short domain from Shlink to Linketry (deferred until no legacy links depend on Shlink)

---

## 🟢 Completed — V1

### Project Setup

- [x] Monorepo structure (`apps/worker`, `apps/admin`, `packages/shared`)
- [x] Root `package.json` with workspaces
- [x] `tsconfig.json` for all packages
- [x] `.gitignore`, `.prettierrc`
- [x] Database migration `migrations/0001_init.sql`
- [x] Git repository initialized and pushed to GitHub

### Backend — Worker

- [x] `src/types.ts` — Env interface
- [x] `src/utils/id.ts` — ID + slug generation
- [x] `src/utils/response.ts` — JSON/HTML response helpers
- [x] `src/auth/index.ts` — Bearer token auth middleware
- [x] `src/db/index.ts` — All D1 query functions
- [x] `src/cache/index.ts` — KV read/write/delete
- [x] `src/analytics/index.ts` — Visit recording (async)
- [x] `src/routes/redirect.ts` — `GET /:slug` handler
- [x] `src/routes/auth.ts` — Login / me / logout
- [x] `src/routes/links.ts` — Links CRUD + status actions
- [x] `src/routes/tags.ts` — Tags CRUD
- [x] `src/routes/settings.ts` — Settings get/put
- [x] `src/routes/export.ts` — CSV / JSON / backup export
- [x] `src/routes/importRoutes.ts` — Import preview / confirm / jobs
- [x] `src/importers/shlink.ts` — Shlink JSON / JSONL / CSV adapter
- [x] `src/importers/generic.ts` — Generic CSV / JSON adapter
- [x] `src/index.ts` — Hono app entry point + route registration

### Frontend — Admin

- [x] `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.cjs`
- [x] `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`
- [x] `src/api/client.ts` — Base fetch + downloadFile
- [x] `src/api/auth.ts` — Login / me
- [x] `src/api/links.ts` — Links CRUD + actions + overview
- [x] `src/api/tags.ts` — Tags API
- [x] `src/api/settings.ts` — Settings API
- [x] `src/api/importExport.ts` — Import/export API
- [x] `src/contexts/AuthContext.tsx` — Auth state + hooks
- [x] `src/components/ui/Button.tsx`
- [x] `src/components/ui/Badge.tsx` + `StatusBadge`
- [x] `src/components/ui/Input.tsx` + `Select` + `Textarea`
- [x] `src/components/ui/Modal.tsx` + `ConfirmDialog`
- [x] `src/components/ui/Toast.tsx` + `ToastProvider` + `useToast`
- [x] `src/components/Sidebar.tsx`
- [x] `src/components/Layout.tsx`
- [x] `src/pages/Login.tsx`
- [x] `src/pages/Overview.tsx`
- [x] `src/pages/Links.tsx`
- [x] `src/pages/CreateLink.tsx`
- [x] `src/pages/EditLink.tsx`
- [x] `src/pages/ImportExport.tsx`
- [x] `src/pages/Settings.tsx`
- [x] `src/pages/Tags.tsx`

### Documentation

- [x] `README.md`
- [x] `DEPLOYMENT.md`
- [x] `CUTOVER.md`
- [x] `AGENTS.md`
- [x] `DEVELOPMENT_GUIDE.md`
- [x] `docs/DEPLOYMENT.md`
- [x] `docs/IMPORT_SHLINK.md`
- [x] `docs/IMPORT_ADAPTERS.md`
- [x] `docs/MIGRATION_FROM_SHLINK.md`
- [x] `docs/BACKUP_AND_RESTORE.md`
- [x] `docs/API.md`
- [x] `docs/ROADMAP.md`
- [x] `docs/SECURITY.md`
- [x] `TASKS.md`
- [x] `PROGRESS.md`
- [x] `CHANGELOG.md`
- [x] `.env.example`

### Local Verification

- [x] Ran `npm install` at repo root
- [x] Worker type-check passes (`npm run type-check --workspace=apps/worker`)
- [x] Admin production build passes (`npm run build --workspace=apps/admin`)
- [x] Applied local D1 migration (`npm run db:migrate:local --workspace=apps/worker`)
- [x] Local smoke test: `/health` returns 200, unauthenticated `/api/v1/overview` returns 401, missing slug returns 404
- [x] Local E2E: create link, redirect, async click increment, disable page, delete then 404
- [x] Local KV direct test: create writes KV, disable clears KV, enable rewrites KV, delete clears KV
- [x] Local export test: `links.csv`, `links.json`, and `backup.json`
- [x] Local visits export test: `visits.csv`
- [x] Local Shlink import test: preview, confirm, duplicate slug conflict skip
- [x] Admin import confirm downloads a pre-import `backup.json` before mutating data
- [x] Local Tags API smoke test: create, update, list, delete
- [x] Local tag sync smoke test: link tags create catalog entries; rename/delete syncs back to links
- [x] Local Admin browser check: login flow reaches Overview
- [x] Local Admin browser check: Overview stats load
- [x] Production smoke test: create, list/search, edit, disable, enable, archive, restore, delete
- [x] Production redirect state test: disable stops redirect immediately, delete returns 404 immediately
- [x] Production Import/Export test: export CSV/JSON/backup, preview exported CSV, duplicate slugs report conflicts
- [x] V2 QR code build/deploy check: Links actions include QR preview and PNG download
- [x] V2 bulk actions production check: disable, enable, archive, restore, delete on temporary links
- [x] V2 expiry/max-clicks production check: expired links show expired page; max-click links stop after limit
- [x] V2 auto-fetch page title production check: metadata endpoint rejects unauthenticated requests and fetches `Example Domain`
- [x] V2 bulk tag assignment production check: add, replace, remove, and clear tags on temporary links
- [x] V2 full production regression: 49 checks passed; temporary `lk-v2-reg-*` links cleaned up

---

## 🔵 Backlog — V2

- [x] Link expiry (`expires_at` UI field)
- [x] Max clicks (`max_clicks` UI field)
- [x] Bulk delete / disable / enable
- [x] Bulk tag assignment
- [x] Auto-fetch page title
- [x] QR code generation
- [x] Password-protected links
- [x] Safety warning page
- [x] UTM parameter templates
- [x] Tags management page
- [x] Link tags and Tags catalog synchronization
- [x] Create/Edit Link forms can select existing Tags catalog entries
- [x] Local import smoke test: Sink, YOURLS, Dub, Linketry backup restore
- [x] Local import conflict smoke test: rename and overwrite
- [x] Sink importer adapter
- [x] YOURLS importer adapter
- [x] Dub importer adapter
- [x] Import conflict strategies: rename / overwrite
- [x] Audit logs page
- [x] Linketry backup.json restore import
- [x] Shlink API pull import
- [x] Local V2 security smoke test: password page, warning page, normal redirect, audit log write
- [x] Bulk create links
- [x] Links advanced filters
- [x] Generic CSV field mapping enhancements
- [x] Generic JSON / JSONL field mapping enhancements

## 🔵 Backlog — V3

- [x] Advanced analytics dashboard
- [x] Daily stats aggregation (`daily_stats` table)
- [x] Auto-backup to Cloudflare R2
- [x] API Token management page
- [x] Cloudflare Queues for async stats
- [x] Cron Triggers for daily backup
- [x] Multi-domain support
- [x] Webhook notifications

## 🔵 Backlog — V4

- [x] Country-based redirect rules
- [x] Device-based redirect rules
- [x] Browser-based redirect rules
- [x] Referer-based redirect rules
- [x] Language-based redirect rules
- [x] A/B test redirect rules
- [x] Weighted traffic splitting
- [x] Admin Redirect Rules page
- [x] Redirect rules included in backup export / restore
- [x] V4 smart redirect production validation
- [x] Campaign / project grouping
- [x] V4 campaign / project grouping production validation
- [x] Local smart slug / title / description / tag suggestions
- [x] V4 smart suggestions production validation
- [x] Link health checker
- [x] V4 link health checker production validation

## 🔵 Backlog — V7 Operations, Recovery, And Monitoring

- [x] One-click restore from R2 backup records in the Backups page
- [x] Restore dry-run preview with conflict summary
- [x] Pre-restore backup and restore report
- [x] Factory reset with preview, confirmation phrase, pre-reset backup, and KV cache clearing
- [x] Configurable R2 backup retention with a 30-day default
- [x] Retention cleanup for old backup records and R2 objects
- [x] Periodic target health monitoring through Cron
- [x] Target status history with last status code, last checked time, and failure count
- [x] Target failure alerts through Admin Operations notices and optional signed Webhooks
- [x] Alert controls for consecutive-failure thresholds, suppression, and recovery Webhook notifications
- [x] First-class `fallback_url` editing in Create/Edit Link
- [x] Custom 404, expired, disabled, and warning page templates with escaped plain-text variables
- [x] Operations dashboard for backup freshness, monitoring status, current failed targets, queue configuration, and deployment health
- [x] Better bot classification for analytics and monitoring noise reduction

## 🔵 Backlog — V8 Usability Modes And Internationalization

- [x] Simple / Advanced Admin mode toggle
- [x] Simple mode hides advanced navigation and Settings operator panels
- [x] Hide advanced controls inside link forms and the Links table when Simple mode is active
- [x] Advanced mode exposes Redirect Rules, Webhooks, API Tokens, advanced Analytics filters, backups internals, and bulk tooling
- [x] Advanced Setup reports R2, Queue, and multi-domain runtime capabilities
- [x] Instance-level feature visibility settings for optional modules
- [x] Per-browser or per-admin preferences for sidebar density, table density, and advanced panels
- [x] Required first-run setup wizard for new self-hosters
- [x] Language switcher with English as default and Simplified Chinese as an option
- [x] Complete i18n coverage for remaining labels, validation messages, empty states, errors, and documentation links
- [x] Locale-aware date, time zone, number, and CSV/export formatting settings
- [x] Contextual help text for advanced fields only when advanced mode is enabled

## 🔵 Backlog — V9 Growth Tools, Reporting, And Link Intelligence

- [x] Bulk replace destination URLs with preview and rollback guidance
- [x] Bulk migrate stored short-link domains without changing slugs or destination URLs
- [x] Bulk append or normalize UTM parameters
- [x] Saved UTM templates and campaign presets
- [x] Link notes and affiliate/internal notes
- [x] OpenGraph preview cards for destination pages
- [x] Public read-only stats pages with privacy controls, hashed share tokens, and per-link enablement
- [x] Scheduled analytics report exports
- [x] Saved Analytics filters and reusable report views
- [ ] Privacy-safe session or visitor-level conversion attribution
- [ ] Additional attribution fields, such as external campaign IDs and privacy-safe visitor/session identifiers; retry idempotency is complete through `event_id`
- [x] Scheduled privacy-safe traffic anomaly alerts with explainable thresholds and suppression
- [ ] Evaluate opt-in fallback_url failover using previously recorded health state, without synchronous redirect-path probes
- [ ] Long-idle auto-archive rules with review queue and dry-run mode
- [ ] Additional fixture-backed import adapters when demand is clear: Bitly, Rebrandly, and TinyURL

## 🔵 Backlog — V10 Collaboration And Governance

- [ ] Multi-user accounts
- [ ] Roles and permissions
- [ ] Team or workspace separation
- [ ] API token ownership and rotation policies
- [ ] Audit log export and retention policies
- [ ] Per-project access controls
- [ ] Optional managed hosting, migration services, or support offerings while preserving the free self-hosted edition

# PROGRESS.md — Build Status

Quick reference for what is done, what is in progress, and what is not started.

Last updated: 2026-07-22

---

## Overall Status

| Layer                      | Status                 | Notes                                                                                                                                                                                                   |
| -------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worker backend             | ✅ Runtime unchanged   | v0.29.2 changes Admin delivery and deployment validation only; redirect, API, analytics, D1, and KV behavior are unchanged                                                                                |
| Admin frontend             | ✅ 0.29.2 hardened     | Versioned entry assets prevent stale custom-domain cache reuse; production still converges its Admin CNAME to DNS-only before readiness can pass                                                        |
| Database schema            | ✅ Complete            | V6 analytics migration applied in production through GitHub Actions                                                                                                                                     |
| Documentation              | ✅ 0.29.2 updated      | Live version evidence, optional Demo R2 state, pre-1.0 gates, release notes, progress, roadmap, and task records are synchronized                                                                          |
| Deployment                 | 🟡 v0.29.2 rollout     | The v0.29.2 push will synchronize the isolated Demo and run the owner-approved production recovery; final live verification remains                                                                      |
| End-to-end test            | ✅ Full regression     | 81 deployment, 110 Worker, 64 Admin unit, 25 Admin browser, 6 Demo API, and 4 site tests pass; Worker type-check, Admin/Site builds, and npm audit pass                                                    |
| Known issues               | ✅ Tracked             | Partial large-import write cutoff fixed in v0.9.16; remaining operational limitations are documented in `docs/KNOWN_ISSUES.md`                                                                          |
| Current version            | 🟡 0.29.2 prepared     | Repository targets v0.29.2; live Admin rollout remains gated on DNS-only convergence and canonical asset verification                                                                                     |
| Repository update target   | ✅ 0.29.2 ready        | GitHub `main` package metadata remains the update-discovery source; older production versions can detect the newer repository version without a GitHub Release or tag                                   |
| Next planned work          | 🟡 Pre-1.0 validation | Fresh-account rehearsal, remote-D1 scale evidence, assistive-technology review, and private vulnerability reporting remain; a branded Demo redirect is intentionally unnecessary                         |
| Shlink migration readiness | ✅ Complete            | Shlink imports preserve original short domains from `shortUrl`; stored links can then be migrated from a legacy domain such as `s.y8o.de` to a new domain                                               |
| Shlink feature gap audit   | ✅ Complete            | Gap analysis documented in `docs/SHLINK_FEATURE_GAP.md`; highest-value missing capabilities identified as query-param forwarding, title auto-resolution, and multi-segment/strict-mode redirect options |

---

## Linketry 0.29.2 Admin Cache-Key And DNS Convergence Hardening

| Area                 | Status      | Notes                                                                                                                                |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Asset cache keys     | ✅ Complete | Built Admin entry JavaScript and CSS URLs include the release version, preventing reuse of stale custom-domain edge entries        |
| DNS automation       | ✅ Complete | Production can use the dedicated DNS token or the configured Cloudflare API token to enforce an Admin DNS-only CNAME               |
| Readiness gate       | ✅ Complete | Canonical asset checks still reject HTML fallbacks, incorrect MIME types, and unsafe cache headers                                |
| Verification         | 🟡 Pending  | Full regression and owner-approved production rollout are required after the `v0.29.2` push                                      |
| Redirect/data impact | ✅ None     | Redirect handlers, D1/KV ownership, migrations, analytics, and stored production data are unchanged                               |

---

## Linketry 0.29.1 Post-Deployment Status Reconciliation

| Area                    | Status      | Notes                                                                                                                                            |
| ----------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Repository and Demo     | ✅ Verified | `main` and every workspace were v0.29.0; Demo Worker/Admin live parity passed on v0.29.0 after workflow `29843142149`                              |
| Production baseline     | ✅ Verified | `go.uukk.de` and `admin.uukk.de` serve v0.28.8, preserving the intended owner-controlled update-notification and upgrade test                     |
| Update discovery        | ✅ Verified | Admin reads the configured repository branch's `package.json`; GitHub Release/tag creation is not required for a newer-version notification       |
| Optional Demo resources | 🟡 Pending  | Queue is configured, but R2 bucket variables remain unset until the isolated Cloudflare account enables the optional R2 capability                |
| Production Admin cache  | ✅ Fixed    | Canonical assets are checked without cache bypass, long-lived custom caching is rejected, and the Admin CNAME is maintained as DNS-only           |
| Public 1.0 gates        | 🟡 Pending  | Independent fresh-account, remote-D1 scale, assistive-technology, and private vulnerability-reporting evidence remains                           |
| Redirect/data impact    | ✅ None     | Admin delivery and DNS proxy mode change; redirect logic, migrations, D1/KV ownership, production records, and stored data remain unchanged       |

---

## Linketry 0.29.0 Demo Sync, Upgrade Feedback, And Global Distribution

| Area                       | Status         | Notes                                                                                                                          |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Official Demo              | ✅ Live        | Workflow `29843142149` synchronized v0.29.0 from `main`; live Admin/Worker parity and the read-only boundary pass                 |
| Self-hosted upgrades       | ✅ Implemented | Each instance dispatches its configured repository/branch; workflow polling is 2s and combined release-readiness polling is 1s  |
| Completion feedback        | ✅ Implemented | Worker/Admin dual readiness, accessible result notifications, earliest reload, and persistent post-refresh confirmation coexist |
| Global access distribution | ✅ Implemented | World traffic uses ten intensity colors; per-link countries use ten categorical colors; Demo seed covers ten countries          |
| Full verification          | ✅ Complete    | 79 deployment, 110 Worker, 64 Admin unit, 25 browser, 6 Demo API, and 4 site tests plus builds, type-check, overflow, and npm audit pass |
| Redirect/data impact       | ✅ None        | Redirect logic, analytics ingestion, D1/KV ownership, migrations, production data, and isolation boundaries are unchanged        |

---

## Linketry 0.28.8 Online Upgrade Readiness State

| Area                     | Status      | Notes                                                                                                                       |
| ------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| Production evidence      | ✅ Captured | Workflow `29811494912` deployed Worker/Admin, then failed while the Admin entry asset returned HTML during Pages propagation |
| Combined readiness       | ✅ Complete | Reload requires target Worker health, target Admin metadata, and executable initial JavaScript/CSS                          |
| Real dispatch contract   | ✅ Complete | The normal GitHub `204` response and `runId: null` path use the same bounded readiness state machine                         |
| Browser recovery         | ✅ Complete | Visibility, focus, and online events wake one existing poll without creating a second polling loop                          |
| Feedback continuity      | ✅ Complete | Every successful path records the target release before reload                                                              |
| Verification             | ✅ Complete | Full Worker, deployment, Admin, Demo API, and site regression passes; builds and official npm audit pass                    |
| Redirect/data impact     | ✅ None     | Redirect handlers, deployment permissions, D1/KV, migrations, analytics, and production data are unchanged                 |
| Live rollout             | ✅ Complete | Production Worker/Admin now serve v0.28.8; the isolated Demo subsequently advanced to v0.29.0 through its separate workflow |

---

## Linketry 0.28.7 Analytics Comparison And Heatmap

| Area                    | Status      | Notes                                                                                                                        |
| ----------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Period comparison       | ✅ Complete | The selected range and immediately preceding equal-length range reuse every active filter                                   |
| Trend context           | ✅ Complete | A dashed previous total is aligned by day position without removing current total, human, bot, or unique series             |
| Activity heatmap        | ✅ Complete | Exactly 168 local weekday/hour buckets include total, human, and bot visits                                                  |
| Query envelope          | ✅ Complete | Three fixed aggregate queries keep cost independent of visit volume and populated buckets                                   |
| Compatibility           | ✅ Complete | Existing fields remain additive; older responses degrade to lightweight empty comparison views instead of a blank page      |
| Verification            | ✅ Complete | 110 Worker, 58 Admin unit, 25 browser, 78 deployment, 6 Demo API, and 4 site tests pass; builds and npm audit pass           |
| Redirect/data impact    | ✅ None     | Redirect handlers, asynchronous visit recording, D1/KV ownership, migrations, production data, and Demo isolation unchanged |
| Live Demo               | ✅ 0.28.7   | Workflow `29806272912` passed; live today, comparison, three trend modes, heatmap, map, localization, and responsive states were verified |

---

## Linketry 0.28.6 Analytics Visual Depth

| Area                    | Status      | Notes                                                                                                                       |
| ----------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| Today boundary          | ✅ Complete | Overview and Analytics use the browser's explicit UTC offset and keep UTC storage                                            |
| Trend analysis          | ✅ Complete | Zero-filled daily rows expose total, human, bot, and approximate unique visitors through three chart modes                   |
| Geography               | ✅ Complete | A locally bundled interactive world map uses a bounded 250-country aggregation and preserves unknown traffic                |
| Audience composition    | ✅ Complete | Device donut and browser bars complement existing detailed attribution lists                                                 |
| Contract compatibility  | ✅ Complete | Existing Analytics fields remain; explicit range, daily metrics, and geography fields are additive                          |
| Redirect/data impact    | ✅ None     | Redirect handlers, asynchronous visit recording, D1/KV ownership, migrations, production data, and Demo isolation unchanged |
| Verification            | ✅ Complete | 109 Worker, 58 Admin unit, 25 browser, 78 deployment, 6 Demo API, and 4 site tests pass; production builds and the official npm audit pass |
| Live Demo               | ✅ 0.28.6   | Workflow `29803326084` passed parity and read-only checks; live Analytics shows non-empty local today traffic, trend, map, and audience panels |

---

## Linketry 0.28.5 Admin Deployment Readiness

| Area                  | Status      | Notes                                                                                                                           |
| --------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Production evidence   | ✅ Captured | `admin.uukk.de` advertised v0.28.4 while its entry module returned the HTML fallback and left an empty `#root`                  |
| Readiness contract    | ✅ Complete | The configured Admin origin must advertise the target release and serve initial JS/CSS with executable MIME types              |
| Upgrade coordination  | ✅ Complete | The GitHub run remains active until Pages propagation succeeds, so an older Admin does not refresh into a partial deployment    |
| Credential boundary   | ✅ Preserved | The readiness probe is anonymous and never sends Admin, GitHub, or Cloudflare credentials                                      |
| Redirect/data impact  | ✅ None     | Redirect handlers, Worker runtime behavior, D1/KV ownership, migrations, production data, and Demo isolation are unchanged      |

---

## Linketry 0.28.4 Asynchronous Signed Click Webhook

| Area                   | Status      | Notes                                                                                                                               |
| ---------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Click event            | ✅ Complete | `link.clicked` is available as an explicit opt-in event and is excluded from default subscriptions                                 |
| Async boundary         | ✅ Complete | Delivery runs only from Queue/`ctx.waitUntil()` visit post-processing after core D1 accounting and KV work                         |
| Privacy                | ✅ Complete | Payload excludes IP/IP hash, User-Agent, Referer, country, target URLs, credentials, and raw visitor identity                      |
| Signing and retry      | ✅ Complete | Transient failures receive at most three attempts with one stable event ID, timestamp, body, and HMAC-SHA256 signature             |
| Failure observability  | ✅ Complete | Structured warnings contain event/status/error/attempt count without URL, payload, or secret                                       |
| Dependency audit       | ✅ Complete | Official npm registry reports zero known vulnerabilities; transitive dev-only `brace-expansion` is updated to 1.1.16               |
| Redirect/data impact   | ✅ None     | Redirect handlers/decisions, D1/KV ownership, migrations, production data, and Demo isolation are unchanged                        |

---

## Linketry 0.28.3 Support And Compatibility Policy

| Area                  | Status      | Notes                                                                                                                     |
| --------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| Security reporting    | 🟡 External | Policy and advisory URL are complete; GitHub activation is an external pre-1.0 gate and currently reports `enabled: false` |
| Compatibility         | ✅ Complete | Patch/minor pre-1.0 behavior, `/api/v1`, and forward-only migration expectations are explicit                             |
| Supported toolchain   | ✅ Complete | Node 24, npm 10+, Wrangler 4.111+ within major 4, current browsers, and protected workflows form the maintained contract   |
| Backup and rollback   | ✅ Complete | One operator checklist covers backups, post-upgrade evidence, migration-aware rollback, and D1/KV ownership              |
| Contract automation   | ✅ Complete | Deployment tests prevent security links, package engines, compatibility, and rollback language from drifting              |
| Redirect/data impact  | ✅ None     | Redirects, Worker runtime behavior, D1/KV semantics, migrations, production data, and Demo isolation are unchanged        |

---

## Linketry 0.28.2 Data Scale Contract

| Area                     | Status      | Notes                                                                                                                    |
| ------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| Stable pagination        | ✅ Complete | Links and Audit use ID tie-breakers when timestamps, clicks, or other primary sort values match                          |
| Input boundaries         | ✅ Complete | Shared policy accepts only positive integers, caps pages at 100,000 and page sizes at 100, and preserves safe defaults   |
| Scale fixtures           | ✅ Complete | Maintained migrations seed 20k Links, 100k Visits, 20k Audit rows, and 10k raw Health History entries in memory          |
| Response budgets         | ✅ Complete | Executable budgets cover Links/Audit pages, representative Analytics queries, and Health History parsing                 |
| Remote D1 validation     | 🟡 External | Owner-controlled remote rehearsal is still required to measure network and platform variance                            |
| Redirect/data impact     | ✅ None     | Redirects, analytics ingestion, D1/KV semantics, migrations, production data, and Demo isolation are unchanged          |

---

## Linketry 0.28.1 Import Operating Envelope

| Area                    | Status      | Notes                                                                                                                |
| ----------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| Shared limits           | ✅ Complete | Admin and Worker use one 10 MiB UTF-8 content limit and 50,000-item normalization limit                              |
| Worker enforcement      | ✅ Complete | Preview/confirm reject oversized content before parsing/job creation; queued jobs stop before D1 writes on item excess |
| Shlink API fetch        | ✅ Complete | Worker-generated exports use the content boundary; API pulls fail explicitly above 5,000 items or 100 pages           |
| Admin UX                | ✅ Complete | Upload control shows the limit, rejects before reading, reports accessibly, and clears stale state                    |
| Remaining scale work    | ✅ Advanced | Local D1-compatible fixtures and response budgets are delivered in v0.28.2; remote D1 rehearsal remains external     |
| Redirect/data impact    | ✅ None     | Redirects, analytics, D1/KV semantics, migrations, production data, and Demo isolation are unchanged                 |

---

## Linketry 0.28.0 Mainstream File Imports

| Area                     | Status      | Notes                                                                                                                                       |
| ------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Bitly CSV                | ✅ Complete | Preserves documented short/custom links, case-sensitive slugs, destinations, titles, engagements, creation dates, source IDs, and status |
| Short.io CSV             | ✅ Complete | Preserves documented IDs, short domains/paths, destinations, titles, tags, clicks, timestamps, and expiry                                  |
| Detection                | ✅ Complete | Requires multiple platform-specific headers before Generic CSV; unrelated partial files are not claimed                                   |
| CSV parser               | ✅ Complete | Handles quoted commas, escaped quotes, CRLF, and multiline quoted values for named and Generic CSV imports                                 |
| Preview/conflicts        | ✅ Complete | Shared tested policy keeps `skip` as default and `rename`/`overwrite` explicit                                                             |
| Admin UX                 | ✅ Complete | Localized source choices are available and Shlink credential fields render only for explicit Shlink selection                             |
| Phase 2                  | 🟡 Gated    | Rebrandly waits for a current redacted response and verified cursor pagination                                                            |
| Redirect-path impact     | ✅ None     | Redirect handlers, async analytics, D1/KV semantics, migrations, production data, and Demo isolation are unchanged                        |

---

## Linketry 0.27.8 Beginner Deployment Automation

| Area                         | Status       | Notes                                                                                                                            |
| ---------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Cloudflare bootstrap         | ✅ Complete  | Existing idempotent D1/KV dry-run/apply path remains the only required resource-creation step                                    |
| GitHub configuration         | ✅ Complete  | `deploy:configure` derives, writes, and verifies the complete minimum repository plan with no token values in arguments/logs     |
| First deployment             | ✅ Complete  | The guarded workflow creates a missing Pages project and uploads generated Worker secrets with the first Worker deployment       |
| Existing-instance capability | ✅ Complete  | A manual-only workflow syncs the protected online-upgrade secret without code deployment or migrations                           |
| Beginner documentation       | ✅ Complete  | README, self-hosting, deployment, and fresh-account rehearsal use one recommended path and correct Cloudflare token permissions  |
| Deployment regression        | ✅ Complete  | 72 deployment tests pass, including workflow ordering, fail-closed inventories, repository boundaries, and documentation         |
| Live rollout                 | ✅ Published | GitHub publishes 0.27.8 with CI deployment skipped; production Worker/Admin stay on 0.27.7 for the owner-controlled upgrade test |
| Redirect-path impact         | ✅ None      | Redirect handlers, asynchronous analytics, D1/KV behavior, migrations, production data, and Demo isolation are unchanged         |

---

## Linketry 0.27.7 Online Upgrade Bootstrap Continuity

| Area                    | Status       | Notes                                                                                                                |
| ----------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------- |
| Production evidence     | ✅ Verified  | Run `29728335970`, deployment `5518928695`, Worker health, and cache-bypassed Admin HTML confirm v0.27.6             |
| Source/target boundary  | ✅ Confirmed | v0.27.5 could not execute session-feedback code first introduced by the v0.27.6 target build                         |
| Loaded-build tracking   | ✅ Complete  | Admin records only the last loaded semantic version and never stores credentials                                     |
| Bootstrap fallback      | ✅ Complete  | A real reload plus a fresh exact target cache can infer completion when the explicit session marker is unavailable   |
| False-positive boundary | ✅ Complete  | Fresh navigation, fresh installs, unchanged builds, and ordinary update checks do not display upgrade completion     |
| Regression verification | ✅ Complete  | 58 Admin unit, 25 browser, 84 Worker, 64 deployment, 6 Demo API, and 4 site tests pass; affected builds pass         |
| Redirect/data impact    | ✅ None      | Redirects, analytics, D1, KV, migrations, secrets, deployment gates, and production data are unchanged               |
| Release status          | ✅ Published | v0.27.7 is published to `main` with `[skip ci]`; production remains on v0.27.6 for the owner-controlled upgrade test |

---

## Linketry 0.27.6 Online Upgrade Refresh Feedback

| Area                    | Status       | Notes                                                                                                                     |
| ----------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Production evidence     | ✅ Verified  | Run `29728335970`, deployment `5518928695`, Worker health, and fresh Admin assets confirm v0.27.6                         |
| Root cause              | ✅ Confirmed | Upgrade phase existed only in component memory and was lost when a stale Pages response reloaded the previous Admin build |
| Tab-scoped feedback     | ✅ Complete  | A validated 30-minute `sessionStorage` record retains only target version, timestamp, and bounded-refresh state           |
| Propagation handling    | ✅ Complete  | A stale build suppresses duplicate deployment, explains propagation, and receives one follow-up refresh                   |
| Completion confirmation | ✅ Complete  | The target build displays a dismissible upgrade-complete notice and clears the tab-scoped record on dismissal             |
| Regression verification | ✅ Complete  | 54 Admin unit, 24 browser, 84 Worker, 64 deployment, 6 Demo API, and 4 site tests pass; affected builds pass              |
| Redirect/data impact    | ✅ None      | Redirects, analytics, D1, KV, migrations, secrets, deployment gates, and production data are unchanged                    |
| Release status          | ✅ Deployed  | v0.27.6 is live after owner-controlled run `29728335970`; deployment `5518928695` is recorded under `production`          |

---

## Linketry 0.27.5 Cross-Origin Upgrade Verification

| Area                    | Status       | Notes                                                                                                              |
| ----------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------ |
| Production evidence     | ✅ Verified  | Run `29723961805`, deployment `5518104020`, Worker health, and Admin HTML all confirm v0.27.4                      |
| Browser evidence        | ✅ Verified  | The still-open v0.27.3 SPA remained stale while production was already v0.27.4                                     |
| Root cause              | ✅ Confirmed | `/api/*` allowed CORS but the cross-origin `/health` version endpoint did not return `Access-Control-Allow-Origin` |
| Public health CORS      | ✅ Complete  | `/health` permits credential-free GET/OPTIONS reads for separately hosted Admin instances                          |
| Failure semantics       | ✅ Complete  | Runtime verification failure is distinct from workflow failure and workflow timeout                                |
| Reload behavior         | ✅ Preserved | Exact version matches use the fast reload; finalizing retains the bounded fallback reload                          |
| Regression verification | ✅ Complete  | 50 Admin unit, 22 browser, 84 Worker, 64 deployment, 6 Demo API, and 4 site tests pass; affected builds pass       |
| Redirect/data impact    | ✅ None      | Redirects, analytics, D1, KV, migrations, secrets, deployment gates, and production data are unchanged             |
| Release status          | ✅ Deployed  | v0.27.5 is live after owner-controlled run `29725992523`; deployment `5518487300` is recorded under `production`   |

---

## Linketry 0.27.4 Online Upgrade Auto Reload

| Area                    | Status       | Notes                                                                                                            |
| ----------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| Live upgrade evidence   | ✅ Verified  | Run `29718967204`, deployment `5517191479`, Worker health, and a new Admin page all confirm v0.27.3              |
| Stale-page root cause   | ✅ Confirmed | The old SPA depended exclusively on its in-memory runtime poll and had no bounded finalizing reload fallback     |
| Runtime verification    | ✅ Preserved | Exact `/health` version matching still performs the normal fast success reload                                   |
| Finalizing fallback     | ✅ Complete  | A replaceable 10-second timer refreshes an old page and restarts normal version discovery                        |
| Failure boundary        | ✅ Preserved | Failed workflows never enter finalizing and therefore never schedule the fallback                                |
| Version placement       | ✅ Complete  | Version and update status now sit below the Logo instead of between footer preferences and logout                |
| Regression verification | ✅ Complete  | 48 Admin unit, 21 browser, 82 Worker, 64 deployment, 6 Demo API, and 4 site tests pass; affected builds pass     |
| Release status          | ✅ Deployed  | v0.27.4 is live after owner-controlled run `29723961805`; deployment `5518104020` is recorded under `production` |

---

## Linketry 0.27.3 Sidebar Footer Controls

| Area                    | Status        | Notes                                                                                                                     |
| ----------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Footer placement        | ✅ Complete   | Interface mode, language, theme, and owner-support controls now live together in the bottom-left Sidebar footer           |
| Previous presentation   | ✅ Restored   | Expanded and mobile Sidebars show three utility icons in one row followed by a separate full-width interface-mode status  |
| Collapsed navigation    | ✅ Preserved  | The 80px Sidebar keeps icon-only controls, update status, and logout/Demo state without changing stored collapse behavior |
| Main content toolbar    | ✅ Simplified | Desktop content chrome now contains only navigation collapse/expand and current-page context                              |
| Production environment  | ✅ Live       | Run `29718967204` produced deployment `5517191479` under the GitHub `production` environment                              |
| Regression verification | ✅ Complete   | 48 Admin unit, 20 browser, 82 Worker, 64 deployment, 6 Demo API, and 4 site tests pass; affected builds pass              |
| Redirect/data impact    | ✅ None       | Redirect handlers, analytics scheduling, D1/KV behavior, migrations, production data, and Demo isolation are unchanged    |
| Release status          | ✅ Deployed   | v0.27.3 is live after the owner-controlled production online-upgrade test                                                 |

---

## Linketry 0.27.2 Online Upgrade Production Validation

| Area                   | Status         | Notes                                                                                                                           |
| ---------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Repository secret      | ✅ Configured  | Fine-grained token is limited to `everett7623/Linketry` with Actions read and write only                                        |
| Worker secret delivery | ✅ Complete    | Production workflow run `29715930612` completed successfully and configured the optional online-upgrade Worker secret           |
| Current production     | ✅ 0.27.2 live | Online-upgrade workflow run `29717446925` deployed Worker and Admin successfully; `/health` reports v0.27.2                     |
| Discovery target       | ✅ Published   | Repository metadata exposes v0.27.2 through a `[skip ci]` commit, so no push deployment is triggered                            |
| Admin discovery        | ✅ Verified    | Authenticated production Admin shows running v0.27.1, available v0.27.2, release details, and the enabled online-upgrade action |
| Owner confirmation     | ✅ Complete    | The owner confirmed the in-app upgrade; the workflow completed and the production Admin now reports v0.27.2                     |
| Deployment tracking    | ✅ Live        | Online-upgrade run `29718967204` is recorded under the GitHub `production` environment                                          |
| Credential exposure    | ✅ None        | The GitHub token is not returned by APIs, embedded in Admin assets, logged, or committed                                        |
| Redirect/data impact   | ✅ None        | Redirect handlers, D1 records, KV cache behavior, migrations, production domains, and Demo isolation are unchanged              |

---

## Linketry 0.27.1 Accessibility And Fresh-account UX

| Area                     | Status        | Notes                                                                                                                                           |
| ------------------------ | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Automated accessibility  | ✅ Complete   | Axe covers Login, Overview, Links, Create/Edit, Analytics, Settings, dialogs, light theme, and mobile navigation                                |
| Keyboard and focus       | ✅ Complete   | Modals and the mobile drawer enter, trap, dismiss, and restore focus; background scrolling is contained                                         |
| Forms and controls       | ✅ Complete   | Errors, hints, busy state, notifications, icon actions, filters, and template controls expose localized semantics                               |
| Motion and contrast      | ✅ Verified   | Reduced-motion preferences suppress nonessential transitions and tested dark/light surfaces meet the contrast baseline                          |
| Fresh-account owner path | ✅ Documented | One exact checklist covers scoped credentials, bootstrap, GitHub environments, DNS-only CNAMEs, R2, smoke, and rollback                         |
| Deployment contract      | ✅ Complete   | Automated checks keep repository-scoped GitHub commands, both Demo domains, DNS mode, and both optional R2 bindings                             |
| Toolchain security       | ✅ Clean      | Admin/site use Vite 6.4.3 and the official npm registry reports zero full-tree vulnerabilities                                                  |
| Admin performance        | ✅ Preserved  | The Vite 6 entry is 315.06 KB before gzip, about 45% below the 573.7 KB pre-route-splitting baseline                                            |
| Test verification        | ✅ Complete   | 64 deployment, 82 Worker, 48 Admin unit, 20 Admin browser, 6 Demo API, and 4 site tests pass; all builds pass                                   |
| Redirect-path impact     | ✅ None       | Redirect handlers, async analytics, D1/KV behavior, migrations, production domains, and Demo isolation are unchanged                            |
| Live rollout             | ✅ Complete   | Production run `29692860714` and isolated Demo run `29692906598` deployed v0.27.1 successfully                                                  |
| Live parity              | ✅ Verified   | Three health origins report v0.27.1, both Admin assets carry the v0.27.1 key, production rejects unauthenticated reads, and Demo rejects writes |

---

## Linketry 0.27.0 Product Quality And Conversion UX

| Area                          | Status      | Notes                                                                                                                    |
| ----------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| Progressive Analytics filters | ✅ Complete | Date range stays visible; fourteen attribution fields expand on demand and saved views restore the required state        |
| Conversion semantics          | ✅ Complete | Human clicks, events, Event Rate, goals, and value are separated; event rate is not presented as session attribution     |
| Conversion value              | ✅ Complete | API, Admin, per-link Analytics, rolling-version fallback, and CSV keep values separated by currency                      |
| Mobile layout                 | ✅ Verified | Compact actions, two-column metrics, collapsed advanced filters, and expanded filters avoid horizontal overflow          |
| Admin performance             | ✅ Complete | Route-level page chunks reduce the entry bundle from about 573.7 KB to 298.0 KB before gzip                              |
| Product gap audit             | ✅ Complete | `docs/PRODUCT_GAP_AUDIT.md` prioritizes pre-1.0, core enhancement, optional, and non-goal work                           |
| Dependency security           | ✅ Clean    | Official npm production audit reports zero known vulnerabilities                                                         |
| Test verification             | ✅ Complete | 63 deployment, 82 Worker, 48 Admin unit, 20 Admin browser, 6 Demo API, and 4 site tests pass; all builds pass            |
| Live rollout                  | ✅ Complete | Production run `29688775610` and Demo run `29688826084` deployed v0.27.0 successfully                                    |
| Live parity                   | ✅ Verified | Both health endpoints and both Admin favicon cache keys report v0.27.0; project-site Demo and coffee links remain active |
| Redirect-path impact          | ✅ None     | Redirect handlers, asynchronous visit writes, D1/KV behavior, migrations, and production domains are unchanged           |

---

## Linketry 0.26.7 Sidebar Version And Update Status

| Area                    | Status       | Notes                                                                                                                          |
| ----------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Footer placement        | ✅ Complete  | Running version and update state live at the bottom-left on expanded, collapsed, and mobile navigation                         |
| Automatic discovery     | ✅ Preserved | Admin checks on open, refreshes visible sessions every 15 minutes, and never requires the operator to visit Settings           |
| Persistent notice       | ✅ Complete  | Available-version status remains visible after the release banner is dismissed; clicking it rechecks and resurfaces the action |
| Toolbar alignment       | ✅ Complete  | The duplicate top-right update control and the version text under the Logo were removed                                        |
| Responsive verification | ✅ Complete  | Desktop, collapsed, and 390px mobile layouts have no horizontal overflow or footer overlap                                     |
| Test verification       | ✅ Complete  | 63 deployment, 81 Worker, 48 Admin unit, 20 Admin browser, 6 Demo API, and 4 site tests pass; builds pass                      |
| Live rollout            | ✅ Complete  | Demo run `29655669311` and production run `29655669485` deployed v0.26.7 successfully                                          |
| Live parity             | ✅ Verified  | Both health endpoints and both Admin favicon cache keys report v0.26.7                                                         |
| Release action boundary | ✅ Preserved | Applying an update still requires an explicit click; one-click mode still depends on the protected GitHub token                |
| Redirect-path impact    | ✅ None      | Redirect handlers, asynchronous analytics, D1/KV data, migrations, and production domains are unchanged                        |

---

## Linketry 0.26.6 Demo Gateway Repeat Deployment

| Area                 | Status      | Notes                                                                                                        |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| Wrangler inventory   | ✅ Fixed    | Both `name` and Wrangler 4.111's `Project Name` JSON fields identify an existing API Pages project           |
| Duplicate protection | ✅ Complete | Repeat deployments no longer attempt to recreate `linketry-demo-api`                                         |
| Failure containment  | ✅ Verified | Run `29646559998` stopped before Worker secrets, migrations, seed writes, Worker deploy, and Admin deploy    |
| Verification         | ✅ Local    | 63 deployment, 81 Worker, 48 Admin unit, 20 Admin browser, 6 gateway, and 4 site tests pass; builds pass     |
| Live rollout         | ✅ Complete | Demo run `29647646987` and production run `29647646808` deployed v0.26.6 successfully                        |
| Branded API          | ✅ Active   | `demoapi.linketry.com` reports v0.26.6, Admin compiles that origin, 18 read APIs pass, and writes return 403 |
| Redirect-path impact | ✅ None     | Redirect handlers, asynchronous analytics, D1/KV data, and production domains are unchanged                  |

---

## Linketry 0.26.5 Branded Demo API Gateway

| Area                       | Status       | Notes                                                                                                                   |
| -------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Product namespace          | ✅ Decided   | `linketry.com`, `demo.linketry.com`, and `demoapi.linketry.com` serve the project/Demo; production remains on `uukk.de` |
| Isolated gateway           | ✅ Complete  | A Demo-account Pages Function proxies only `/health` and `/api/*` through a Service Binding to the Demo Worker          |
| Data/resource ownership    | ✅ Preserved | D1, KV, Queue, optional R2, redirect handling, and the read-only policy remain exclusively on the Demo Worker           |
| Deployment gate            | ✅ Complete  | Public API, Worker origin, gateway project, custom domain, protected resources, and write ordering are validated        |
| Custom-domain registration | ✅ Active    | `demoapi.linketry.com` is associated with `linketry-demo-api` and serves a valid Pages certificate                      |
| DNS activation             | ✅ Complete  | DNS-only CNAME `demoapi` points to `linketry-demo-api.pages.dev`; the Demo Admin uses the branded API                   |
| Verification               | ✅ Local     | 6 gateway and 60 deployment-policy tests pass; Wrangler compiles the Pages Function successfully                        |
| Live rollout               | ✅ Complete  | Demo run `29641004812` and production run `29641004768` deployed v0.26.5; both Admins report the same version           |
| Redirect-path impact       | ✅ None      | Production/Demo redirect handlers and asynchronous analytics code were not changed                                      |

---

## Linketry 0.26.4 Release Readiness Diagnostics

| Area                    | Status         | Notes                                                                                                           |
| ----------------------- | -------------- | --------------------------------------------------------------------------------------------------------------- |
| Shared update state     | ✅ Complete    | Toolbar, banner, and Settings consume one check result, error state, and timestamp                              |
| Release status          | ✅ Complete    | Settings shows installed/latest versions, last check time, and whether an update is available                   |
| Upgrade readiness       | ✅ Complete    | One-click, manual, invalid, and unavailable Worker capability states are visible without secret values          |
| Refresh accuracy        | ✅ Fixed       | Cached checks retain their original timestamp; overlapping checks retain an accurate busy state                 |
| Verification            | ✅ Complete    | 53 deployment, 81 Worker, 48 Admin unit, 20 Admin browser, and 4 site tests passed; builds passed               |
| Live Demo rollout       | ✅ Complete    | Run `29636513938` deployed v0.26.4 and passed the isolated Demo production-parity gate                          |
| Production rollout      | ✅ Complete    | Run `29636582863` deployed v0.26.4 Worker, Admin, and project site from commit `7e56405`                        |
| Live release status     | ✅ Verified    | Demo Settings reports installed/latest v0.26.4 and accurately identifies manual deployment mode                 |
| Version parity          | ✅ Verified    | Both Workers report v0.26.4; both Admins return 200 and expose the v0.26.4 favicon cache key                    |
| Fresh-account rehearsal | ✅ Complete    | The new isolated Demo account completed core D1/KV/Queue/Worker/Pages deployment and live smoke checks          |
| Demo R2 activation      | 🟡 External    | Run `29639154619` still returns account-level code `10042`; every Cloudflare write step was skipped             |
| One-click upgrade token | 🟡 External    | `LINKETRY_GITHUB_UPDATE_TOKEN` is absent; creating the fine-grained GitHub token requires owner action          |
| Branded Demo API        | ✅ Implemented | v0.26.5 adds `demoapi.linketry.com` through a Demo-account Pages Function; live DNS activation is tracked above |
| Redirect-path impact    | ✅ None        | Redirect handlers, analytics scheduling, D1/KV data, migrations, and production resources are unchanged         |

---

## Linketry 0.26.3 Brand Cache And Update Discovery

| Area                   | Status       | Notes                                                                                                   |
| ---------------------- | ------------ | ------------------------------------------------------------------------------------------------------- |
| Canonical Logo         | ✅ Verified  | Production Admin, project site, and repository dark Logo files have identical SHA256 content            |
| Logo cache refresh     | ✅ Fixed     | BrandMark and Admin browser favicon URLs include the exact running version                              |
| Automatic discovery    | ✅ Improved  | Visible Admin sessions refresh GitHub metadata every 15 minutes instead of caching for six hours        |
| Manual discovery       | ✅ Complete  | Desktop and mobile toolbars can force an immediate check and show current/new/error feedback            |
| Upgrade action clarity | ✅ Corrected | Automatic capability shows Online upgrade; otherwise the protected manual fallback says Open deployment |
| Credential boundary    | ✅ Preserved | Anonymous version checks never send Admin or GitHub credentials                                         |
| Verification           | ✅ Complete  | 53 deployment, 81 Worker, 48 Admin unit, 19 Admin browser, and 4 site tests passed; builds passed       |
| Live Demo rollout      | ✅ Complete  | Run `29634990846` deployed v0.26.3 and passed the isolated Demo production-parity gate                  |
| Production rollout     | ✅ Complete  | Run `29635088591` deployed v0.26.3 Worker, Admin, and project site from commit `ffc7d51`                |
| Version parity         | ✅ Verified  | Both Workers report v0.26.3; both Admins return 200 and expose the v0.26.3 favicon cache key            |
| Redirect-path impact   | ✅ None      | Redirects, Worker routes, D1/KV data, migrations, and production resources were not changed             |

---

## Linketry 0.26.2 GitHub Actions Node.js 24 Runtime

| Area                  | Status       | Notes                                                                                                           |
| --------------------- | ------------ | --------------------------------------------------------------------------------------------------------------- |
| Checkout action       | ✅ Updated   | Production and Demo workflows use `actions/checkout@v6`                                                         |
| Node setup action     | ✅ Updated   | Production and Demo workflows use `actions/setup-node@v6` with explicit Node.js 24 and npm caching              |
| Regression policy     | ✅ Complete  | Workflow contract tests require both v6 actions and reject the deprecated Node.js 20 v4 actions                 |
| Deployment boundaries | ✅ Preserved | Permissions, credentials, release approvals, Cloudflare gates, migrations, and write ordering are unchanged     |
| Verification          | ✅ Complete  | 53 deployment, 81 Worker, 47 Admin unit, 18 Admin browser, and 4 project-site tests passed; builds passed       |
| Live Demo rollout     | ✅ Complete  | Run `29604677229` used both v6 actions with no annotations, deployed v0.26.2, and passed the 18-API parity gate |
| Production rollout    | ✅ Complete  | Run `29625316532` used both v6 actions with no annotations and deployed v0.26.2 Worker, Admin, and project site |
| Version parity        | ✅ Verified  | Production and Demo Worker/Admin report v0.26.2; production `401`/`404` and Demo `403` boundaries passed        |
| Runtime impact        | ✅ None      | Redirects, Worker code, D1/KV data, migrations, and deployed Cloudflare resources were not changed              |

---

## Linketry 0.26.1 Optional Cloudflare Capability Preflight

| Area                       | Status         | Notes                                                                                                                                 |
| -------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| R2 capability check        | ✅ Complete    | Configured R2 bindings trigger a read-only bucket inventory before any migration, resource creation, or deployment write              |
| Queue capability check     | ✅ Complete    | Configured Visit Queue bindings trigger a read-only Queue inventory in the same fail-closed gate                                      |
| Missing optional resources | ✅ Guarded     | Successful inventory with missing names warns and permits the later guarded creation step                                             |
| R2 account error           | ✅ Explained   | Cloudflare code `10042` identifies R2 as unavailable in the exact selected account and blocks before writes                           |
| Live Demo core             | ✅ 0.26.1 live | Run `29602948600` passed; D1, KV, Queue, Worker, Pages, Analytics, 18 read APIs, and the read-only boundary are healthy               |
| Live Demo R2               | 🟡 External    | The Demo account still returns Cloudflare `10042`; R2 variables remain disabled until that account accepts R2 API access              |
| Live R2 gate               | ✅ Verified    | Run `29602738195` stopped at read-only preflight with no mutations; all resource, migration, seed, and deployment writes were skipped |
| Verification               | ✅ Complete    | 53 deployment, 81 Worker, 47 Admin unit, 18 Admin browser, and 4 project-site tests passed; type-checks and builds passed             |
| Redirect-path impact       | ✅ None        | Redirect handlers, asynchronous analytics, D1/KV ownership, migrations, and deployed runtime code were not changed                    |

---

## Linketry 0.26.0 Admin Shell And Analytics Accuracy

| Area                     | Status       | Notes                                                                                                                                                  |
| ------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Desktop shell            | ✅ Complete  | Sidebar brand and main toolbar share a 64px height; utilities and mode controls are grouped in the toolbar                                             |
| Version visibility       | ✅ Complete  | The exact running version appears beneath the Logo and links to the changelog                                                                          |
| Near-real-time Analytics | ✅ Complete  | Aggregate and per-link pages support manual refresh and saved 5/10/30 second polling that pauses in hidden tabs                                        |
| Conversion rate          | ✅ Corrected | Events are divided by eligible human clicks, with classified bot clicks excluded                                                                       |
| Filter attribution       | ✅ Guarded   | Visit-only country/device/browser/referrer filters make conversion metrics unavailable until visit-level attribution exists                            |
| Conversion ingestion     | ✅ Hardened  | Optional `event_id` supports idempotent server retries and values are separated by currency                                                            |
| Verification             | ✅ Complete  | Admin unit/build, Worker type/test, and 18-test Admin browser smoke coverage pass                                                                      |
| Production/Demo rollout  | ✅ Complete  | Protected production run `29594282900` and isolated Demo run `29594530129` completed successfully                                                      |
| Live smoke checks        | ✅ Complete  | Health/version, Admin metadata, auth `401`, missing-link `404`, Demo write `403`, conversion filters, desktop/mobile layout, and manual refresh passed |
| Redirect-path impact     | ✅ None      | Redirect handlers, KV cache behavior, D1 link records, and asynchronous visit recording were not changed                                               |

---

## Linketry 0.25.10 Main Toolbar Navigation Toggle

| Area                    | Status      | Notes                                                                                 |
| ----------------------- | ----------- | ------------------------------------------------------------------------------------- |
| Desktop shell           | ✅ Complete | Collapse/expand is positioned at the left edge of the main content toolbar            |
| Sidebar                 | ✅ Complete | Branding, navigation, and utility actions no longer contain the desktop toggle        |
| Responsive verification | ✅ Complete | Expanded, collapsed, mobile, dark, and light layouts were verified                    |
| Redirect-path impact    | ✅ None     | Worker redirects, KV cache behavior, D1 data, and production domains were not changed |

---

## Linketry 0.25.9 Sidebar Toggle Placement

| Area                    | Status      | Notes                                                                                    |
| ----------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| Brand area              | ✅ Complete | The desktop Logo row contains only the Linketry brand                                    |
| Navigation toggle       | ✅ Complete | Collapse/expand remains available in a dedicated navigation row and persists per browser |
| Responsive verification | ✅ Complete | Expanded, collapsed, mobile, dark, and light layouts were verified                       |
| Redirect-path impact    | ✅ None     | Worker redirects, KV cache behavior, D1 data, and production domains were not changed    |

---

## Linketry 0.25.8 Cross-platform Demo Parity Verification

| Area                 | Status      | Notes                                                                                                      |
| -------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| SVG comparison       | ✅ Complete | Canonical dark/light Logo validation normalizes `CRLF` and `LF` while preserving strict content comparison |
| Windows regression   | ✅ Complete | Local parity tests cover Windows checkout line endings against Pages-deployed assets                       |
| v0.25.7 rollout      | ✅ Complete | Production and isolated Demo deployments completed with all release and live parity gates passing          |
| Redirect-path impact | ✅ None     | Redirect handlers, KV cache behavior, D1 production data, and production domains were not changed          |

---

## Linketry 0.25.7 Demo Production Parity

| Area                    | Status      | Notes                                                                                                                      |
| ----------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| Live drift diagnosis    | ✅ Complete | `demo.linketry.com` was confirmed on v0.25.1 with no deployed light Logo asset while the repository was already on v0.25.6 |
| Brand source parity     | ✅ Complete | Admin and project site dark/light SVG assets must remain byte-identical                                                    |
| Production route parity | ✅ Complete | Demo and production use the same complete `App.tsx` route inventory                                                        |
| Advanced synthetic data | ✅ Complete | UTM, notes, notification, webhook, anomaly, groups, analytics, backup, token, audit, and health read surfaces have samples |
| Post-deployment gate    | ✅ Complete | Version meta, two Logo hashes, 18 read APIs, and write rejection are verified against the live Demo                        |
| Redirect-path impact    | ✅ None     | Redirect handlers, KV cache behavior, D1 production data, and production domains were not changed                          |
| Production/Demo rollout | ✅ Complete | v0.25.7 is live in production and the isolated Demo; the public parity gate completed successfully                         |

---

## Linketry 0.25.6 Demo Access And Workspace Layout

| Area                   | Status       | Notes                                                                                                                 |
| ---------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| Demo preview entry     | ✅ Complete  | The isolated Demo uses a public preview access code and stores only a local browser grant                             |
| Demo API boundary      | ✅ Preserved | Worker reads remain synthetic, read-only, rate-limited, and write requests are rejected before routing                |
| Cloudflare credentials | ✅ Isolated  | Demo deployment permissions belong to the Demo account and are not exposed through the Admin or reused for production |
| Desktop navigation     | ✅ Complete  | Sidebar collapse state is persisted per browser; mobile navigation remains an overlay drawer                          |
| Workspace width        | ✅ Complete  | Main content and operational banners use the available desktop width up to 1600px                                     |
| Language roadmap       | ✅ Recorded  | Additional locales will land in reviewed batches with catalog, formatting, and browser coverage gates                 |
| Redirect-path impact   | ✅ None      | Redirect handlers, KV cache behavior, D1 link data, and visit recording were not changed                              |
| Production rollout     | 🟡 Pending   | v0.25.6 is implemented locally; production activation requires commit, push, and a successful protected deployment    |

---

## Linketry 0.25.5 In-App One-Click Upgrade

| Area                  | Status       | Notes                                                                                                                     |
| --------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Admin upgrade flow    | ✅ Complete  | Available updates can be confirmed in the Admin, tracked through GitHub Actions, verified against `/health`, and reloaded |
| Credential boundary   | ✅ Complete  | The optional fine-grained GitHub token remains a Worker secret and is never returned to or embedded in the browser        |
| Deployment target     | ✅ Fixed     | The Worker can trigger only `deploy.yml` for the configured repository and branch                                         |
| Existing safety gates | ✅ Preserved | Release approval, migration digest, backup, target, destructive-operation, and remote-resource checks still apply         |
| Manual fallback       | ✅ Preserved | Installations without the optional token continue to open the protected GitHub Actions workflow                           |
| Redirect-path impact  | ✅ None      | Redirect handlers, KV cache behavior, D1 link data, and visit recording were not changed                                  |
| Production rollout    | 🟡 Pending   | v0.25.5 is implemented locally; production activation requires the optional repository secret and a successful deploy     |

---

## Linketry 0.25.4 Safe Online Upgrade

| Area                    | Status       | Notes                                                                                                     |
| ----------------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| Production recovery     | ✅ Complete  | v0.25.3 approval variables were synchronized and Worker/Admin/site deployment completed successfully      |
| Admin upgrade entry     | ✅ Complete  | Update notices link to the deployment repository changelog and protected production workflow              |
| Manual release approval | ✅ Complete  | Authenticated workflow dispatch approves only the selected branch's exact package version and commit      |
| Existing safety gates   | ✅ Preserved | Migration digest, backup, review, target, destructive-operation, and remote-resource checks remain active |
| Browser credential risk | ✅ None      | GitHub and Cloudflare credentials never enter Admin browser code                                          |
| Redirect-path impact    | ✅ None      | Redirect handlers, KV cache behavior, D1 link data, and visit recording were not changed                  |

---

## Linketry 0.25.3 Brand Logo Refresh

| Area                 | Status      | Notes                                                                                            |
| -------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| Canonical logo       | ✅ Complete | GitHub README, Admin, and project-site surfaces use the `linketry.com` SVG mark                  |
| Day logo             | ✅ Complete | Matching `favicon-light.svg` assets exist for light displays                                     |
| Default presentation | ✅ Complete | Admin and the project site keep dark/night presentation as the default when no preference exists |
| Runtime impact       | ✅ None     | Redirect handlers, API contracts, D1, KV, R2, Queue, and production data were not changed        |

---

## Linketry 0.25.2 Demo Rollout Record

| Area                    | Status       | Notes                                                                                                              |
| ----------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------ |
| Core Demo rollout       | ✅ Live      | D1, KV, Worker, Pages, migrations, synthetic data, and all 17 Admin routes are live                                |
| Responsive verification | ✅ Passed    | The 390x844 layout has no horizontal overflow and exposes the complete navigation drawer                           |
| Read-only enforcement   | ✅ Passed    | A live create attempt is rejected by the public Demo client guard                                                  |
| R2 and Queue runtime    | 🟡 Partial   | The rotated token and Queue are active; R2 remains disabled after the selected account returned Cloudflare `10042` |
| API custom domain       | ↪ Superseded | The original pending decision was resolved by the isolated Pages gateway implemented in v0.26.5                    |
| Production impact       | ✅ None      | Production Cloudflare resources, DNS, credentials, data, and redirects were not changed                            |

---

## Linketry 0.25.1 Demo Deployment Compatibility

| Area               | Status       | Notes                                                                                        |
| ------------------ | ------------ | -------------------------------------------------------------------------------------------- |
| Resource discovery | ✅ Fixed     | R2 and Queue existence checks use current Wrangler text output instead of removed JSON flags |
| Deployment safety  | ✅ Preserved | The isolation gate still passes before any Cloudflare resource creation or deployment        |
| Production impact  | ✅ None      | Production resources, credentials, workflow triggers, and redirect behavior remain unchanged |

---

## Linketry 0.25.0 Demo Parity And Responsive Admin

| Area                    | Status       | Notes                                                                                                      |
| ----------------------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| Complete Demo surface   | ✅ Complete  | Fresh Demo sessions start in Advanced mode and expose all 17 production Admin routes                       |
| Mobile Admin layout     | ✅ Fixed     | Narrow viewports use an accessible overlay drawer instead of a fixed sidebar that crushes page content     |
| Advanced synthetic data | ✅ Complete  | Rules, imports, tokens, health history, saved views, reports, backups, and audit records are populated     |
| Demo capabilities       | 🟡 Partial   | The Demo Queue is live; R2 names remain safety-gated while the selected account returns Cloudflare `10042` |
| Setup guidance          | ✅ Corrected | Public Demo Setup explains read-only isolation instead of production Admin-token recovery                  |
| Redirect-path impact    | ✅ None      | Redirect handlers, KV cache behavior, D1 ownership, and production deployment behavior are unchanged       |

---

## Linketry 0.24.0 Public Demo And Coffee Entry Points

| Area                 | Status      | Notes                                                                                          |
| -------------------- | ----------- | ---------------------------------------------------------------------------------------------- |
| Official site Demo   | ✅ Live     | `linketry.com` links to `https://demo.linketry.com` in the header, hero, and footer            |
| Visitor access       | ✅ No token | Public reads open directly; the internal Admin token remains a random, unexposed Worker secret |
| Demo data boundary   | ✅ Enforced | The public instance is read-only, synthetic-only, rate-limited, and isolated from production   |
| Coffee destination   | ✅ Active   | Project-site and Admin support actions use `https://everettlabs.dev/coffee/`                   |
| Redirect-path impact | ✅ None     | No redirect handler, D1, KV, migration, or production Worker behavior changed                  |

---

## Linketry 0.23.0 Official Site And Public Read-Only Demo

| Area                    | Status            | Notes                                                                                                                      |
| ----------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Official project site   | ✅ Live           | `https://linketry.com` resolves through `linketry-site` Pages and passed DNS, TLS, HTTP, and canonical metadata checks     |
| Repository model        | ✅ One repository | Site, self-hosted product, and Demo share this repository; Demo Cloudflare resources and credentials remain fully isolated |
| Public Admin            | ✅ Read only      | No login token is exposed; the UI shows an EN/ZH Demo banner and blocks browser-side mutations                             |
| Worker enforcement      | ✅ Read only      | Mutating Demo API requests return 403, while safe reads can bypass owner authentication only in explicit Demo mode         |
| Synthetic-only boundary | ✅ Enforced       | Redirects still work, but public visits do not change Demo analytics; deploys refresh an idempotent synthetic dataset      |
| Abuse control           | ✅ Implemented    | Demo API reads use Cloudflare's native Rate Limiting binding with a hashed client key and 120 requests/minute              |
| Live Demo resources     | ✅ Live           | Separate-account D1/KV/Worker/Pages resources and scoped credentials are active and smoke tested                           |

---

## Linketry 0.22.0 Privacy-Safe Traffic Anomaly Alerts

| Area                 | Status      | Notes                                                                                                    |
| -------------------- | ----------- | -------------------------------------------------------------------------------------------------------- |
| Detection window     | ✅ Complete | Latest 24 hours compared with the bounded previous 7-day daily baseline                                  |
| Explainable signals  | ✅ Complete | Volume multiplier and bot-rate percentage-point evidence with a configurable minimum sample              |
| Alert lifecycle      | ✅ Complete | Opt-in daily Cron evaluation, manual run, repeat suppression, active state, and recovery notifications   |
| Admin and API        | ✅ Complete | EN/ZH Analytics controls plus authenticated status, config, and run endpoints in OpenAPI                 |
| Privacy boundary     | ✅ Verified | Only aggregate counts/rates are persisted; no new visitor, IP, session, referrer, or country identifiers |
| Redirect-path impact | ✅ None     | Redirect handler, redirect rules, D1 link ownership, and KV cache behavior are unchanged                 |

---

## Linketry 0.21.0 Admin Utility Actions

| Area              | Status       | Notes                                                                                     |
| ----------------- | ------------ | ----------------------------------------------------------------------------------------- |
| Sidebar utilities | ✅ Complete  | Language, light/dark theme, and support are three equal icon controls                     |
| Language          | ✅ Preserved | Sidebar cycles registered locales; Login and Settings retain the full selector            |
| Theme             | ✅ Complete  | Quick action switches the resolved light/dark theme; Settings still supports system mode  |
| Support           | ✅ Active    | Canonical project-support link is https://everettlabs.dev/coffee/                         |
| Refactor safety   | ✅ Verified  | All 17 routes and four navigation groups retain their original order and visibility flags |
| Runtime impact    | ✅ None      | Worker, redirects, API, D1, KV, and deployment behavior are unchanged                     |

---

## Linketry 0.20.2 Development Documentation

| Area                      | Status      | Notes                                                                                         |
| ------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| Architecture              | ✅ Complete | Current redirect, D1/KV, async, data, and failure boundaries documented from code             |
| Development workflow      | ✅ Complete | Code placement, verification matrix, deployment tracks, and release hygiene documented        |
| Original-plan integration | ✅ Complete | Useful import, analytics, fallback, and lifecycle ideas were routed into maintained documents |
| Obsolete guidance         | ✅ Excluded | Historical names, domains, unversioned APIs, and stale schema assumptions were not copied     |
| Runtime impact            | ✅ None     | Redirect behavior, API contracts, migrations, bindings, and production data are unchanged     |

---

## Linketry 0.11 Identity Cutover

| Area              | Status                   | Notes                                                                                                                                         |
| ----------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Product identity  | ✅ Complete              | Linketry; author `everettlabs`; website `linketry.com`; repository `everett7623/Linketry`; image `everett7623/linketry`                       |
| API namespace     | ✅ Complete              | `/api/v1` is canonical; compatibility aliases remain limited to the API deprecation policy                                                    |
| Existing data     | ✅ Preserved             | All 14 production D1 tables retained exact row counts; all 10 R2 backup objects copied and verified                                           |
| Configuration     | ✅ Complete              | Worker and GitHub Actions use only canonical `LINKETRY_*` configuration and secret names                                                      |
| Admin session     | ✅ Complete              | Admin uses only canonical Linketry browser-storage keys                                                                                       |
| Cache and backup  | ✅ Complete              | D1 remains the source of truth; canonical cache keys and backup markers are enforced                                                          |
| Cloudflare        | ✅ Complete              | Worker, Pages, D1, KV, R2, and Queue use canonical Linketry resource names                                                                    |
| Deployment tracks | 🟡 Rehearsal in progress | Guided D1/KV provisioning, production enforcement, and the isolated live Demo are complete; only the beginner fresh-account rehearsal remains |

---

## V1 Feature Checklist

### Core

| Feature                         | Code | Tested |
| ------------------------------- | ---- | ------ |
| `GET /health`                   | ✅   | ✅     |
| `GET /:slug` redirect           | ✅   | ✅     |
| KV cache (read / write / clear) | ✅   | ✅     |
| D1 fallback on KV miss          | ✅   | ✅     |
| 404 HTML page                   | ✅   | ✅     |
| Disabled link HTML page         | ✅   | ✅     |
| Async visit recording           | ✅   | ✅     |

### Admin API

| Endpoint                            | Code | Tested |
| ----------------------------------- | ---- | ------ |
| `POST /api/v1/auth/login`           | ✅   | ✅     |
| `GET  /api/v1/auth/me`              | ✅   | ✅     |
| `GET    /api/v1/links`              | ✅   | ✅     |
| `POST   /api/v1/links`              | ✅   | ✅     |
| `GET    /api/v1/links/:id`          | ✅   | ✅     |
| `PUT    /api/v1/links/:id`          | ✅   | ✅     |
| `DELETE /api/v1/links/:id`          | ✅   | ✅     |
| `POST   /api/v1/links/:id/disable`  | ✅   | ✅     |
| `POST   /api/v1/links/:id/enable`   | ✅   | ✅     |
| `POST   /api/v1/links/:id/archive`  | ✅   | ✅     |
| `POST   /api/v1/links/:id/restore`  | ✅   | ✅     |
| `GET    /api/v1/tags`               | ✅   | ✅     |
| `POST   /api/v1/tags`               | ✅   | ✅     |
| `PUT    /api/v1/tags/:id`           | ✅   | ✅     |
| `DELETE /api/v1/tags/:id`           | ✅   | ✅     |
| `GET    /api/v1/settings`           | ✅   | ✅     |
| `PUT    /api/v1/settings`           | ✅   | ✅     |
| `GET    /api/v1/export/links.csv`   | ✅   | ✅     |
| `GET    /api/v1/export/links.json`  | ✅   | ✅     |
| `GET    /api/v1/export/backup.json` | ✅   | ✅     |
| `GET    /api/v1/export/visits.csv`  | ✅   | ✅     |
| Pre-import backup download          | ✅   | ⏳     |
| `POST   /api/v1/import/preview`     | ✅   | ✅     |
| `POST   /api/v1/import/confirm`     | ✅   | ✅     |
| `GET    /api/v1/import/jobs`        | ✅   | ✅     |

### Import Adapters

| Adapter      | Code | Tested |
| ------------ | ---- | ------ |
| Shlink JSON  | ✅   | ✅     |
| Shlink JSONL | ✅   | ⏳     |
| Shlink CSV   | ✅   | ⏳     |
| Generic CSV  | ✅   | ⏳     |
| Generic JSON | ✅   | ⏳     |

### Admin Frontend Pages

| Page            | Code | Tested |
| --------------- | ---- | ------ |
| Login           | ✅   | ✅     |
| Overview        | ✅   | ✅     |
| Links list      | ✅   | ✅     |
| Create Link     | ✅   | ✅     |
| Edit Link       | ✅   | ✅     |
| Import / Export | ✅   | ✅     |
| Settings        | ✅   | ✅     |
| Tags            | ✅   | ⏳     |

---

## Next Steps

1. Complete deployment Bootstrap with a fresh-account first-link rehearsal; guided provisioning, three-track preflight, production enforcement, and the separate Demo workflow are complete
2. Keep the isolated Demo Worker on its synthetic-only `workers.dev` origin; no additional branded redirect hostname is required
3. Design optional Cloudflare Access without weakening bearer-token recovery; the asynchronous signed click Webhook is already complete
4. Keep social preview customization, new reviewed locale catalogs, real-time visuals, optional AI, and external clients behind the foundational work
5. Keep Shlink retirement operations deferred until their external prerequisites are ready

---

## Known Issues

| Issue                                               | Status          | Notes                                                                                           |
| --------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| Browser plugin instability                          | ℹ️ Not blocking | API and production smoke checks completed; browser plugin not required for remaining cutover    |
| Admin API on `workers.dev` unavailable              | ℹ️ Not blocking | Admin should be built with the configured Worker/API origin                                     |
| Wrangler v3 update warning                          | ✅ Fixed        | Project toolchain upgraded to Wrangler 4.111.0 in v0.13.0                                       |
| KV stale active entry after admin changes           | ✅ Fixed        | Redirect handler now re-checks D1 on KV hits and preserves active KV only if D1 is unavailable  |
| API Origin override cleared after transient failure | ✅ Fixed        | Admin only persists fallback to the build-time API after that origin authenticates successfully |
| Large Shlink import confirm timeout                 | ✅ Fixed        | v0.9.13 returns a pending job before background parsing and reports failed jobs correctly       |
| Large import stops after about 73 links             | ✅ Fixed        | v0.9.16 batches D1 writes; actual 195-row CSV passed first-import and duplicate-import checks   |
| Admin remains in importing state after completion   | ✅ Fixed        | v0.9.17 uses immediate non-cached polling and clears completed import state                     |

## Migration Status

| Source                           | Status      | Notes                                                             |
| -------------------------------- | ----------- | ----------------------------------------------------------------- |
| Shlink API                       | ✅ Imported | 195 links imported into production Linketry, 0 failed, 0 skipped  |
| Duplicate import safety          | ✅ Verified | Re-preview after import reports 195 conflicts and 0 valid imports |
| Imported redirect spot-check     | ✅ Verified | Sample slugs return 302 from production Worker                    |
| Legacy short-domain cutover plan | ✅ Prepared | See `CUTOVER.md`; cutover not executed yet                        |

---

## Version Status

| Version | Status          |
| ------- | --------------- |
| V2      | ✅ Done         |
| V3      | ✅ Done         |
| V4      | ✅ Done         |
| V5      | ✅ Done         |
| V6      | ✅ Done         |
| V7      | In Progress     |
| V8      | ✅ Done         |
| V9      | In Progress     |
| V10     | Future optional |

Database columns for V2–V4 are already present in `migrations/0001_init.sql` to avoid future migration complexity.

### V2 Progress

| Feature                             | Status  | Notes                                                                                                          |
| ----------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| QR code generation                  | ✅ Done | Links table action opens QR preview and downloads PNG                                                          |
| Bulk actions                        | ✅ Done | Links table supports multi-select disable, enable, archive, restore, and delete                                |
| Bulk tag assignment                 | ✅ Done | Links table supports multi-select add, replace, remove, and clear tag modes                                    |
| Expiry / max clicks                 | ✅ Done | Create/Edit forms support `expires_at` and `max_clicks`; redirects return expired page when limits are reached |
| Auto-fetch page title               | ✅ Done | Create/Edit forms can fetch the target page title through an authenticated Worker metadata endpoint            |
| Visits CSV export                   | ✅ Done | `/api/v1/export/visits.csv` and Admin download button added; local API smoke test passed                       |
| Tags management page                | ✅ Done | Admin page supports tag create, edit, search, color, description, and delete                                   |
| Link tag catalog sync               | ✅ Done | Link tags auto-create catalog entries; local rename/delete sync smoke test passed                              |
| Link form tag picker                | ✅ Done | Create/Edit forms load Tags catalog and offer clickable tag chips                                              |
| Password-protected links            | ✅ Done | Create/Edit forms set password hashes; redirect requires password and does not cache protected links           |
| Safety warning page                 | ✅ Done | Links can show a confirmation page before redirecting                                                          |
| UTM templates                       | ✅ Done | Create/Edit forms include newsletter, social, ads, affiliate, and custom UTM builder                           |
| Audit logs page                     | ✅ Done | Admin page lists link and import audit events                                                                  |
| Shlink API pull import              | ✅ Done | Admin Import / Export can fetch Shlink links via URL + API key without storing the key                         |
| Sink importer adapter               | ✅ Done | JSON / JSONL-style payloads supported; local smoke test passed                                                 |
| YOURLS importer adapter             | ✅ Done | JSON / JSONL-style payloads supported; local smoke test passed                                                 |
| Dub importer adapter                | ✅ Done | JSON / JSONL-style payloads supported; local smoke test passed                                                 |
| Import conflict strategies          | ✅ Done | `skip`, `rename`, and `overwrite` implemented; local smoke test passed                                         |
| Linketry backup.json restore import | ✅ Done | Restores backup links and tag catalog entries; local smoke test passed                                         |
| Bulk create links                   | ✅ Done | Admin page and `POST /api/v1/links/bulk-create` create up to 100 links at a time                               |
| Links advanced filters              | ✅ Done | Links list filters by source, domain, password, warning, limits, and created date range                        |
| Generic CSV field mapping           | ✅ Done | Generic CSV import accepts explicit field mapping for non-standard headers                                     |
| Generic JSON / JSONL field mapping  | ✅ Done | Generic JSON import accepts mapped fields and common wrapped arrays                                            |
| V2 production regression            | ✅ Done | 49 production checks passed; temporary `lk-v2-reg-*` links cleaned up                                          |

### V3 Progress

| Feature                           | Status  | Notes                                                                                                                                                                                    |
| --------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Advanced analytics dashboard      | ✅ Done | Admin Analytics page shows click totals, approximate unique visitors, daily trend, top links, countries, referrers, browsers, devices, operating systems, bot metrics, and recent visits |
| Daily stats aggregation           | ✅ Done | Visit recording updates `daily_stats` asynchronously via `ctx.waitUntil()` alongside raw visits                                                                                          |
| Auto-backup to Cloudflare R2      | ✅ Done | Worker creates full backup snapshots in R2 through Admin and scheduled cron                                                                                                              |
| Cron Triggers for daily backup    | ✅ Done | Wrangler cron runs daily at 18:00 UTC / 02:00 Asia/Shanghai                                                                                                                              |
| API Token management page         | ✅ Done | Admin can create/revoke scoped tokens; Worker stores hashes and authorizes API requests by scope                                                                                         |
| Cloudflare Queues for async stats | ✅ Done | Redirects enqueue visit snapshots when `VISITS_QUEUE` exists; max-click links and queue failures fall back to direct `ctx.waitUntil()` recording                                         |
| Multi-domain support              | ✅ Done | Admin can manage short domains; links store a selected domain; redirects resolve by request host plus slug with legacy domainless fallback                                               |
| Webhook notifications             | ✅ Done | Admin configures signed webhook deliveries for link, import, and backup events; delivery runs asynchronously and never blocks primary flows                                              |

### V4 Progress

| Feature                      | Status  | Notes                                                                                                                                                                                                                                                                                  |
| ---------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Smart redirect evaluator     | ✅ Done | Redirects can resolve country, device, browser, referer, language, and weighted/A-B rules with default long URL fallback on any rule failure                                                                                                                                           |
| Redirect Rules API           | ✅ Done | `/api/v1/redirect-rules` supports list, create, update, and delete with auth and audit logs                                                                                                                                                                                            |
| Admin Redirect Rules page    | ✅ Done | Admin can create, edit, filter, and delete rules by link                                                                                                                                                                                                                               |
| Backup / restore for rules   | ✅ Done | `backup.json` includes `redirectRules`; Linketry backup restore reattaches rules to restored or overwritten links                                                                                                                                                                      |
| V4 production validation     | ✅ Done | 21-check production smoke plus backup restore smoke passed; temporary `lk-v4-*` links cleaned up                                                                                                                                                                                       |
| Campaign / project grouping  | ✅ Done | Admin Groups page and `/api/v1/groups` manage `campaign:*` / `project:*` tags; 15-check production smoke passed and temporary groups cleaned up                                                                                                                                        |
| Local smart link suggestions | ✅ Done | Authenticated `/api/v1/metadata/suggestions` suggests slugs, title, description, and tags from URL/page metadata; Create/Edit forms can apply suggestions; 8-check production smoke plus 10-check core regression passed and temporary `lk-v4-ai-*` / `lk-v4-final-*` links cleaned up |
| Link health checker          | ✅ Done | Manual URL, single-link, and capped active-link batch checks; 15-check production smoke passed and temporary `lk-v4-health-*` links cleaned up                                                                                                                                         |

### V6 Progress

| Feature                    | Status               | Notes                                                                                                                                                                                                 |
| -------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single-link analytics page | ✅ Done              | `/analytics/links/:id` shows per-link trend, referrers, devices, targets, UTM, and conversions                                                                                                        |
| Analytics filters          | ✅ Done              | API/Admin filters cover link, slug, domain, tag, campaign, project, country, device, browser, referer, and UTM values                                                                                 |
| UTM breakdown              | ✅ Done              | Summary includes top UTM sources, mediums, campaigns, terms, and contents                                                                                                                             |
| A/B target statistics      | ✅ Done              | Redirect target decisions are stored in `visit_targets` without changing redirect behavior                                                                                                            |
| Conversion events          | ✅ Done              | `POST /api/v1/conversions` records authenticated goal events                                                                                                                                          |
| Analytics report export    | ✅ Done              | `/api/v1/export/analytics.csv` exports summary report sections                                                                                                                                        |
| Raw analytics retention    | ✅ Done              | `analytics_retention_days` setting is enforced by scheduled Worker cleanup                                                                                                                            |
| Traffic anomaly alerts     | ✅ Done              | Daily aggregate 24-hour/7-day baseline checks cover volume and bot-rate spikes with minimum samples, suppression, recovery, and existing notification channels                                        |
| V6 validation              | ✅ Production passed | GitHub Actions migration/deploy passed; production smoke covered health, auth rejection, redirects, filters, single-link analytics, conversions, Analytics CSV export, retention setting, and cleanup |

### V7 Progress

| Feature                      | Status  | Notes                                                                                                                                                                                           |
| ---------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R2 restore preview           | ✅ Done | `POST /api/v1/backups/:id/restore-preview` returns create, overwrite, rename, skip, invalid, and redirect-rule counts                                                                           |
| R2 one-click restore         | ✅ Done | Admin Backups page can restore completed R2 snapshots with `skip`, `rename`, or `overwrite`                                                                                                     |
| Pre-restore backup           | ✅ Done | Restore creates a fresh `pre-restore` R2 snapshot before mutating D1                                                                                                                            |
| Restore report               | ✅ Done | Restore result includes created, overwritten, renamed, skipped, failed, redirect-rule counts, and a CSV-style report                                                                            |
| Factory reset                | ✅ Done | Admin Settings danger zone previews affected rows, requires `RESET LINKETRY`, creates optional `pre-reset` R2 backup, clears KV cache, and preserves backup records plus `LINKETRY_ADMIN_TOKEN` |
| Backup retention             | ✅ Done | Advanced Settings configures 1-3650 days (default 30); Cron deletes expired R2 objects before their D1 records and preserves records when R2 is unavailable                                     |
| Target monitoring and alerts | ✅ Done | Cron rotates through active links with thresholds, suppression, complete failure/recovery notifications, signed Webhooks, persisted notices, and a bounded 200-record target history            |
| Fallback URL editing         | ✅ Done | Create/Edit Link can set or clear a validated HTTP(S) fallback URL for monitoring and future workflows; public redirect behavior remains unchanged                                              |
| Operations dashboard         | ✅ Done | Advanced Admin combines backup freshness, monitoring settings, Queue/R2 deployment capabilities, and manually requested current target failures                                                 |
| Bot classification           | ✅ Done | Boundary-aware classifier covers major crawlers and automation clients while preserving real browser traffic, including CUBOT Android devices                                                   |
| Public status page templates | ✅ Done | Advanced Settings supports escaped plain-text messages for 404, disabled, expired, and warning pages with safe localized defaults                                                               |

### V7-V10 Planning

| Version                                           | Scope                                                                                                                                                                     | Status          |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| V7 Operations, Recovery, And Monitoring           | R2 restore, backup retention, periodic target monitoring, alerts, fallback URL UI, custom status pages, operations dashboard, better bot classification                   | In progress     |
| V9 Growth Tools, Reporting, And Link Intelligence | Public stats sharing, reporting, campaign tools, previews, notes, privacy-safe traffic alerts, attribution, and lifecycle automation                                      | In progress     |
| V8 Usability Modes And Internationalization       | Simple / Advanced mode, deployment capability reporting, first-run wizard, full-page EN/ZH localization, browser smoke coverage, and locale-aware formatting              | Complete        |
| V9 Growth Tools, Reporting, And Link Intelligence | Bulk URL and UTM operations, link notes, OpenGraph previews, public stats pages, scheduled reports, saved analytics views, conversion attribution, long-idle auto-archive | Planned         |
| V10 Collaboration And Governance                  | Multi-user, roles, teams, token governance, audit retention, per-project access, optional managed services                                                                | Future optional |

# CHANGELOG

All notable changes to Linketry will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

_(none)_

---

## [0.29.11] - 2026-07-24

### Changed

- Reworked the Admin sidebar version entry into a compact release-status center inspired by the provided Sub2API reference while preserving Linketry's existing theme and navigation model.
- Consolidated installed version, update availability, refresh state, changelog access, and the existing protected online-upgrade handoff into one contextual sidebar panel.

### Safety

- The panel reuses the existing repository, backup, migration, target, and release approval workflow; it introduces no new deployment endpoint, credential, or redirect behavior.
- The top-level update notice remains the authoritative protected upgrade flow and manual fallback.

### Tests

- Verified responsive desktop/mobile panel placement, 25 Admin browser tests, 64 Admin unit tests, 110 Worker tests, 84 deployment tests, 8 project-site tests, Worker type-check, and normal/Demo Admin plus project-site production builds.

---

## [0.29.10] - 2026-07-23

### Changed

- Reconciled development records with the completed v0.29.9 production and isolated Demo release, including the verified live version and workflow results.
- Corrected the V7 status to complete for its tracked scope and clarified that the fresh-install confirmation remains required only for fresh deployments, not the current upgrade track.
- Updated current-version examples, package metadata, OpenAPI metadata, and release-facing fixtures to v0.29.10.

### Added

- Added a current official-vendor gap audit and prioritized multi-segment URL semantics, mobile deep links, and branded QR assets after Pre-1.0 validation.

### Safety

- No Worker redirect, Admin behavior, API contract, D1/KV schema, Cloudflare resource, secret, or production-data behavior changed.
- Link cloaking, landing-page scope, invasive attribution, and collaboration features remain outside the immediate release path.

### Tests

- Verified 110 Worker tests, 84 deployment tests, 8 project-site tests, and the Admin production build with canonical asset integrity checks.

---

## [0.29.9] - 2026-07-22

### Changed

- Reduced the current upgrade-track repository variable inventory by removing ignored version metadata, inactive destructive-operation flags, the not-applicable fresh-install confirmation, and the duplicated single-domain fallback. Fresh configuration continues to generate its required confirmation.
- Made `LINKETRY_WORKER_DOMAINS` the only variable emitted by fresh-install bootstrap and GitHub configuration helpers while retaining read compatibility for older `LINKETRY_SHORT_DOMAIN` installations.
- Removed official Demo environment values that exactly duplicated the reviewed API Pages project, API custom-domain, and compatibility-date workflow defaults.
- Clarified that deployed Worker versions come from package metadata rather than a manually maintained GitHub repository variable.
- Split deployment bootstrap and GitHub configuration responsibilities into bounded core, input, report, and CLI modules without changing their public exports or command behavior.

### Safety

- Preserved exact production release, commit, migration, backup, target, Cloudflare resource, and Demo isolation approvals.
- Kept missing destructive-operation flags fail-closed as disabled and made no Worker, redirect, API, D1, KV, R2, Queue, DNS, secret, or production-data changes.

### Tests

- Added deployment helper assertions for the canonical multi-domain variable and the absence of generated legacy/version variables.
- Reduced the audited source-size debt from 34 to 32 files by bringing both changed deployment configuration entries below the 300-line JavaScript limit; remaining unrelated files stay in separate refactor batches.

---

## [0.29.7] - 2026-07-22

### Added

- Added the dedicated public deployment route at `/deploy/`, separating the Cloudflare Quick Deploy launch from Linketry's reviewed repository workflow.
- Added an extensible public-site locale registry with English as the initial default, complete Simplified Chinese content, URL `?lang=` support, and browser-local preference persistence.

### Changed

- Replaced the long homepage deployment walkthrough with a focused entry to the new deployment page.
- Made the Cloudflare launcher explicit about first-install D1, KV, Pages/Admin, account, and private-secret choices instead of presenting a misleading zero-configuration claim.
- Replaced the ambiguous outline GitHub glyph with a filled GitHub mark and a visible GitHub label in desktop and mobile navigation.

### Tests

- Added multi-page site coverage for the `/deploy/` build entry, sitemap, Cloudflare launch URL, reviewed workflow, localization registry, and GitHub identifier.
- Verified the deployment page at desktop and 390px mobile widths, including the mobile language menu, full Simplified Chinese switching, locale persistence, and zero browser warnings.
- Worker, redirects, Admin, API, D1, KV, migrations, deployment credentials, and production resources are unchanged.

---

## [0.29.6] - 2026-07-22

### Added

- Added a beginner-recommended AI-assisted deployment route to the project site with a copyable, repository-aware prompt for Codex, Claude Code, Cursor, and similar coding assistants.
- Added a parallel command-line route that keeps the maintained bootstrap, repository configuration, and protected GitHub Actions workflow visible for experienced operators.

### Changed

- Reworked the public deployment section around honest prerequisites, free-tier-friendly positioning, account-owned data, automatic Pages Admin URLs, and dry-run-before-write reassurance.
- Surfaced AI-assisted deployment directly from the homepage hero while retaining the live Demo and GitHub source entry points.
- Replaced the primary-navigation GitHub text control with a compact, accessible GitHub icon while keeping its visible tooltip and mobile target size.
- Kept optional R2, Queue, branded Admin DNS, and upgrade-only backup requirements outside the beginner fresh-install path.

### Tests

- Expanded the project-site contract to require both deployment routes, accessible copy feedback, safety-gate language, and the absence of permanent-free claims.
- Worker, redirect, Admin, API, D1, KV, migration, and production deployment behavior are unchanged.

---

## [0.29.5] - 2026-07-22

### Fixed

- Required initial Admin JavaScript and CSS to use canonical Vite content-hashed paths before deployment readiness accepts them.
- Allowed long-lived custom-domain caching for those content-addressed assets while continuing to reject query/fragment identities, non-hashed paths, HTML fallbacks, and incorrect MIME types.
- Prevented a successfully rendered production Admin deployment from ending with a false readiness failure solely because its hashed assets carried a one-year cache lifetime.

### Tests

- Added build and live regressions for canonical hashed assets, long-lived caching, query cache keys, non-hashed paths, HTML fallbacks, and executable MIME types.

---

## [0.29.4] - 2026-07-22

### Fixed

- Removed release query strings from Vite entry JavaScript and CSS URLs so lazy route chunks and the document resolve one canonical ES module identity instead of loading two React runtimes.
- Restored fail-closed rejection of long-lived Admin asset caching and retained executable MIME checks for browser-facing canonical assets.
- Added a localized root render fallback so an unexpected Admin rendering exception no longer leaves an empty application root.

### Tests

- Added build-integrity regression coverage that rejects query or fragment suffixes on initial Vite assets.
- Added a production-build browser smoke test that authenticates and renders the lazy-loaded Overview route without page or console errors.
- Required both production and isolated Demo deployment workflows to execute the production-build browser smoke before Cloudflare deployment.

---

## [0.29.3] - 2026-07-22

### Fixed

- Required the exact release-version cache key on Admin entry assets while continuing to reject HTML fallbacks and incorrect JavaScript/CSS MIME types.
- Allowed safe long-lived caching only for release-versioned entry assets, matching the production custom-domain behavior without weakening executable-resource validation.
- Kept dedicated DNS-token failures strict while turning a main Cloudflare token without Zone DNS permission into an actionable warning followed by live readiness verification.

---

## [0.29.2] - 2026-07-22

### Fixed

- Added release-version cache keys to Admin JavaScript and CSS entry assets so stale custom-domain edge entries are not reused across releases.
- Let the production workflow reuse the configured Cloudflare API token for Admin DNS convergence when a dedicated DNS token is absent, while keeping the Admin CNAME DNS-only.

### Tests

- Added build and deployment regression coverage for the Admin asset cache key and DNS token fallback.

---

## [0.29.1] - 2026-07-21

### Fixed

- Prevented a production Admin blank page caused by a Pages SPA HTML fallback being retained under a hashed JavaScript cache key on the proxied custom domain.
- Deployment readiness now checks canonical Admin asset URLs without bypassing the cache that browsers use and rejects HTML fallbacks, incorrect MIME types, or unsafe long-term caching.
- Removed a midnight-sensitive Analytics heatmap assertion so release verification remains deterministic across local-day boundaries.

### Changed

- Reconciled public progress, roadmap, product-gap, and task records with the successful v0.29.0 isolated Demo rollout and the intentionally retained production v0.28.8 upgrade baseline.
- Marked the implemented V7 scope complete and corrected the Demo capability inventory so optional R2 is not presented as verified while its bucket variables remain unset.
- Custom Admin Pages CNAMEs are maintained as DNS-only records, Admin security headers are shipped with the build, and theme initialization runs through a CSP-compatible external script.
- Kept the isolated synthetic Demo redirect origin on `workers.dev`; an additional branded redirect hostname is no longer a public 1.0 requirement.
- Replaced one-year Admin/site asset caching with mandatory revalidation so a transient SPA fallback cannot remain under a JavaScript or CSS cache key.
- Synchronized workspace, OpenAPI, deployment example, and workflow fallback versions for the maintenance release.

### Verified

- Confirmed Demo v0.29.0 Worker/Admin parity, 18 read APIs, canonical brand assets, and write rejection; production Worker/Admin remain healthy on v0.28.8.
- Confirmed GitHub update discovery reads `package.json` from the configured branch, so version notifications do not require a GitHub Release or tag.
- Passed 81 deployment, 110 Worker, 64 Admin unit, 25 Admin browser, 6 Demo API, and 4 project-site tests; Worker type-check, Admin/Site builds, and the official npm registry audit also pass.
- Redirect handlers, analytics ingestion, D1/KV ownership, migrations, Cloudflare resources, production data, and environment isolation are unchanged.

---

## [0.29.0] - 2026-07-21

### Added

- Added isolated automatic Demo synchronization for reviewed pushes to `main`, while retaining the confirmation-gated manual workflow and every account, resource, migration, synthetic-data, read-only, and live-parity boundary.
- Expanded the world traffic intensity legend from four to ten colors, added ten-color per-link country distribution, and seeded ten synthetic Demo countries.

### Changed

- Online upgrades retain Worker plus Admin asset readiness while polling GitHub workflow state every two seconds and release readiness every second.
- Upgrade progress is reflected immediately in the current Admin session, reports success/failure through accessible notifications, and persists a dismissible completion result across the new Admin load.
- Upgrade copy now states that a self-hosted instance deploys only its own configured repository and branch to its protected production environment.
- Push-triggered production jobs honor `[skip production]` for official Demo-only synchronization; manual and in-app production upgrades are unaffected.

### Tests

- Added automatic-main/foreign-branch Demo gate coverage, immediate feedback fallback coverage, polling cadence assertions, ten-color palette unit coverage, and browser world-map legend checks.
- Passed 79 deployment, 110 Worker, 64 Admin unit, 25 Admin browser, 6 Demo API, and 4 project-site tests; Worker type-check, Admin/Site builds, responsive overflow checks, and the official npm audit also pass.
- Redirect handlers, asynchronous analytics ingestion, D1/KV ownership, migrations, production resources, and Demo/production isolation remain unchanged.

---

## [0.28.8] - 2026-07-21

### Fixed

- Fixed an online-upgrade page remaining on "upgrading" after the target Worker and Admin had already become available.
- The real `204` workflow-dispatch path now requires both the target Worker runtime and a target Admin document with executable initial JavaScript and CSS before reloading.
- Every successful path now persists upgrade feedback before reload, including deployments without a workflow run ID.
- A suspended upgrade poll resumes immediately when the page becomes visible, focused, or online again.

### Tests

- Reproduced production workflow `29811494912`: Worker and Admin deployment writes completed, while the Admin entry asset returned `text/html` during Pages propagation and the readiness job eventually failed.
- Added no-run-ID, delayed Admin asset, MIME validation, focus-resume, dual-runtime readiness, and success-feedback browser coverage.
- Passed 110 Worker, 78 deployment, 60 Admin unit, 25 Admin browser, 6 Demo API, and 4 project-site tests; Worker type-check, Admin/Site builds, and the official npm registry audit pass.
- Deployed v0.28.8 to the isolated read-only Demo through workflow `29817579157`; live Worker health, Admin metadata, entry-script MIME, completed-upgrade feedback, stable overview loading, and browser logs were verified.
- The production push workflow stopped at its owner-controlled safety gate before any mutation because the approved release metadata has not been advanced to v0.28.8.
- Redirect handlers, deployment permissions, D1/KV ownership, migrations, analytics, and production data are unchanged.

---

## [0.28.7] - 2026-07-21

### Added

- Added an immediately preceding equal-length period to every Analytics summary, including totals, human/bot counts, approximate unique visitors, and a zero-filled daily series.
- Added period comparison metrics, a dashed previous-period trend overlay, and a browser-local 7 x 24 activity heatmap with human/bot detail.
- Added previous-period and weekday/hour rows to Analytics CSV reports.

### Changed

- Analytics uses the same active filters and fixed browser UTC offset for current, previous, trend, and heatmap values.
- A zero previous-period baseline is presented explicitly as new traffic instead of an infinite percentage.
- The new insight contract uses three fixed aggregate queries and returns at most 168 heatmap cells, independent of visit volume.

### Tests

- Added equal-period boundary, local weekday/hour SQL, real SQLite aggregation, CSV contract, 100k-visit query-budget, responsive browser, horizontal-overflow, and accessibility coverage.
- Verified the dashboard at 1440 x 900 and 390 x 844 against an isolated local Worker/D1 fixture; no page-level overflow or application console errors were found.
- Passed 110 Worker, 78 deployment, 58 Admin unit, 25 Admin browser, 6 Demo API, and 4 project-site tests; Worker/Admin/Site builds and the official npm registry audit pass.
- Deployed v0.28.7 to the isolated read-only Demo through workflow `29806272912`; the live health contract, today count, period comparison, all three trend modes, activity heatmap, world map, localization, and responsive overflow checks pass.
- Redirect handlers, asynchronous visit recording, D1/KV ownership, migrations, production data, and Demo isolation are unchanged.

---

## [0.28.6] - 2026-07-21

### Added

- Added line, area, and stacked-bar traffic views with total, human, bot, and approximate unique-visitor series.
- Added a locally bundled interactive world traffic map, complete bounded country distribution, country ranking, device donut, and browser composition chart.
- Added explicit Analytics range metadata and richer CSV rows for every daily series and country.

### Fixed

- Fixed Overview "today" and Analytics daily buckets using the browser's explicit UTC offset instead of an implicit UTC day boundary.
- Filled missing dates with zero-value rows so the current local day remains visible before its first visit.
- Preserved unknown and non-map country values as explicit unmapped traffic instead of silently dropping them.

### Tests

- Added focused time-boundary, geography-normalization, real SQLite Analytics/Overview integration, 100k-visit query-budget, responsive chart/map, and accessibility coverage.
- Verified the Analytics visual hierarchy at 390px and 1440px with Playwright screenshots.
- Passed 109 Worker, 78 deployment, 58 Admin unit, 25 Admin browser, 6 Demo API, and 4 project-site tests; Worker/Admin/Site builds and the official npm registry audit pass.
- Deployed v0.28.6 to the isolated read-only Demo through workflow `29803326084` and verified the live today, trend, geography, audience, version, and no-overflow states.
- Redirect handlers, asynchronous visit recording, D1/KV ownership, migrations, production data, and Demo isolation are unchanged.

---

## [0.28.5] - 2026-07-21

### Fixed

- Prevented protected online upgrades from completing while the configured Admin origin still serves the SPA HTML fallback for newly deployed JavaScript or CSS assets.
- Added a read-only Admin readiness gate that waits for the exact release marker and executable initial-asset MIME types before the deployment run can succeed and trigger the Admin refresh.

### Tests

- Reproduced the v0.28.4 production blank page on `admin.uukk.de`: the document advertised the new release while its entry module returned `text/html` and left `#root` empty.
- Added deterministic coverage for valid Admin assets, invalid HTML asset fallbacks, retry recovery, and deployment-workflow ordering.
- Passed 78 deployment tests, 104 Worker tests, 58 Admin unit tests, 25 Admin browser scenarios, Worker type-check, Admin/Site production builds, and a live readiness check against the recovered production Admin origin.
- Redirect handlers, Worker runtime behavior, D1/KV ownership, migrations, production data, and Demo isolation are unchanged.

---

## [0.28.4] - 2026-07-21

### Added

- Added an opt-in signed `link.clicked` webhook emitted only from Queue or `ctx.waitUntil()` visit post-processing after core visit accounting succeeds.
- Added a privacy-minimized click envelope containing only an opaque click ID, occurrence time, bot classification, and link ID/slug/domain.

### Changed

- Webhook delivery now retries transient network, `408`, `425`, `429`, and `5xx` failures up to three total attempts while preserving one event ID, timestamp, body, and HMAC signature.
- High-volume click delivery is excluded from the default webhook event set and Queue batches reuse one loaded webhook configuration.
- Webhook failure logs now use a structured envelope that excludes destination URLs, payloads, signing secrets, and visitor details.

### Tests

- Added focused coverage for click-event opt-in defaults, payload minimization, stable HMAC signing, bounded retry classification/scheduling, and masked failure observability.
- Normalized Demo workflow line endings in its deployment contract test so the same safety assertions pass on Windows CRLF and CI LF checkouts.
- Passed 75 deployment, 104 Worker, 58 Admin unit, 25 Admin browser scenarios, 6 Demo API, and 4 project-site tests; the three browser scenarios affected by local eight-worker contention passed on isolated rerun.
- Passed Worker type-check, Admin/Site production builds, and the official npm registry audit with zero known vulnerabilities after updating transitive dev dependency `brace-expansion` to 1.1.16.
- Redirect handlers, redirect decisions, D1/KV ownership, migrations, production data, and Demo isolation are unchanged.

---

## [0.28.3] - 2026-07-21

### Added

- Added a GitHub-native `SECURITY.md` with private vulnerability reporting, credential-redaction requirements, response targets, and project security boundaries.
- Added a root `SUPPORT.md` covering the supported release line, pre-1.0 compatibility, toolchain versions, backup ownership, protected upgrades, rollback, and best-effort support scope.
- Added an automated support-policy contract that verifies private reporting, SemVer language, forward-only migrations, D1/KV recovery ownership, package engines, Wrangler range, and public documentation links.

### Changed

- Root package metadata now requires Node 24 and npm 10 or newer; the maintained Wrangler range remains 4.111.0 or newer within major version 4.
- README, development, self-hosting, product-gap, roadmap, progress, and task documentation now share one security and support contract.

### Tests

- Passed 75 deployment, 98 Worker, 58 Admin unit, 25 Admin browser, 6 Demo API, and 4 project-site tests.
- Passed Worker type-check, Admin/Site production builds, and the official npm registry audit with zero known vulnerabilities.
- A read-only GitHub API check reports private vulnerability reporting as disabled; repository activation remains an explicit external pre-1.0 gate.
- Redirect handlers, Worker runtime behavior, D1/KV ownership, migrations, production data, and Demo isolation are unchanged.

---

## [0.28.2] - 2026-07-21

### Added

- Added a repeatable Node 24 in-memory SQLite scale profile with 20,000 Links, 100,000 Visits, 20,000 Audit rows, and 10,000 raw Health History entries.
- Added conservative response-time budgets for paginated Links/Audit reads, representative Analytics aggregation, and bounded Health History parsing.

### Changed

- Links pagination now adds a deterministic ID tie-breaker to every supported sort, preventing duplicate or missing rows when primary sort values match.
- Audit pagination now orders by timestamp and ID, and both list routes share strict positive-integer page and page-size normalization.

### Tests

- Worker scale coverage verifies bounded page, Top-N, recent-visit, and Health History result sizes against the existing migration schema.
- Passed 72 deployment, 98 Worker, 58 Admin unit, 25 Admin browser, 6 Demo API, and 4 project-site tests.
- Passed Worker type-check, Admin/Site production builds, and the official npm registry audit with zero known vulnerabilities.
- Redirect handlers, asynchronous analytics ingestion, D1/KV ownership, migrations, production data, and Demo isolation are unchanged.

---

## [0.28.1] - 2026-07-21

### Added

- Added a shared import operating envelope of 10 MiB UTF-8 content and 50,000 normalized items.
- Added Admin preflight feedback that displays the file limit, rejects oversized files, and clears stale import state.

### Changed

- Preview, confirmation, and Worker-generated Shlink exports now use explicit content and item limits; Shlink API pulls over 5,000 items or 100 pages fail with HTTP `413` instead of being silently truncated.
- Asynchronous confirmation jobs fail before D1 writes when normalization exceeds the item-count limit.

### Security

- Oversized import content is rejected before import-format JSON/CSV parsing or import-job creation, reducing avoidable memory pressure from authenticated input.
- Redirect handlers, asynchronous analytics, D1/KV ownership, migrations, production data, and Demo isolation are unchanged.

### Tests

- Added exact-boundary coverage for UTF-8 byte size and normalized item count plus a browser regression for accessible oversized-file rejection.
- Passed 72 deployment, 95 Worker, 58 Admin unit, 25 Admin browser, 6 Demo API, and 4 project-site tests.
- Passed Worker type-check, Admin/Site production builds, and the official npm registry audit with zero known vulnerabilities.

---

## [0.28.0] - 2026-07-21

### Added

- Added explicit and auto-detected Bitly CSV imports for documented link, custom link, creation date, title, destination, engagement total, and status fields.
- Added explicit and auto-detected Short.io CSV imports for documented source IDs, short URLs, paths, destinations, titles, click totals, timestamps, expiry, and tags; the creator column is recognized but is not mapped to Linketry ownership.
- Added redacted contract fixtures plus normalization, conservative detection, preview, and conflict-policy regression coverage.

### Changed

- CSV parsing now supports quoted commas, escaped quotes, CRLF input, and multiline quoted values for both platform-specific and Generic CSV imports.
- The Admin import source selector includes localized Bitly and Short.io choices, while Shlink API credentials appear only when Shlink is explicitly selected.
- Preview statistics and conflict helpers now share one tested policy; `skip` remains the default and `overwrite` still requires explicit selection.

### Security

- Fixtures contain only reserved example domains and synthetic identifiers; no provider credentials, personal domains, private destinations, or account data are stored.
- Redirect handlers, asynchronous analytics, D1 source-of-truth ownership, KV cache semantics, migrations, production data, and Demo isolation are unchanged.

### Tests

- Added contract coverage for custom domains, case-sensitive slugs, empty optional fields, quoted and multiline CSV values, malformed rows, source detection, preview counts, and conflict strategies.
- Passed 72 deployment, 93 Worker, 58 Admin unit, 25 Admin browser, 6 Demo API, and 4 project-site tests.
- Passed Worker type-check, Admin/Site production builds, and the official npm registry audit with zero known vulnerabilities.

---

## [0.27.8] - 2026-07-20

### Added

- Added an idempotent `deploy:configure` dry-run/apply command that discovers the exact bootstrap resources, validates clean release metadata, and configures the minimum GitHub Actions secrets and variables for a fresh fork.
- Added a manual-only **Sync Online Upgrade Secret** workflow that can update the protected production Worker capability without deploying code, applying migrations, or changing the running version.
- Added deployment contract coverage for beginner documentation, repository boundaries, first-deploy Pages creation, Worker secrets-file deployment, and protected online-upgrade secret synchronization.

### Changed

- The production workflow now creates a missing Admin Pages project after the deployment safety gate and uploads generated or configured Worker secrets alongside the first Worker deployment.
- README, self-hosting, deployment, and fresh-account rehearsal guides now use one recommended beginner path and label local Wrangler deployment as an advanced alternative.
- Cloudflare token guidance now includes zone-scoped Workers Routes Edit for the selected custom domain and keeps R2/Queues permissions optional.

### Fixed

- Removed stale release and required KV preview examples that could block or misdirect a first-time installation.
- Corrected first-login guidance to point to the renamed **Prepare Worker secrets** workflow step and to the prefix-derived Pages URL.
- Pages project inventory failures now stop safely instead of being treated as a missing project.

### Security

- GitHub repository identity, protected Cloudflare account/resource inventories, clean commits, and exact confirmation phrases are verified before the new commands can write.
- Cloudflare and GitHub token values remain outside command arguments, logs, Admin builds, and committed files.
- Redirect handlers, asynchronous analytics, D1/KV ownership, migrations, production data, and Demo isolation are unchanged.

### Tests

- Passed 72 deployment, 84 Worker, 58 Admin unit, 25 Admin browser, 6 Demo API, and 4 project-site tests.
- Passed Worker type-check, Admin/Site production builds, and the full official npm registry audit with zero known vulnerabilities.

---

## [0.27.7] - 2026-07-20

### Fixed

- Added a target-build completion fallback for upgrades initiated by source builds that predate tab-scoped upgrade feedback.
- Limited the bootstrap fallback to an actual browser reload with a fresh anonymous update cache matching the exact loaded version, preventing ordinary page opens and manual update checks from being misclassified.
- Recorded the last loaded Admin build version so later version transitions can be confirmed without relying exclusively on component memory or one session marker.

### Security

- The fallback stores only semantic version strings and reuses the existing anonymous update-check timestamp; Admin tokens, repository tokens, workflow credentials, and deployment inputs are not read or persisted.
- Redirect handlers, asynchronous analytics, D1/KV ownership, migrations, deployment gates, and production data are unchanged.

### Tests

- Added unit coverage for older-build transitions, source-build cache bridging, fresh navigation, unchanged builds, and storage separation.
- Added a real-browser regression that removes the new session marker, performs a genuine reload, and verifies target-build completion without breaking normal update discovery.
- Passed 58 Admin unit tests, 25 Admin browser tests, and the Admin production build.
- Passed Worker type-check and 84 tests, 64 deployment safety tests, 6 Demo API tests, and 4 project-site tests plus its production build.

### Documentation

- Recorded the fixture-backed v0.28.0 import plan: Bitly and Short.io CSV first, Rebrandly JSON/API second, with unverified providers remaining on Generic import.

---

## [0.27.6] - 2026-07-20

### Changed

- Added explicit post-refresh feedback for online upgrades: waiting for Pages propagation, one bounded follow-up refresh, and a dismissible completion confirmation after the target build loads.
- Added an immediate refresh action when an old Admin build remains visible after deployment.

### Fixed

- Preserved the successful deployment target across same-tab refreshes so a stale Pages response no longer returns to the normal online-upgrade action or invites a duplicate deployment.
- Replaced the lost in-memory success state with a short-lived, validated `sessionStorage` record that expires after 30 minutes.

### Security

- Upgrade feedback stores only the normalized target version, timestamp, and bounded-refresh flag; repository tokens, Admin tokens, workflow credentials, and deployment inputs remain server-side.
- Redirect handlers, asynchronous analytics, D1/KV ownership, migrations, deployment gates, and production data are unchanged.

### Tests

- Added unit coverage for tab-scoped feedback normalization, expiration, refresh bounds, and cleanup.
- Added real-browser regressions for stale post-deployment Pages assets, duplicate-action suppression, manual refresh guidance, target-build completion feedback, and dismissal cleanup.
- Passed 54 Admin unit tests, 24 Admin browser tests, and the Admin production build.
- Passed Worker type-check and 84 tests, 64 deployment safety tests, 6 Demo API tests, and 4 project-site tests plus its production build.

---

## [0.27.5] - 2026-07-20

### Fixed

- Added read-only CORS handling for the public `/health` endpoint so a separately hosted Admin can verify the newly deployed Worker version.
- Separated a successful deployment with failed runtime-version verification from workflow failure and workflow timeout messaging.
- Kept the bounded finalizing reload fallback while restoring the normal exact-version fast reload path for cross-origin production deployments.

### Security

- `/health` exposes only the existing public status, product name, and runtime version; it allows GET/OPTIONS without credentials and does not expose Admin headers or secrets.
- Redirect handlers, asynchronous analytics, D1/KV ownership, migrations, deployment gates, credentials, and production data are unchanged.

### Tests

- Added Worker regressions for cross-origin `/health` GET and OPTIONS responses without credential exposure.
- Added Admin unit coverage for stale and failed runtime-version checks after a successful workflow.
- Added a real-browser regression that verifies a new runtime across separate Admin and Worker origins.
- Passed 50 Admin unit tests, 22 Admin browser tests, and the Admin production build.
- Passed Worker type-check and 84 tests, 64 deployment safety tests, 6 Demo API tests, and 4 project-site tests plus its production build.

---

## [0.27.4] - 2026-07-20

### Changed

- Moved the Sidebar version and update-status control directly below the Linketry Logo, before the navigation groups.
- Kept the Sidebar footer focused on language, theme, owner support, interface mode, Demo state, and logout.

### Fixed

- Added a bounded Admin reload fallback after a successful online-upgrade workflow enters finalizing, preventing an old page from remaining indefinitely on “verifying runtime version”.
- Kept the existing exact `/health` version check and fast success reload; the fallback only refreshes the page so normal version discovery can determine the resulting state again.

### Security

- Failed workflows never enter finalizing and do not schedule the fallback reload.
- Repository credentials, deployment approvals, migrations, Cloudflare resources, redirects, analytics, D1/KV ownership, and production data are unchanged.

### Tests

- Added a real-browser regression where the workflow succeeds while the old page continues to observe a stale runtime version.
- Passed 48 Admin unit tests, 21 Admin browser tests, and the Admin production build.
- Passed Worker type-check and 82 tests, 64 deployment safety tests, 6 Demo API tests, and 4 project-site tests plus its production build.

---

## [0.27.3] - 2026-07-20

### Changed

- Restored the interface-mode control and the grouped language, light/dark theme, and owner-support actions to the bottom-left Sidebar footer.
- The desktop content toolbar now stays focused on navigation collapse/expand and current-page context.

### Fixed

- Desktop, collapsed, and mobile navigation now use one consistent Sidebar location for display preferences and support instead of splitting them between the toolbar and footer.
- Restored the clearer footer presentation with three utility icons together and a separate full-width interface-mode status row.
- Bound the production deployment job to the GitHub `production` environment so successful online upgrades create production deployment records instead of appearing to have no production target.

### Security

- Locale, theme, Admin mode, support URL, update discovery, authentication, and logout behavior are unchanged.
- Redirect handlers, asynchronous analytics, D1/KV ownership, migrations, release gates, production data, and Demo isolation are unchanged; only GitHub deployment tracking is added.

### Tests

- Passed 48 Admin unit tests, 20 Admin browser tests, and the Admin production build.
- Passed Worker type-check and 82 tests, 64 deployment safety tests, 6 Demo API tests, and 4 project-site tests plus its production build.

---

## [0.27.2] - 2026-07-20

### Changed

- Documented non-expiring fine-grained token configuration for uninterrupted owner-controlled online upgrades when the GitHub account policy permits it.
- Published a discovery-only repository release target while keeping the deployed production version unchanged until explicit Admin confirmation.

### Security

- The optional GitHub token remains restricted to one repository with Actions read and write only and is never exposed to browser code, logs, or tracked files.
- The v0.27.2 discovery commit uses `[skip ci]`; it does not apply migrations, modify D1/KV data, or automatically deploy production.

### Tests

- Re-deployed production v0.27.1 through workflow run `29715930612` and confirmed the optional online-upgrade secret, safety gate, migrations, Worker, Admin, and project-site steps completed successfully.
- Passed Worker type-check and 82 tests, 64 deployment safety tests, 48 Admin unit tests and production build, 6 Demo API tests, and 4 project-site tests plus its production build.
- Verified the authenticated production Admin reports running v0.27.1, detects v0.27.2, and exposes the enabled online-upgrade action without applying it.

---

## [0.27.1] - 2026-07-19

### Added

- Added automated Axe checks for the main Admin routes, authenticated dialogs, conversion controls, light theme, and the mobile navigation drawer.
- Added a fresh-account rehearsal guide with scoped-token, repository, resource, DNS, R2, first-login, redirect, upgrade, and rollback checks plus a deployment-document contract test.

### Changed

- Modal dialogs and the mobile drawer now move focus inside, contain keyboard focus, close with Escape, restore focus to the trigger, and prevent background scrolling.
- Form errors, loading controls, notifications, filters, icon actions, and back navigation now expose localized accessible state and names.
- Reduced-motion preferences now suppress nonessential Admin animation, and shared muted text/primary-action colors meet the tested dark/light contrast baseline.
- Admin and project-site builds now use Vite 6.4.3 while retaining the existing Node.js 24 deployment runtime.

### Fixed

- Corrected duplicate form-control IDs, unassociated hints and validation errors, unnamed overview/filter/template controls, and default-language confirmation actions.
- Corrected toast and dialog semantics so assistive technologies receive status, alert, label, and focus changes without ambiguous landmarks.

### Security

- The official npm registry reports no known vulnerabilities across production and development dependencies for this release.
- Redirect handlers, asynchronous visit scheduling, D1/KV ownership, migrations, production data, and Demo isolation are unchanged.

---

## [0.27.0] - 2026-07-19

### Added

- Added a shared Conversion Overview for aggregate and per-link Analytics with eligible human clicks, event totals, Event Rate, goal breakdowns, and currency-separated values.
- Added currency value summaries to Analytics API responses and CSV exports, plus a compatibility fallback for Admin/Worker rolling deployments.
- Added a maintained product-gap audit covering pre-1.0 release requirements, core short-link enhancements, optional work, and deliberate non-goals.

### Changed

- Analytics keeps the date range visible and moves fourteen attribution filters behind an explicit Advanced filters control that saved views can reopen.
- Authenticated Admin pages now load as route-level chunks; the production entry bundle decreased from about 573.7 KB to 298.0 KB before gzip.
- Conversion wording now distinguishes Event Rate from user/session conversion attribution and explains why multiple events can exceed 100% of human clicks.

### Fixed

- Reset now responds to unapplied draft filters instead of only the last applied filter state.
- Mobile Analytics uses compact saved-view actions, two-column summary metrics, bounded panels, and an advanced-filter layout without horizontal overflow.

### Security

- The official npm registry reports no known production dependency vulnerabilities for this release.
- Redirect handlers, asynchronous visit scheduling, D1/KV ownership, migrations, production data, and Demo isolation are unchanged.

---

## [0.26.7] - 2026-07-19

### Changed

- Moved the running version and update status from the Logo row and top toolbar to a dedicated sidebar-footer control on desktop, collapsed, and mobile layouts.
- The footer keeps an available-version indicator visible after the release banner is dismissed and can force a fresh check to show the release action again.

### Fixed

- Removed the competing top-right update control so the shell utilities remain aligned and the version action has one predictable location.
- Added responsive and update-notification regression coverage for automatic checks, persistent update discovery, and the sidebar layouts.

### Security

- Update discovery remains anonymous; applying a release still requires an explicit operator action and the protected GitHub update capability.
- Redirect handlers, analytics scheduling, D1/KV behavior, migrations, production data, and Demo isolation are unchanged.

---

## [0.26.6] - 2026-07-18

### Fixed

- Demo API Pages project discovery now accepts Wrangler's `Project Name` JSON field, so repeat deployments reuse the existing gateway instead of attempting a duplicate project creation.

### Security

- The corrected lookup remains after the fail-closed Demo safety gate and before Worker secrets, migrations, seed writes, and deployments.
- Redirect handlers, analytics scheduling, D1/KV data, production resources, and domain routing are unchanged.

---

## [0.26.5] - 2026-07-18

### Added

- Added an isolated Cloudflare Pages Function gateway for the official Demo API with a Service Binding to the Demo Worker.
- Added guarded, idempotent creation of the Demo API Pages project and registration of its reviewed custom domain.
- Added gateway forwarding, failure-state, deployment-order, domain-registration, and isolation regression coverage.

### Changed

- Demo deployment configuration now separates the public Admin API URL from the isolated `workers.dev` origin used for fallback and sample redirects.
- The official Demo workflow verifies the branded gateway independently before running the complete Admin/API parity gate.

### Security

- The gateway proxies only `/health` and `/api/*`, has no direct D1/KV/R2/Queue bindings, and remains inside the isolated Demo account.
- Production `admin.uukk.de` / `go.uukk.de`, redirect handlers, analytics scheduling, migrations, and production data are unchanged.

---

## [0.26.4] - 2026-07-18

### Added

- Added a Settings release-status panel with installed/latest versions, the last successful check time, and protected upgrade readiness.
- Added explicit one-click, manual, invalid-configuration, and unavailable capability states without exposing credential values.

### Changed

- Toolbar checks, update banners, and Settings diagnostics now consume one shared update state.
- Manual release checks refresh GitHub metadata and the Worker upgrade capability together.

### Fixed

- Cached version checks retain their real timestamp so visibility-based refresh decisions are not delayed by a later page mount.
- Concurrent update checks no longer clear the loading indicator while another check remains active.

### Security

- Upgrade diagnostics expose only capability state; `LINKETRY_GITHUB_UPDATE_TOKEN` remains a protected Worker/repository secret.
- Redirect handlers, analytics scheduling, D1/KV behavior, migrations, API contracts, and production data are unchanged.

---

## [0.26.3] - 2026-07-18

### Added

- Added desktop and mobile toolbar controls that perform an immediate GitHub version check and bypass cached results.
- Added visible success/failure feedback for manual checks and a notification dot when a newer version is available.
- Added 15-minute foreground update polling so long-running Admin sessions can discover releases without a reload.

### Changed

- Manual GitHub Actions fallback is labeled “Open deployment”; “Upgrade online” is reserved for instances with the protected Worker upgrade capability.
- Admin BrandMark and browser favicon URLs now include the running Linketry version so browsers and Cloudflare do not retain a stale Logo across releases.

### Fixed

- A cached “current version” result can no longer hide a newly published GitHub version for up to six hours.
- Manually checking for updates resurfaces a previously dismissed current release when it is still newer than the running instance.

### Security

- GitHub package metadata checks remain anonymous and never include Admin or GitHub credentials.
- Redirect handlers, D1/KV behavior, migrations, API contracts, and production data were not changed.

---

## [0.26.2] - 2026-07-18

### Changed

- Production and isolated Demo workflows now use `actions/checkout@v6` and `actions/setup-node@v6`, whose action runtime is Node.js 24.
- Deployment policy tests now require the Node.js 24 action versions and reject a regression to the deprecated Node.js 20 `@v4` actions.

### Security

- Workflow permissions, protected environments, release approvals, migration gates, Cloudflare credentials, and deployment ordering are unchanged.
- Redirect handlers, Worker runtime behavior, D1/KV data, migrations, and production resources were not changed.

---

## [0.26.1] - 2026-07-18

### Added

- Deployment preflight now performs read-only R2 bucket and Queue inventory checks whenever those optional resources are configured.
- Added regression coverage for existing optional resources, not-yet-created resources, and unavailable R2 accounts.

### Fixed

- Cloudflare R2 error `10042` now fails the safety gate before migrations, resource creation, or deployment and identifies that R2 is not enabled for the selected account.
- Missing optional R2 buckets or Queues remain non-blocking warnings so a guarded deployment can create them after the read-only gate.

### Security

- Preflight output remains credential-redacted, and no Cloudflare mutation is attempted during capability verification.
- Redirect handlers, D1/KV behavior, migrations, API contracts, and deployed production data were not changed.

---

## [0.26.0] - 2026-07-17

### Added

- Added 5, 10, or 30 second near-real-time refresh controls to the aggregate and single-link Analytics pages, with a manual refresh action, saved browser preferences, and background-tab pause behavior.
- Added optional client-provided conversion `event_id` values so server integrations can retry safely without creating duplicate events.
- Added focused conversion-policy, refresh-preference, responsive-shell, and browser workflow coverage.

### Changed

- Aligned the desktop Sidebar brand row and content toolbar to the same height, moved desktop utility actions into the toolbar, and exposed the exact Linketry version beneath the Logo with a changelog link.
- Renamed the conversion metrics to describe event counts and events per human click, excluding classified bot clicks from the denominator.
- Grouped conversion value totals by event name and currency instead of mixing unlike currencies in one total.

### Fixed

- Conversion metrics now report unavailable when country, device, browser, or referrer filters cannot be applied to conversion events, instead of combining filtered clicks with unfiltered conversions.
- Long Analytics target and referrer labels no longer force horizontal scrolling on mobile layouts.
- Playwright now starts its own strict-port Admin server and cannot silently attach to an unrelated service already using the configured port.

### Security

- Conversion writes remain authenticated server-to-server API operations; write tokens must not be embedded in browser code.
- Redirect handlers, KV cache behavior, D1 link data, and asynchronous visit recording were not changed.

---

## [0.25.10] - 2026-07-17

### Changed

- Moved the desktop navigation collapse control from the Sidebar into the main content toolbar, matching the standard dashboard shell position.
- Kept the control visible and stable when the Sidebar changes between expanded and collapsed widths.

---

## [0.25.9] - 2026-07-17

### Changed

- Moved the desktop navigation collapse control out of the Linketry Logo row and into a dedicated navigation control row.
- Kept the collapsed navigation toggle visible without changing the mobile drawer or saved display preference behavior.

---

## [0.25.8] - 2026-07-17

### Fixed

- Normalized SVG line endings during live Demo brand verification so Windows `CRLF` checkouts and Pages-deployed `LF` assets compare consistently without weakening canonical content checks.
- Added regression coverage for cross-platform dark/light Logo parity verification.

---

## [0.25.7] - 2026-07-17

### Added

- Added a deterministic Admin version meta marker and post-deployment Demo parity verification for the release version, canonical dark/light Logo assets, 18 production read APIs, and the read-only write boundary.
- Added synthetic UTM templates, link notes, disabled notification channels, disabled webhook configuration, traffic anomaly state, and full navigation visibility for production-like Demo pages.
- Added deployment-policy coverage that keeps Demo and production on the same Admin route inventory and requires identical Admin/site brand assets.

### Changed

- The isolated Demo workflow now seeds advanced feature settings separately, deploys the shared production Admin build, waits for Pages propagation, and fails when the public Demo remains stale or incomplete.
- Admin builds now advertise their exact package version in HTML for cache-safe runtime verification.

### Fixed

- Prevented the public Demo from silently retaining an old Admin build that lacks the current light-mode Logo or production feature surface.

### Security

- Demo notification and webhook fixtures remain disabled, contain synthetic values only, and cannot deliver externally.
- Public Demo group reads no longer run the production-only tag synchronization write path.
- The live write probe targets a nonexistent API path and expects the Demo middleware to reject it with `403`, so verification cannot mutate data.
- Demo deployment remains manual and isolated; this release does not enable automatic Cloudflare writes.

---

## [0.25.6] - 2026-07-17

### Added

- Added a separate visitor-visible Demo preview code that gates the synthetic Admin experience without exposing or reusing the instance Admin token.
- Added a persistent desktop Sidebar collapse control with accessible icon labels while preserving the existing mobile drawer.
- Recorded staged German, French, Spanish, Portuguese, Indonesian, Italian, Korean, Vietnamese, and Traditional Chinese expansion with catalog, formatting, and browser-test quality gates.

### Changed

- Expanded Admin pages and operational banners to use the available desktop workspace up to 1600px.
- The isolated Demo deployment accepts its public preview code through a repository variable, while its Worker API remains synthetic, read-only, and rate-limited.
- Documented minimum, isolated Cloudflare deployment permissions for Demo Workers, KV, D1, Pages, and optional bindings.

### Fixed

- Associated Demo/Admin login labels with their inputs and removed the self-hosting deployment guide from the public Demo entry screen.

### Security

- The public Demo preview code is only a browser UX gate; the random `LINKETRY_ADMIN_TOKEN` remains a Worker secret and is never embedded in the Admin bundle.
- Demo deployment credentials must belong to the isolated Demo account, remain outside browser code, and must not be reused for production.
- Redirect handlers, KV cache behavior, D1 link records, and visit recording were not changed.

---

## [0.25.5] - 2026-07-17

### Added

- Added a Sub2API-style in-app upgrade flow for Cloudflare deployments: the Worker dispatches the fixed repository workflow, the Admin follows its run, verifies the new runtime version, and reloads automatically.
- Added authenticated upgrade capability, dispatch, and run-status endpoints plus Worker, Admin polling, OpenAPI, and deployment-policy coverage.
- Added an optional `LINKETRY_GITHUB_UPDATE_TOKEN` Worker secret for a fine-grained, repository-scoped GitHub token with `Actions: write`.

### Changed

- The production workflow now injects its repository and branch as fixed Worker upgrade targets and securely copies the optional GitHub update token into the Worker secret store.
- Instances without the optional secret continue to use the manual GitHub Actions fallback.

### Fixed

- Kept in-progress upgrade state active across the React Strict Mode development remount so a successful dispatch continues into workflow polling.

### Security

- In-app dispatch requires the primary instance Admin token; scoped Linketry API tokens cannot trigger deployments.
- Browser requests cannot select a repository, workflow, branch, commit, or deployment target, and never receive the GitHub token.
- Existing release, migration, backup, target, destructive-operation, and remote-resource gates remain mandatory.

---

## [0.25.4] - 2026-07-17

### Added

- Added an Admin **Online upgrade** action that opens the current deployment repository's protected GitHub Actions workflow.
- Added authenticated manual release approval bound to the selected branch's exact package version and commit.
- Added deployment regression coverage for missing confirmation, missing actor metadata, exact environment overrides, and unchanged push approvals.

### Changed

- Update notices now link directly to the changelog and deployment workflow instead of only opening the repository root.
- GitHub Actions injects the current repository URL into the Admin build so forked self-hosted instances upgrade from their own repository.

### Security

- GitHub and Cloudflare credentials remain outside browser code, while migration digest, backup, migration review, target confirmation, destructive-operation, and remote-resource gates remain mandatory.

### Fixed

- Recovered the blocked v0.25.3 production rollout by synchronizing its exact release and commit approvals, allowing the canonical SVG Sidebar logo to replace the stale raster build.

---

## [0.25.3] - 2026-07-17

### Changed

- Replaced GitHub README and Admin brand display with the canonical `https://linketry.com/favicon.svg` logo.
- Added matching light-mode favicon assets for Admin and the official project site while keeping the default presentation dark.
- Added OpenGraph and Twitter logo metadata for the official project site.

### Removed

- Removed the superseded raster logo asset so the repository has one canonical logo source.

---

## [0.25.2] - 2026-07-17

### Documentation

- Recorded the successful isolated Demo core rollout, live route/mobile/read-only verification, deployed synthetic record counts, and exact GitHub Actions run.
- Corrected the operational status of optional R2 and Queue capabilities: repository support is complete, while live activation awaits a replacement scoped Cloudflare token.
- Added explicit follow-up tasks for token rotation, advanced resource activation, download verification, and the optional `demoapi.linketry.com` decision.

### Security

- Documented that the old Demo token must be revoked after appearing in conversation history and that production Cloudflare resources were not modified.

---

## [0.25.1] - 2026-07-17

### Fixed

- Updated isolated Demo R2 and Queue discovery for Wrangler versions whose list commands no longer support `--json`.
- Added deployment-policy coverage that rejects the removed JSON-list flags before a live Demo deployment can reach Cloudflare writes.

### Security

- Preserved the fail-closed Demo safety gate, separate-account credentials, protected production inventories, and manual-only deployment trigger.

---

## [0.25.0] - 2026-07-17

### Added

- Added responsive mobile Admin navigation with an overlay drawer, Escape dismissal, accessible controls, and full-width page content at narrow viewports.
- Added synthetic Demo records for redirect rules, import history, API tokens, health monitoring, saved Analytics views, scheduled reports, backups, and related audit activity.
- Added isolated Demo R2/Queue bindings, guarded `linketry-demo-*` resource creation, downloadable synthetic backup/report artifacts, and scheduled advanced-feature bindings.

### Changed

- Public Demo visitors now start in Advanced mode so the complete production navigation is visible, while an explicit stored Simple/Advanced choice remains respected.
- Replaced production token-recovery instructions on the public Demo Setup page with read-only, synthetic-data, and account-isolation information.
- Made the Playwright Admin port configurable so browser tests cannot silently attach to an unrelated local server.
- Updated package/runtime versions, deployment fallbacks, self-hosting examples, progress records, roadmap, and task records to `0.25.0`.

### Security

- Kept all new advanced resources in the isolated Demo account and required the existing safety gate to pass before resource creation or upload.
- Preserved Worker-side and browser-side Demo write rejection, random internal Admin credentials, protected production inventories, and redirect behavior.

### Tests

- Added Admin unit coverage for Demo mode initialization and Chromium coverage for the 390px mobile drawer/layout behavior.
- Executed the expanded idempotent seed against local D1 and verified 3 rules, 2 imports, 2 tokens, and 2 backup records.

---

## [0.24.0] - 2026-07-17

### Added

- Added first-viewport, navigation, and footer entries from `linketry.com` to the live public Demo at `https://demo.linketry.com`.
- Added official project Coffee links to `https://everettlabs.dev/coffee/` on the project site and in the Admin Sidebar utility group.
- Added explicit public copy that the Demo is read-only, uses synthetic data, and requires no visitor token.

### Changed

- Updated Demo deployment examples to use the active `demo.linketry.com` Pages custom domain and the deployed compatibility date.
- Updated package/runtime versions, deployment fallbacks, self-hosting examples, progress records, roadmap, and task records to `0.24.0`.

### Security

- Kept the internal Demo `LINKETRY_ADMIN_TOKEN` as a random Worker secret; no default `Linketry` credential is exposed or accepted by the public frontend.
- Preserved the existing Demo read-only API enforcement, synthetic-only analytics boundary, and production-account isolation.

### Tests

- Added project-site contract coverage for the Demo URL, Coffee URL, no-token copy, and opener protection.
- Updated Admin browser coverage for the active Coffee support destination.

---

## [0.23.0] - 2026-07-17

### Added

- Added a public read-only Demo build that opens without exposing an Admin token and displays a persistent English/Simplified Chinese safety banner.
- Added Worker-side write rejection for Demo Admin APIs plus matching browser-side write prevention.
- Added privacy-safe Demo API abuse control through Cloudflare's native Rate Limiting binding with hashed client keys.
- Added an idempotent synthetic dataset generator covering links, visits, target analytics, conversions, tags, settings, a Demo domain, and audit samples.

### Changed

- Extended the isolated manual Demo workflow to build in Demo mode, migrate D1, generate and apply synthetic data, deploy Worker/Admin targets, and preserve the existing fail-closed account/resource gate.
- Added an explicit isolated `workers.dev` routing mode so the Demo account can launch without production-zone DNS or custom-domain permissions.
- Activated and verified `https://linketry.com` as the canonical Pages-hosted project site and synchronized the GitHub site URL/runtime variables.
- Updated package/runtime versions, deployment fallbacks, self-hosting examples, progress records, and task records to `0.23.0`.

### Security

- Demo read authentication bypass exists only when `LINKETRY_DEMO_MODE=read-only`; production behavior is unchanged.
- Demo redirects preserve their normal response path but skip visit/click persistence, preventing public traffic from contaminating the synthetic-only dataset.
- The protected `linketry-demo` GitHub environment defaults to unconfirmed credentials/isolation and rejects the production account, resource IDs/names, and hostnames before any Cloudflare write.
- Live Demo provisioning remains blocked until a second Cloudflare account and narrowly scoped credentials are available.

### Tests

- Passed Worker type-check, 72 Worker tests, 37 Admin unit tests, 13 Chromium Admin tests, 38 deployment safety tests, and the Admin production build.
- Executed the generated seed against local D1 and verified 5 synthetic links, 84 synthetic visits, and 12 synthetic conversions.

---

## [0.22.0] - 2026-07-16

### Added

- Added opt-in daily traffic anomaly detection that compares the latest 24 hours with a bounded previous 7-day daily baseline.
- Added explainable volume-spike and bot-rate-spike evidence, configurable minimum volume, thresholds, repeat suppression, and recovery state.
- Added authenticated traffic-alert status, configuration, and manual-run API endpoints plus an English/Simplified Chinese Analytics panel.
- Added aggregate anomaly and recovery delivery through the existing Telegram, Discord, Slack, Feishu, DingTalk, and WeCom notification channels.

### Changed

- Added the traffic-alert endpoints to the published OpenAPI inventory and documented the alert contract for self-hosters.
- Updated production and isolated Demo deployment fallbacks, approval examples, workspace metadata, and runtime version examples to `0.22.0`.

### Security

- Detection reads and persists only aggregate visit counts and bot rates; it adds no visitor, IP, session, referrer, or country identifiers.
- All queries and notification delivery run from scheduled or authenticated post-processing paths. Redirect handling, redirect rules, D1 link ownership, and KV cache behavior are unchanged.
- Low-volume samples are ignored by default to reduce false positives, and stored alert state is excluded from the general Settings response.

### Tests

- Passed Worker type-check and 69 Worker tests, 35 Admin unit tests, 13 real-browser Admin tests, 35 deployment safety tests, 3 project-site tests, and both Admin/project-site production builds.
- Added policy coverage for validation, low-volume protection, threshold evidence, suppression, and recovery; added notification privacy/format tests and a real-browser configuration/manual-check workflow.

---

## [0.21.0] - 2026-07-16

### Added

- Added one compact Sidebar group with equal language, light/dark theme, and coffee-support icon controls.
- Reserved https://everettlabs.dev/support as the canonical owner-support destination, with /coffee available for a future redirect.
- Added EN/ZH accessible names and real-browser coverage for the three controls, persistence, and external-link safety.

### Changed

- Split the oversized Sidebar into focused navigation, Footer, and utility-action modules while preserving all 17 routes, four groups, and existing visibility rules.
- Kept the full locale selector on Login and Settings while making the Sidebar language action cycle the registered locale catalog.
- Kept system-theme selection in Settings while providing a direct light/dark Sidebar toggle.

### Security

- The external support link opens with noopener and noreferrer and does not receive the Admin token.
- Worker routes, redirects, API contracts, D1, KV, Cloudflare bindings, and stored data are unchanged.

### Tests

- Passed 35 Admin unit tests, 12 real-browser Admin smoke tests, Admin and project-site production builds, Worker type-check and 60 Worker tests, 35 deployment safety tests, and release consistency checks.

---

## [0.20.2] - 2026-07-16

### Added

- Added a code-backed architecture guide covering the current redirect path, D1/KV ownership, asynchronous work, data model, failure isolation, and extension boundaries.
- Added a contributor development guide covering code placement, API and migration changes, import acceptance, verification, deployment tracks, and release hygiene.
- Added maintained roadmap entries for fixture-backed Bitly, Rebrandly, and TinyURL adapters, privacy-safe traffic anomaly detection, and a redirect-safe evaluation of optional fallback failover.

### Changed

- Added a README developer-documentation index and synchronized V8/V9 status summaries.
- Updated Import and Analytics documentation so completed features and future requirements match current code and roadmap state.
- Corrected stale V8 task checkboxes and routed useful requirements from the original project plan into maintained repository documents.

### Security

- New adapter guidance requires real redacted fixtures and forbids guessed source contracts.
- Future anomaly alerts and fallback evaluation are explicitly kept off the redirect hot path.
- Redirect behavior, API contracts, D1 schema, KV keys, Cloudflare bindings, secrets, and production data are unchanged.

### Tests

- Passed documentation link/structure and release metadata checks, Worker type-check and 60 Worker tests, 35 deployment safety tests, Admin and project-site production builds, and diff checks.

---

## [0.20.1] - 2026-07-16

### Fixed

- Synchronized the production workflow's generated Worker version fallback with the reviewed Linketry release instead of retaining the stale `0.18.0` value.
- Documented the exact approval recovery sequence used when a production deployment is safely blocked by stale release or commit variables.

### Security

- Production still requires an exact release, commit, migration digest, verified backup, reviewed migrations, and confirmed upgrade target before any Cloudflare write.
- Migration SQL, redirect behavior, D1/KV bindings, stored data, and API contracts are unchanged.

### Tests

- Re-ran deployment safety policies and the affected Worker, Admin, and project-site checks before updating production approval variables.

---

## [0.20.0] - 2026-07-16

### Added

- Added one typed Admin locale registry for supported locale codes, native names, HTML language tags, and text direction.
- Added a contributor guide for complete, reviewed translation catalogs without runtime translation services.

### Changed

- The Admin language selector now renders registered native-language labels and resolves stored locale values through the registry, falling back to English when a value is unknown.
- The selected locale now synchronizes both the document `lang` and `dir` attributes.

### Tests

- Added an automated locale gate for registry/catalog parity, message-key parity, non-empty translations, and interpolation placeholders.
- Added real-browser coverage for registered options, document metadata, and locale persistence after reload.

### Security

- Translation catalogs remain bundled locally; no Admin data, tokens, or visited pages are sent to third-party translation services.
- Worker routes, public redirect templates, D1, KV, analytics, and API contracts are unchanged.

---

## [0.19.0] - 2026-07-16

### Added

- Added an accessible table/card switch to the Admin Links page, with the selected view stored only in the current browser.
- Added a responsive card layout that reuses the existing paginated link contract, status rules, limits, tags, and confirmed link actions.

### Security

- Card view uses a local neutral site icon instead of loading destination favicons directly, avoiding third-party requests that could disclose the Admin viewer.
- Worker routes, redirects, D1, KV, analytics, and API response contracts are unchanged.

### Tests

- Added link-view normalization, storage-failure, effective-status, defensive-tag parsing, and real-browser persistence coverage.

---

## [0.18.0] - 2026-07-16

### Added

- Added a dedicated, manually dispatched GitHub Actions workflow for the isolated official Demo Worker and Admin.
- Added a Demo-only deployment safety gate bound to an exact release, commit, migration digest, confirmation phrase, and reserved `linketry-demo-*` resource names.
- Added an authenticated Admin startup check for newer Linketry versions published on the canonical GitHub repository, with a bilingual, dismissible update notice.

### Security

- Demo deployment now fails before Cloudflare writes unless its API token is confirmed as scoped to a separate account and that account, every D1/KV identifier, resource name, and hostname differs from protected production targets.
- The Demo workflow uses separate credentials and configuration, and cannot deploy the production project site, change production DNS, or run through the production deployment track.
- GitHub update checks validate the public package metadata, send no Admin token or instance data, cache successful results for six hours, and never block the Admin shell on failure.

### Tests

- Added policy coverage for manual-only dispatch, credential redaction, protected-account rejection, release and resource-name approval, and Cloudflare write ordering.
- Added semantic-version, cache, external-response, credential-isolation, update-notice, dismissal-persistence, and Admin browser regression coverage.

---

## [0.17.0] - 2026-07-16

### Added

- Added per-browser light, dark, and system-following Admin themes with immediate persistence and operating-system color-scheme updates.
- Added theme-aware Slate and brand design tokens so existing pages, tables, forms, dialogs, density modes, and optional-module controls switch consistently.
- Added pre-render theme initialization to prevent a mismatched color flash and updated browser chrome color for the resolved theme.

### Accessibility

- Added high-contrast light-theme text and semantic status colors, retained the original dark palette, and disabled theme transitions when reduced motion is requested.

### Tests

- Added theme normalization and resolution tests plus a real-browser regression for dark-to-light switching, computed colors, persistence, and system mode.

---

## [0.16.0] - 2026-07-16

### Added

- Added per-browser compact and comfortable density preferences for the Admin sidebar and data tables.
- Added instance-level visibility controls for every optional Advanced navigation module, persisted in D1 through the authenticated settings API.
- Kept core link management, setup, settings, backup, and recovery routes directly reachable when optional navigation entries are hidden.

### Tests

- Added Admin preference policy tests, Worker setting-validation tests, browser persistence and hidden-navigation regression coverage, and EN/ZH catalog parity coverage.

---

## [0.15.0] - 2026-07-16

### Added

- Added an independent `apps/site` project for `linketry.com` with product positioning, feature overview, Admin interface preview, architecture, self-hosting entry, documentation, roadmap, license, and GitHub links.
- Added responsive navigation, accessible landmarks, reduced-motion behavior, a custom 404 page, sitemap, robots policy, and hardened Cloudflare Pages headers.
- Added an optional `LINKETRY_SITE_PROJECT` deployment path to the existing safety-gated GitHub Actions workflow.

### Tests

- Added three project-site contract tests and extended workflow ordering coverage to keep project-site deployment behind the production safety gate.

---

## [0.14.1] - 2026-07-16

### Fixed

- Canonicalized migration content to LF before hashing so the reviewed deployment digest is identical on Windows and GitHub Actions/Linux checkouts.

### Tests

- Expanded deployment policy coverage to 27 tests with a cross-platform CRLF/LF digest regression.

---

## [0.14.0] - 2026-07-16

### Added

- Added a production deployment safety gate that binds every Cloudflare run to an explicitly approved release version, Git commit, migration digest, and fresh-or-upgrade track.
- Added read-only remote D1 migration-status verification and a command for generating the reviewed migration digest.

### Security

- Production upgrades now require a verified backup reference, migration review, and target confirmation before any Cloudflare write.
- Demo deployments, destructive migration SQL, initialization/reset/seed flags, resource recreation, and automatic domain replacement fail before secrets, migrations, or deploy steps.

### Tests

- Expanded deployment policy coverage to 26 tests, including workflow ordering, approval mismatch, migration tampering, destructive SQL, and fresh/upgrade gate behavior.

---

## [0.13.0] - 2026-07-16

### Added

- Added a dry-run-first `deploy:bootstrap` command that derives unique Worker, Pages, D1, and KV names for a new self-hosted installation.
- Added an account-and-prefix confirmation phrase before writes, idempotent exact-name reuse, partial-run recovery, and D1/KV binding output.

### Changed

- Upgraded the project CLI toolchain from Wrangler 3 to Wrangler 4 and kept cross-platform Wrangler execution shell-free.
- Updated the beginner self-hosting path so D1/KV provisioning precedes the full read-only deployment preflight.
- Changed local and remote D1 migration scripts to resolve the stable `DB` binding instead of assuming one database name.

### Tests

- Expanded deployment policy coverage to 18 tests, including dry-run safety, confirmation rejection, exact-resource reuse, duplicate-name rejection, partial recovery, create failures, and credential redaction.

---

## [0.12.0] - 2026-07-16

### Added

- Added a read-only `deploy:preflight` command for fresh self-hosting, existing production upgrades, and the isolated official Demo.
- Added optional Wrangler account, D1, and KV read checks with redacted targets and no token output.
- Added fail-closed upgrade backup/migration gates, destructive-operation rejection, and Demo production-overlap protection.
- Published separate manual Wrangler and GitHub Actions Admin-token guidance.

### Tests

- Added deployment policy coverage for credential redaction, domain validation, upgrade gates, destructive flags, Demo isolation, optional bindings, and read-only Cloudflare resource matching.

---

## [0.11.3] - 2026-07-16

### Fixed

- Prevented password managers from auto-filling the optional Create/Edit Link password fields, so new short links remain unprotected by default.
- Made an edited password field that is cleared send an explicit removal request while preserving an existing password when the field is left untouched.
- Disabled caching for Admin API GET requests and Worker JSON responses so password-protection state refreshes immediately after saving.

### Tests

- Added password-update policy tests, no-store response coverage, and a browser regression covering password-free creation and password removal.

---

## [0.11.2] - 2026-07-16

### Changed

- Changed the official Linketry website to [linketry.com](https://linketry.com) across README identity metadata, package metadata, project records, and the GitHub repository homepage.

---

## [0.11.1] - 2026-07-15

### Fixed

- Made Admin DNS automation conditional on a dedicated optional `CLOUDFLARE_DNS_API_TOKEN` secret with Zone Read and DNS Write access, so a least-privilege Workers/Pages deployment token does not fail an otherwise successful release.
- Added an explicit deployment notice with the required Pages CNAME target when the optional DNS token is not configured.

---

## [0.11.0] - 2026-07-15

### Changed

- Completed the Linketry identity cutover across local code, GitHub Actions, and Cloudflare production resources.
- Removed the 0.10 compatibility aliases for Worker variables and secrets, browser storage, KV cache keys, backup markers, import hints, reset confirmation, redirect parameters, and Webhook headers.
- Updated GitHub Actions to use only `LINKETRY_*` repository variables and to maintain the Admin custom-domain DNS record idempotently.
- Migrated production D1 and R2 data to canonical Linketry resources, renamed KV and Queue resources in place, recreated Worker and Pages projects under canonical names, and transferred their custom domains.

### Safety

- Exported a full pre-cutover D1 snapshot, preserved all 14 application tables, verified exact source/target row counts, copied every R2 backup object, and removed legacy product markers from migrated data.
- Kept D1 as the source of truth and left redirect logic unchanged apart from removing the superseded cache-key fallback.

### Verified

- Verified Worker type-checks and tests, Admin unit/browser tests and production build, production health/authentication, an existing 302 redirect, GitHub deployment, Pages custom domain, and final Cloudflare inventory.

---

## [0.10.4] - 2026-07-15

### Changed

- Renamed the live GitHub repository to `everett7623/Linketry` and updated the local `origin` remote.
- Aligned package metadata, README deployment buttons, Admin documentation links, Worker user agents, progress records, and repository references with the live Linketry URL.

---

## [0.10.3] - 2026-07-15

### Added

- Added the Linketry chain-link and analytics-trajectory Logo to the Admin login screen, navigation branding, and README.
- Added a matching compact SVG favicon and browser theme color for small-size product identification.

### Verified

- Verified the login page visually at desktop size, confirmed the Logo and favicon return successfully, and retained the complete Worker/Admin regression suites.

---

## [0.10.2] - 2026-07-15

### Added

- Added authenticated, bounded duplicate destination lookup through `GET /api/v1/links/duplicates` with normalized URL comparison and current-link exclusion for edits.
- Added English and Simplified Chinese advisory warnings to Create/Edit Link, including links to existing matches while preserving intentional duplicate creation.

### Safety

- Duplicate detection is read-only, debounced, failure-tolerant, and kept entirely outside the redirect path; D1 remains the source of truth and KV behavior is unchanged.

### Tests

- Added URL normalization policy tests, OpenAPI route-drift coverage for the new endpoint, and browser regression coverage for non-blocking create warnings and edit self-exclusion.

---

## [0.10.1] - 2026-07-15

### Added

- Added an authenticated OpenAPI 3.1 document at `/api/v1/openapi.json` covering the canonical Linketry integration surface, bearer-token access, standard response envelopes, errors, path parameters, and pagination metadata.
- Added an authenticated Swagger UI at `/api/v1/docs`; the document and UI contain no credential examples and do not persist authorization.

### Tests

- Added a Worker contract test that compares the OpenAPI operation inventory with mounted Hono route declarations and fails when API routes drift without an intentional contract update.

---

## [0.10.0] - 2026-07-15

### Changed

- Renamed the previous project and runtime identity to Linketry, with author `everettlabs`, repository `everett7623/Linketry`, website `linketry.com`, canonical Docker image name `everett7623/linketry`, and the positioning “Linketry is a self-hosted link management, analytics and monitoring platform.”
- Renamed workspace packages to `@linketry/*`, exports and UI copy to Linketry, fresh-install D1 defaults to `linketry`, and project configuration to the `LINKETRY_*` prefix.
- Moved the canonical Admin API contract to `/api/v1/*`; all Admin API calls and current documentation now use the versioned namespace.
- New backups, exports, cache keys, notification copy, Webhook headers, user agents, and runtime metadata use Linketry naming.

### Upgrade Compatibility

- Kept deprecated `/api/*` route aliases throughout the `0.10.x` compatibility window and added deprecation response headers.
- Worker configuration preferred `LINKETRY_ADMIN_TOKEN`, `LINKETRY_VERSION`, and Linketry cron variables while temporarily accepting the superseded variable generation.
- GitHub Actions preferred `LINKETRY_*` variables but temporarily fell back to superseded repository values, preserving the current D1/KV/R2/Queue bindings and Worker token.
- Admin browser storage migrated superseded token, API origin, locale, and interface mode values without logging users out.
- Redirect cache temporarily read the superseded cache-key generation on a new-key miss and deleted both generations after link mutations; D1 remained the source of truth.
- Linketry backup import and restore temporarily accepted the superseded backup marker, and Webhook deliveries included matching compatibility headers.
- Added a dedicated non-destructive upgrade guide. Version `0.10.0` added no D1 migration and did not recreate, reset, seed, or overwrite an existing database.

### Tests

- Added API-version policy, legacy browser-storage migration, legacy KV cache fallback/clearing, and old/new backup marker regression coverage.
- Retained the full bulk UTM, redirect, analytics, health monitoring, notification, Admin unit, browser smoke, type-check, and production-build verification suites.

---

## [0.9.24] - 2026-07-15

### Added

- Added an Advanced Links bulk UTM workflow for selected links or every link matching the current filters.
- Added add-missing, replace-selected, and remove-selected modes for `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, and `utm_content`.
- Added exact-count, before/after, invalid-URL, and duplicate-parameter previews plus a downloadable CSV change record.

### Safety

- Preserved unrelated raw query parameters, URL encoding, and fragments; credentialed URLs and malformed query keys are rejected from bulk changes.
- Recomputed every confirmed change against the current stored URL, skipped stale rows, wrote at most 100 links in one optimistic D1 batch, and cleared KV only for successfully changed links.
- Kept redirect handling and analytics behavior unchanged.

### Tests

- Added Worker policy, CSV, stale-write, maximum-batch, and selective-cache tests.
- Added a real-browser Admin flow for filtered preview, confirmation, and CSV download; the full Worker and Admin suites pass.
- Allowed Playwright contributors to opt into an existing system Chrome executable when bundled Chromium is unavailable.

---

## [0.9.23] - 2026-07-15

### Planning

- Recorded the official Linketry project site and isolated Demo as pre-1.0 work, with domain purchase and DNS deferred until the owner selects the domain.
- Kept the future supporter/coffee site on a separate owner-managed domain so sponsor setup does not block the project launch.
- Refreshed the Sink comparison through v0.2.11 and ordered the remaining work as bulk UTM, OpenAPI, duplicate destination detection, beginner deployment bootstrap, project site/Demo, optional Access/click integrations, and Admin presentation enhancements.
- Documented Demo isolation, synthetic-data, reset/read-only, abuse-control, and secret-boundary requirements.
- Required Demo deployments to use unique resource identifiers, fail before migrations when production identifiers overlap, and never alter the existing deployed instance or its data.
- Split deployment planning into non-destructive upgrades for the existing owner instance, fresh beginner installs in each user's own Cloudflare account, and a third isolated official Demo environment.

---

## [0.9.22] - 2026-07-15

### Planning

- Recorded the next development priority as a preview-first bulk UTM append and normalization workflow with bounded D1 writes, selective KV invalidation, and rollback records.
- Recorded the following Admin usability task for sidebar/table density preferences and instance-level optional-module visibility.
- Kept Shlink retirement operations explicitly deferred while the existing Shlink deployment remains in use.

---

## [0.9.21] - 2026-07-15

### Changed

- Moved scheduled destination/Aff monitoring controls from general Settings to the Health Checks page, with a direct link to notification channel configuration.
- Grouped the Advanced Admin sidebar into daily management, insights and automation, operations, and system sections, using denser navigation spacing and exact active-route highlighting.
- Marked Shlink API-key rotation and legacy-domain cutover as deferred while the existing Shlink instance remains in active use.
- Kept redirect handling and scheduled Worker behavior unchanged.

### Tests

- Extended Admin browser smoke coverage for opening Health Checks, enabling scheduled monitoring, and saving its settings.

---

## [0.9.20] - 2026-07-14

### Changed

- Replaced terse scheduled target failure and recovery messages with complete built-in notification formats.
- Notifications now include the full short link when its domain is available, target URL, target status, HTTP status, response time, and an explicit UTC detection time.
- Kept notification content as safe plain text with no per-instance template configuration or redirect-path changes.

### Tests

- Added focused failure and recovery format coverage for complete fields, unavailable HTTP responses, and UTC timestamps.

---

## [0.9.19] - 2026-07-14

### Added

- Added an independent short-link domain migration workflow that previews and migrates every link stored under one source domain, without changing slugs or destination/Aff URLs.
- Added migration-count concurrency protection, D1 `domain` and `short_url` synchronization, bounded old/new KV cache invalidation, audit logging, and a downloaded migration record CSV.
- Added an Advanced Links action that pre-fills the current domain filter and configured default domain, shows matching counts and samples, and warns when the target is not active in Linketry's domain catalog.

### Tests

- Added short-URL migration policy coverage and Admin browser coverage for the preview workflow.

---

## [0.9.18] - 2026-07-14

### Added

- Added scheduled original destination/Aff link failure and recovery notifications for Telegram, Discord, Slack, Feishu, DingTalk, and WeCom, alongside the existing signed generic Webhook.
- Split health checks into an hourly Cron while keeping backups, reports, and retention cleanup on the daily Cron; existing single-Cron deployments remain backward compatible.
- Added an Advanced Settings notification panel with per-channel enablement, masked credentials, Telegram chat targeting, and test delivery actions.
- Added authenticated notification configuration and test APIs without requiring a database migration.

### Security

- Notification credentials are never returned by the API and are excluded from general settings responses and backup exports.
- Incoming Webhook providers accept only their official HTTPS endpoint hosts and paths; Discord messages suppress user mentions.

### Tests

- Added native payload coverage for all six providers and health-alert message coverage for original destination URLs and HTTP failures.
- Extended the Admin browser smoke test to verify the notification panel loads in Advanced Settings.

---

## [0.9.17] - 2026-07-14

### Fixed

- Fixed the Admin remaining in the importing state after a background import job had already completed.
- Import job polling now starts immediately, waits for each request before scheduling the next poll, stops as soon as the job reaches `completed` or `failed`, and clears the finished import input and preview.
- Import job status requests and responses now explicitly disable caching so the Admin cannot keep reading a stale `pending` or `processing` result.

### Tests

- Added a browser regression test covering `pending` confirmation followed by a completed job and verifying that the importing state and finished file input disappear.

---

## [0.9.16] - 2026-07-14

### Fixed

- Fixed Shlink API and CSV imports stopping partway through at roughly 73 links. Import writes are now grouped into bounded D1 batches instead of performing several sequential database and KV operations for every link inside the Worker's background execution window.
- Import job counters are persisted after every batch, and a failed D1 batch safely falls back to individual writes so one bad record does not hide the rest of the result.
- Preserved the default `skip` conflict behavior, including duplicate slugs within the same import, without changing redirect logic.

### Tests

- Added import batching regression coverage, including the 195-link case split into eight bounded batches.
- Verified the supplied 195-row Linketry CSV end to end against a clean local D1 database: 195 succeeded and 0 failed. Reimporting the same file skipped all 195 conflicts and overwrote none.

---

## [0.9.15] - 2026-07-13

### Changed

- Simplified the beginner deployment to require only one custom hostname: `go.example.com` for the Worker API and short links.
- The Admin now defaults to Cloudflare Pages' automatically created `linketry-admin.pages.dev` URL in onboarding, deployment summaries, smoke checks, and documentation.
- Moved `admin.example.com` and `LINKETRY_ADMIN_URL` into the optional advanced path so first-time users do not need to configure Admin DNS or a Pages custom domain.

---

## [0.9.14] - 2026-07-13

### Added

- Added a reusable bilingual deployment access guide to the Login and first-run Setup screens. It identifies `admin.example.com` as the Admin entry point, `go.example.com` as the Worker API and basic short-link entry point, and shows the exact GitHub Actions path for retrieving the automatically generated `ADMIN_TOKEN`.
- Added `LINKETRY_ADMIN_URL` as a repository variable for deployment summaries.
- GitHub Actions now writes a final access summary containing the Admin URL, API URL, and token retrieval or recovery instructions.

### Changed

- The recommended basic deployment now uses two clear public entry points: an Admin domain and a Worker API/short-link domain. A separate public short-link domain remains optional.
- `ADMIN_TOKEN` is generated automatically only when the Worker does not already have one. Later deployments preserve the existing Worker secret instead of rotating it; a repository secret is accepted only as an explicit recovery override.
- Updated README, self-hosting, deployment, environment, progress, and task documentation for the simplified onboarding flow.

### Fixed

- Added an accessible label to the Login token visibility control.

### Tests

- Extended the bilingual browser smoke test to verify the deployment access guide, automatic token instructions, and accessible token visibility control.

---

## [0.9.13] - 2026-07-13

### Fixed

- Fixed large Shlink imports still timing out before the Admin received a job ID. Import confirmation now creates a `pending` job with `total_count = 0`, returns it immediately, and performs format detection, parsing, validation, conflict checks, and writes after an asynchronous D1 boundary in `ctx.waitUntil()`.
- Import jobs now persist the detected source and actual total after parsing, and parsing failures are recorded as failed jobs with a downloadable report.
- Fixed failed background imports being displayed as successful in the Admin. Failed jobs now show a localized error and preserve the import input for retry.
- Added a dedicated 60-second Admin timeout for import confirmation while retaining the 15-second default for other API requests.

### Tests

- Added a Worker regression test proving import parsing cannot start before the asynchronous queue boundary completes.

---

## [0.9.12] - 2026-07-13

### Added

- Ported two high-value Shlink features into Linketry:
  - **Query parameter forwarding**: query params on the short URL are now merged into the destination URL when redirecting. Internal `linketry_*` params are excluded.
  - **Automatic title resolution**: when a link is created without a title, the Worker fetches the destination page in the background and extracts the `<title>` tag, then updates the link record.

### Changed

- Updated `docs/SHLINK_FEATURE_GAP.md` with the full Shlink vs Linketry capability comparison and priority roadmap.

---

## [0.9.11] - 2026-07-13

### Fixed

- Fixed large Shlink imports failing with `AbortError` by moving import processing to an asynchronous job. The `POST /api/import/confirm` endpoint now returns immediately with a `processing` job ID; the Admin UI polls `/api/import/jobs/:id` until completion.

---

## [0.9.10] - 2026-07-13

### Changed

- Removed Playwright browser installation from the GitHub Actions deploy workflow. Admin smoke tests are no longer run during deployment, cutting several minutes from each deploy.
- Changed Admin test step in deploy workflow to run only unit tests.

---

## [0.9.9] - 2026-07-13

### Added

- GitHub Actions deploy workflow now automatically generates an `ADMIN_TOKEN` if one is not provided as a repository secret. The token is printed in the Actions log for the first login.

### Changed

- Updated self-hosting documentation to describe the automatic `ADMIN_TOKEN` setup behavior.

---

## [0.9.8] - 2026-07-13

### Changed

- Made `LINKETRY_KV_PREVIEW_ID` optional in the GitHub Actions deploy workflow. New users only need one KV namespace for production deployment.
- Updated self-hosting documentation to list `LINKETRY_KV_PREVIEW_ID` under optional advanced variables.

---

## [0.9.7] - 2026-07-13

### Added

- Added an ADMIN_TOKEN help hint and documentation link to the Admin login page, guiding first-time users to where the token is configured.
- Added Chinese and English translations for the new login help text.

---

## [0.9.6] - 2026-07-13

### Added

- Added "Deploy to Cloudflare Workers" and "Deploy to Cloudflare Pages" buttons to the README for faster first-time deployment.
- Added automatic redirect to the Setup page after first login when the default domain or first short link is missing.

### Changed

- Split the GitHub Actions deployment documentation into required and optional variables so new users can deploy without configuring R2, Queue, or multiple domains.
- Enhanced the First Run Wizard with clearer next-step highlighting and action buttons.

---

## [0.9.5] - 2026-07-12

### Added

- Added authenticated OpenGraph previews to Advanced Create Link and Edit Link workflows.
- Added title, description, image, and final-URL extraction with Twitter and standard metadata fallbacks.
- Added responsive preview cards using validated HTTP(S) image URLs and no-referrer image requests.

### Security

- Preview fetching retains the existing URL validation, six-second timeout, one-megabyte response limit, HTML content checks, and text-only rendering.

---

## [0.9.4] - 2026-07-12

### Added

- Added private per-link internal notes with authenticated read/write APIs and an Advanced Edit Link editor.
- Added 2,000-character limits, explicit clearing, bilingual guidance, and note contract tests.

### Security

- Notes are never included in public redirect pages, public statistics, Analytics results, or generic Settings responses.

---

## [0.9.3] - 2026-07-12

### Added

- Added authenticated personal UTM templates shared by the Create and Edit Link builders.
- Added template load, apply, save, and delete controls while preserving the existing newsletter, social, paid ads, and affiliate presets.
- Added limits of 20 templates, 50-character names, and 200 characters per UTM field, with bilingual UI and policy tests.

### Security

- Only the five supported UTM fields are persisted; templates are hidden from the generic Settings API and never affect redirects until explicitly applied to a destination URL.

---

## [0.9.2] - 2026-07-12

### Added

- Added opt-in daily Analytics CSV reports generated by the existing Cron and stored under a dedicated R2 `reports/` prefix.
- Added fixed date ranges, optional saved-view filters, manual runs, authenticated downloads, and the latest 30 report statuses.
- Added bilingual schedule and report controls to Analytics plus bounded configuration tests.

### Reliability

- Missing R2 bindings and report generation errors are recorded without interrupting scheduled backups, health monitoring, retention cleanup, or redirects.

---

## [0.9.1] - 2026-07-11

### Added

- Added authenticated saved Analytics views with create, apply, and delete controls.
- Added strict filtering for supported Analytics fields, fixed date ranges, 200-character filter values, 50-character names, and a 20-view instance limit.
- Added English and Simplified Chinese saved-view UI and filter-policy tests.

### Security

- Saved views contain query filters only, never Analytics result data, and are hidden from the generic Settings API.

---

## [0.9.0] - 2026-07-11

### Added

- Added disabled-by-default public read-only statistics sharing for individual links.
- Added hashed 32-character share tokens with create, rotate, and disable controls on single-link Analytics pages.
- Added 7/30/90/365-day privacy controls plus independently opt-in country and referrer breakdowns.
- Added Worker-rendered public pages with aggregate clicks and daily trends, `noindex` headers, and no visitor-level records or destination details.

### Security

- Share tokens are stored only as SHA-256 hashes and internal share configuration is excluded from Settings responses and backups.
- Public pages never expose IP hashes, user agents, recent visits, target URLs, conversion metadata, or Admin authentication state.

---

## [0.8.11] - 2026-07-11

### Added

- Added optional plain-text templates for public 404, disabled, expired, and safety-warning page messages in Advanced Settings.
- Added escaped `{{slug}}` and `{{url}}` template variables with a 500-character limit and validation for unsupported variables.
- Added public-page rendering and template-policy regression tests.

### Security

- Custom messages are always HTML-escaped; arbitrary HTML, scripts, styles, and response status customization are not supported.

### Notes

- Template settings are loaded only for status-page responses, so normal redirect and asynchronous analytics behavior remain unchanged.

---

## [0.8.10] - 2026-07-11

### Added

- Added bounded persisted history for the latest 200 scheduled target health checks, including HTTP status, checked time, response time, and consecutive failure count.
- Added authenticated `GET /api/health-checks/history` and an Operations history table with English and Simplified Chinese copy.
- Added history parsing, ordering, failure-count, retention-cap, and invalid-state tests.

### Security

- Internal health history state remains excluded from Settings responses and backup payloads; the API exposes only sanitized operator-facing records.

---

## [0.8.9] - 2026-07-11

### Added

- Added authenticated `GET /api/health-checks/alerts` with sanitized persisted health alert summaries.
- Added an Active Health Alerts section to Operations with consecutive failure counts, threshold state, fallback details, and the latest alert time.
- Added response-mapping tests for sorted alerts and deleted-link remnants, plus browser API coverage.

### Security

- The alert endpoint exposes only operator-facing fields and never returns the internal alert state document.

---

## [0.8.8] - 2026-07-11

### Added

- Added configurable consecutive-failure thresholds (1-10 checks) before scheduled target alerts fire.
- Added repeat alert suppression from 0 to 10080 minutes and signed `health_check.recovered` Webhook notifications.
- Added D1-backed internal alert state and rotating monitoring cursors so limited Cron batches eventually cover all active links.
- Added bilingual Advanced Settings controls and health alert state-machine tests.

### Security

- Internal health alert state and monitoring cursors are excluded from Settings API responses and backup payloads.

---

## [0.8.7] - 2026-07-11

### Changed

- Replaced broad substring bot detection with a boundary-aware classifier for major search crawlers, social link previews, SEO tools, AI crawlers, Headless browsers, uptime monitors, and HTTP automation clients.
- Prevented false positives for real browser traffic whose device names contain `bot`, including CUBOT Android devices.
- Added representative bot and real-browser regression tests; classification remains asynchronous and cannot affect redirect responses.

---

## [0.8.6] - 2026-07-11

### Added

- Added an Advanced-mode Operations Dashboard for backup freshness, scheduled monitoring status, Queue configuration, and Worker deployment health.
- Added an explicit on-demand target health snapshot that lists current warning/broken targets and configured fallback URLs without probing targets on page load.
- Added English and Simplified Chinese Operations navigation, dashboard copy, API mocks, and browser smoke coverage.

---

## [0.8.5] - 2026-07-11

### Added

- Added bilingual fallback URL fields to Create Link and Edit Link in Advanced mode.
- Added shared Worker validation and normalization for optional HTTP(S) fallback URLs, including explicit clearing support.
- Added Worker tests for accepted, normalized, cleared, invalid, and unsafe fallback URL values.

### Notes

- Fallback URLs are stored for health monitoring and future workflows; this release does not change public redirect behavior.

---

## [0.8.4] - 2026-07-11

### Added

- Added opt-in scheduled target health monitoring with a configurable limit of 1 to 50 active links per daily Cron run.
- Added signed `health_check.failed` Webhook summaries when scheduled checks find warning or broken targets.
- Added bilingual Advanced Settings controls and Worker policy tests for scheduled monitoring.

### Changed

- Cron is now configured independently of R2; scheduled backups safely skip execution when the R2 binding is absent.

---

## [0.8.3] - 2026-07-11

### Added

- Added configurable R2 backup retention from 1 to 3650 days with a safe 30-day default in Advanced Settings.
- Added daily cleanup of expired R2 objects and matching D1 backup records, preserving D1 records whenever the R2 binding is unavailable.
- Added backup retention visibility on the Admin Backups page and Worker unit coverage for policy validation and deletion ordering.

---

## [0.8.2] - 2026-07-11

### Changed

- Completed the V8 English and Simplified Chinese Admin localization pass, including remaining import source descriptions and link analytics fallback text.
- Marked V8 usability modes and internationalization complete after catalog parity, locale-aware formatting, and EN/ZH browser smoke coverage were verified.

---

## [0.8.1] - 2026-07-11

### Changed

- Improved Admin Audit Logs and Analytics localization by covering audit action filters, pagination controls, UTM filter labels, chart units, and locale-aware chart/recent-visit formatting.
- Added Playwright browser smoke tests for English and Simplified Chinese Admin core workflows, including login language switching, Overview, Links, Create Link, and Settings.
- Admin CI now installs the Chromium browser runtime before running the combined unit and browser smoke test suite.
- Normalized remaining Admin display dates, counts, status labels, placeholders, QR labels, API scopes, redirect rule types, health-check details, and import conflict previews to respect the selected English or Simplified Chinese locale across link management and operations pages.

---

## [0.8.0] — 2026-07-10

### Added

- Added default-English, `Accept-Language`-aware English/Simplified Chinese public 404, disabled, expired, password, and safety-warning pages.
- Added Worker regression tests for locale negotiation, HTML escaping, and unchanged bodyless 301/302 redirect semantics, executed in deployment CI.

- Added Admin i18n coverage documentation and automated English/Chinese catalog parity and message interpolation tests.
- Added bilingual Bulk Create, Webhook controls, and complete factory-reset safety guidance while preserving the exact confirmation phrase.

- Added bilingual Analytics filters, metrics, chart headings, recent visits, exports, and per-link analytics navigation and feedback.
- Added bilingual Audit Logs and a dedicated observability message catalog for the upcoming Analytics pass.
- Added complete bilingual restore preview, conflict strategy, overwrite warning, pre-restore backup guidance, and result summaries.
- Added bilingual API Token dialogs and the first Backups page pass, while keeping restore safety text grouped for a dedicated pass.
- Added bilingual Redirect Rules editing and validation, Health status values, and the first API Tokens pass.
- Added bilingual Groups operation details, Health Check result headings, and the first Redirect Rules page pass.

- Added the first bilingual operations pass for Domains, Groups, and manual Health Checks.

- Added bilingual import previews/history, advanced Links filters and bulk actions, smart suggestion controls, and UTM builder guidance.

- Added the first English and Simplified Chinese pass for Edit Link, Tags management, and Import/Export core workflows.

- Added English and Simplified Chinese coverage for Overview, the basic Links workflow, the basic Create Link workflow, shared status badges, validation, confirmations, and core feedback.

- Added a required quick deployment wizard that verifies the authenticated API, one default short domain, and the first short link from real instance state.
- Added bilingual Setup checks and Advanced capability labels, with direct actions for unfinished deployment steps.
- Expanded the Sink comparison into an adoption plan for basic, advanced, testing, OpenGraph, OpenAPI, performance, AI, real-time analytics, and future client integrations.

- Added a persistent English / Simplified Chinese language switcher, with English as the default.
- Added bilingual Login, global navigation, Simple / Advanced mode controls, and core Settings content.
- Added a prioritized official Sink feature-gap comparison for future product planning.
- Added a browser-local Simple / Advanced Admin mode switch in Settings and the sidebar.
- Added mode-aware navigation and setup checks while preserving direct access and all existing data.
- Added automated tests for mode visibility and API Origin normalization, executed during deployment CI.
- Added authenticated `/api/system/capabilities` reporting for D1/KV, R2 backups, visit Queue, and multi-domain readiness.
- Added an Advanced deployment capabilities panel with direct configuration guidance.
- Added one-domain quick deployment guidance using a shared short-link/API hostname and the default Pages Admin URL.

### Changed

- R2, Queues, Cron, multiple Worker domains, and a branded Admin domain are now optional advanced deployment capabilities.
- GitHub Actions can deploy the basic Worker with only D1, KV, one Worker domain, and the required Cloudflare credentials.
- Advanced settings panels and operator navigation are hidden by default until Advanced mode is selected.
- Simple mode now hides advanced filters, bulk actions, analytics shortcuts, multi-domain selection, smart suggestions, limits, password/warning controls, and UTM tools.
- Switching to Simple mode clears hidden advanced link filters so the list cannot remain invisibly constrained.

### Fixed

- Authentication bootstrap no longer clears a valid API Origin override after a transient network, CORS, timeout, or server failure.
- Login now distinguishes an unreachable API Origin from an invalid Admin token.

---

## [0.7.4] — 2026-07-09

### Added

- GitHub Actions Worker deployment now supports multiple custom domains through `LINKETRY_WORKER_DOMAINS`, so a stable API domain and a public short-link domain can be bound at the same time.
- Admin login now allows an API Origin override stored in the browser, providing a recovery path when the Admin was built with the wrong API URL.
- Admin authentication bootstrap now falls back from a stale browser API Origin override to the build-time API URL.

### Changed

- Deployment docs now recommend separating `admin`, `go` API, and `s` short-link domains for safer Shlink cutovers.

---

## [0.7.3] — 2026-07-09

### Changed

- Changed Linketry's open-source license from MIT to GNU GPL v3 only (`GPL-3.0-only`).
- Updated package metadata, repository license notice, README, roadmap, and release tracking to reflect GPL-3.0-only licensing.

---

## [0.7.2] — 2026-07-09

### Changed

- Added a project release hygiene rule requiring every intentional change to update version metadata, changelog, and progress/task records together.

---

## [0.7.1] — 2026-07-09

### Fixed

- Shlink API import now fetches all pages by supporting `pagesTotal`, `pagesCount`, and `totalPages`.
- Shlink API import continues fetching full pages when the API omits total page count, preventing first-page-only migrations.

---

## [0.7.0] — 2026-07-09

### Added

- Admin import confirmation now downloads a pre-import `backup.json` before mutating link data.
- Visits can now be exported from `GET /api/export/visits.csv` and the Admin Import / Export page.
- Added the `docs/` reference set for deployment, imports, migration, backup, API, roadmap, and security.
- Added `PUT /api/tags/:id` and a Tags management page with color and description editing.
- Link tags are now synchronized with the Tags catalog during list, create, edit, import, rename, and delete flows.
- Added a GitHub Actions workflow for automatic Worker and Admin deployment on pushes to `main`.
- Create/Edit Link forms now show existing Tags catalog entries as selectable tag chips.
- Added Sink, YOURLS, Dub, and Linketry `backup.json` import adapters.
- Import confirm now supports `skip`, `rename`, and `overwrite` conflict strategies.
- Added Shlink API pull import, password-protected links, safety warning pages, UTM templates, and Audit Logs.
- Added bulk link creation, Links advanced filters, Generic CSV / JSON field mapping, and an Analytics dashboard backed by daily stats aggregation.
- Added R2 backup snapshots with manual Admin creation, download, backup records, and daily Worker cron scheduling.
- Added scoped API token management with hash-only storage, Admin creation/revocation, and API token auth for protected routes.
- Completed V2 production regression and marked V2 as done.
- Added optional Cloudflare Queues processing for visit statistics with direct `ctx.waitUntil()` fallback.
- Added multi-domain management, per-link short domain selection, and domain-aware redirect lookups.
- Added webhook notifications with signed deliveries for link, import, and backup events.
- Added V4 smart redirect rules for country, device, browser, referer, language, and weighted/A-B traffic splitting.
- Linketry backups now include redirect rules, and `backup.json` restore reattaches rules to restored links.
- Added V4 campaign and project grouping backed by `campaign:*` and `project:*` tags.
- Added V4 manual link health checks for individual URLs, single links, and capped batches of active links.
- Added V4 local smart link suggestions for slugs, titles, descriptions, and tags from URL/page metadata.
- Added V5 self-hosting documentation, a public `wrangler.toml` template, Admin env example, and reusable GitHub Actions variables for open-source deployments.
- Added an Admin Setup page that summarizes API reachability, short-domain configuration, domain catalog, backups, and first-link readiness for self-hosted installs.
- Removed the tracked production Worker config and made GitHub Actions generate `wrangler.toml` from repository variables before deploy.
- Added open-source licensing, public repository cleanup, analytics documentation, and clearer local self-hosting bootstrap instructions.
- Analytics now reports approximate unique visitors and operating system breakdowns, and the Admin Analytics page displays device and OS breakdown cards.
- Added V6 analytics depth: filterable Analytics dashboard, single-link analytics page, UTM breakdowns, redirect target/A-B statistics, conversion events, Analytics CSV export, and scheduled raw analytics retention.
- Added V7 R2 backup restore preview, one-click restore, conflict strategies, pre-restore backup, and restore reporting.
- Added factory reset with reset preview, exact confirmation phrase, pre-reset R2 backup, KV cache clearing, and default settings restoration.

### Changed

- Bumped Linketry package and runtime version to `0.7.0`.
- Added a shared `LINKETRY_VERSION` constant used by Worker fallbacks and Admin version display.
- GitHub Actions now resolves the deployment version from `package.json` when `LINKETRY_VERSION` is not explicitly set.

---

## [0.1.0] — 2026-07-01

Initial V1 release — full code complete, awaiting first production deployment.

### Added

#### Worker (Backend)

- `GET /health` — health check endpoint returning `{ status, name, version }`
- `GET /:slug` — short link redirect with KV cache + D1 fallback
- Async visit recording via `ctx.waitUntil()` (stats never block redirects)
- 404 and disabled-link HTML pages
- `POST /api/auth/login` — admin token login
- `GET  /api/auth/me` — check auth status
- Links CRUD: `GET/POST /api/links`, `GET/PUT/DELETE /api/links/:id`
- Link status actions: `disable`, `enable`, `archive`, `restore`
- Tags CRUD: `GET/POST /api/tags`, `DELETE /api/tags/:id`
- Settings: `GET/PUT /api/settings`
- Export: `GET /api/export/links.csv`, `/links.json`, `/backup.json`
- Import: `POST /api/import/preview`, `POST /api/import/confirm`, `GET /api/import/jobs`
- Shlink import adapter — supports JSON, JSONL, CSV formats
- Generic CSV / JSON import adapter
- KV cache helpers (`getCachedLink`, `setCachedLink`, `deleteCachedLink`)
- D1 query layer (`src/db/index.ts`) — all SQL in one place
- Bearer token auth middleware (`src/auth/index.ts`)
- Standardized JSON response helpers (`src/utils/response.ts`)
- ID and slug generation utilities (`src/utils/id.ts`)

#### Admin (Frontend)

- Login page with token authentication
- Overview dashboard — total links, total clicks, today's clicks, recent/top links
- Links list — search, filter by status/tag, sort, pagination, copy/open/edit/disable/archive/delete
- Create Link form — URL, custom slug, title, tags, redirect type
- Edit Link form — all fields + status change
- Import / Export page — file upload, source detection, preview, confirm, history table, export buttons
- Settings page — site name, default domain, redirect type
- Reusable UI components: `Button`, `Badge`, `StatusBadge`, `Input`, `Select`, `Textarea`, `Modal`, `ConfirmDialog`, `Toast`, `Sidebar`, `Layout`
- `AuthContext` — login/logout/token state via localStorage
- API client layer with typed wrappers per resource
- React Router v6 routing with `RequireAuth` guard

#### Shared Package

- TypeScript interfaces: `Link`, `Visit`, `Tag`, `ImportJob`, `Setting`, `PaginatedResult`, `NormalizedImportItem`, `ImportAdapter`
- Validators: `isValidUrl`, `isValidSlug`, `RESERVED_SLUGS`

#### Database

- `migrations/0001_init.sql` — complete D1 schema for V1–V4
- V1 active tables: `links`, `visits`, `tags`, `import_jobs`, `settings`
- V2–V4 tables pre-created (not used): `daily_stats`, `domains`, `api_tokens`, `audit_logs`, `backups`, `redirect_rules`

#### Documentation

- `README.md` — project overview, setup, deployment, Shlink migration guide
- `AGENTS.md` — AI agent instructions and golden rules
- `DEVELOPMENT_GUIDE.md` — local setup, architecture, conventions
- `TASKS.md` — active task list (V1 pending / completed / backlog)
- `PROGRESS.md` — feature checklist and known issues
- `CHANGELOG.md` — this file
- `.env.example` — required environment variable reference
- `apps/worker/.dev.vars.example` — local dev secrets template

---

## Version History Summary

| Version | Date       | Description                               |
| ------- | ---------- | ----------------------------------------- |
| 0.1.0   | 2026-07-01 | V1 code complete — full feature set built |

---

## Upcoming

### V1.1 (patch)

- Production deployment + acceptance testing
- Fix any issues found during first real-world use

### V2.0

- Bulk operations (delete, disable, tag)
- Link expiry (`expires_at`) and max clicks (`max_clicks`)
- Password-protected links
- Safety warning page
- QR code generation
- Sink / YOURLS / Dub import adapters
- Audit logs
- See `TASKS.md` for full V2 backlog

### V3.0

- Advanced analytics with daily_stats aggregation
- Auto-backup to Cloudflare R2
- API Token management
- Cloudflare Queues for async stats
- Cron triggers for scheduled backup

### V4.0

- Smart redirect rules (country, device, browser, A/B, weighted)
- Local smart slug / title / description / tag suggestions
- Campaign and project grouping
- Link health checker

# Product Gap Audit

Updated: 2026-07-22

This document tracks what Linketry still needs as a practical open-source, self-hosted short-link platform. It complements `ROADMAP.md`, `SHLINK_FEATURE_GAP.md`, and `SINK_COMPARISON.md` without weakening redirect stability.

## Audit Basis

The review covered:

- All Admin routes and the shared desktop/mobile shell
- The Analytics and per-link Analytics API/UI contract
- Redirect, cache, asynchronous visit, import, backup, update, and Demo boundaries
- 1440x900 desktop and 390x844 mobile layouts on the isolated public Demo
- Production dependency advisories through the official npm registry
- Current official Shlink, Dub, and Kutt documentation for product comparison

The complete dependency audit reports no known vulnerabilities. Vite is updated to the supported 6.4 line; React, Tailwind, and React Router major releases remain separate work because they need dedicated migration testing.

## Reconciled In 0.29.2

| Area | Status | Notes |
| --- | --- | --- |
| Admin cache resilience | Complete | Release-version query keys are added to built entry assets, while readiness still validates canonical MIME and cache behavior. |
| Production DNS convergence | Complete | The deployment workflow prefers a dedicated DNS token and can reuse the configured Cloudflare API token when that optional secret is absent. |
| Demo branded redirect | Intentionally omitted | The isolated Demo uses `workers.dev` for redirects; branded Admin/API Pages domains remain sufficient for testing. |

## Reconciled In 0.29.1

| Area                    | Result                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Live release state      | Demo v0.29.0 parity is verified; production intentionally remains v0.28.8 for the owner-controlled update and upgrade path.                             |
| Update discovery        | The Admin compares its installed version with the configured repository branch's `package.json`; a GitHub Release or tag is not required.              |
| Optional Demo resources | Queue is configured, while R2 remains unavailable until its isolated Cloudflare account capability and two environment variables are restored.         |
| Pre-1.0 boundary        | The four external P0 evidence gates remain explicit and are not counted as completed by local automation or the successful core Demo deployment.          |

## Completed In 0.29.0

| Area                       | Result                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Official Demo parity       | Reviewed pushes to `main` synchronize through the isolated Demo workflow while production credentials, resources, DNS, and deployment workflow stay separate. |
| Owner-controlled upgrades  | Faster polling, immediate status, bounded reload, and persistent completion feedback improve the upgrade path without weakening backup or migration gates.     |
| Global access distribution | The world map uses ten traffic-intensity colors, per-link Analytics uses ten categorical colors, and Demo traffic covers ten countries.                       |

## Completed In 0.28.4

| Area                         | Result                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Asynchronous click Webhook   | `link.clicked` is opt-in and delivered only after core visit accounting from Queue/`ctx.waitUntil()` post-processing.                                                  |
| Privacy and signing          | Stable HMAC-SHA256 envelopes exclude visitor identifiers, Referer, country, User-Agent, and destination URLs.                                                          |
| Retry and observability      | Transient failures receive at most three attempts; structured failure logs omit URL, secret, payload, and visitor data.                                                |
| Redirect/data boundary       | Redirect handlers/decisions, D1/KV ownership, migrations, production data, and Demo isolation are unchanged.                                                           |

## Completed In 0.28.3

| Area                     | Result                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security reporting       | Policy designates GitHub private vulnerability reporting as canonical and prohibits public disclosure; repository activation remains a separate P0 external gate.  |
| Compatibility policy     | Patch/minor pre-1.0 behavior, `/api/v1`, forward-only migrations, supported Node/npm/Wrangler ranges, and third-party boundaries are documented and tested.          |
| Backup and rollback      | Operator backup ownership, protected upgrade verification, migration-aware rollback, credential rotation, and D1/KV recovery boundaries form one maintained contract. |
| Community support        | Reproducible public issues are separated from private security reports and documented as best effort without an implied uptime or recovery SLA.                     |

## Completed In 0.28.2

| Area                     | Result                                                                                                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stable pagination        | Links and Audit add deterministic ID tie-breakers, preventing equal timestamps or click counts from drifting between pages.                                                      |
| Input boundaries         | Shared strict normalization bounds page numbers at 100,000 and page sizes at 100 while preserving route-specific defaults.                                                       |
| Repeatable scale profile | Node 24 in-memory SQLite applies the maintained migrations and tests 20,000 Links, 100,000 Visits, 20,000 Audit rows, and 10,000 raw Health History entries against response budgets. |

## Completed In 0.28.0

| Area                    | Result                                                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bitly migration         | CSV detection and normalization preserve custom domains, case-sensitive slugs, destinations, titles, engagement totals, creation dates, source IDs, and verified status. |
| Short.io migration      | CSV detection and normalization preserve source IDs, short domains, paths, destinations, titles, tags, click totals, timestamps, and expiry.                              |
| Import safety           | Named detection is conservative; preview counts and `skip`/`rename`/explicit `overwrite` behavior share tested policy while confirmation remains bounded and asynchronous. |
| CSV compatibility       | Generic and named imports now tolerate quoted commas, escaped quotes, CRLF input, and multiline quoted fields.                                                              |

## Completed In 0.27.8

| Area                   | Result                                                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Beginner configuration | One idempotent command derives and verifies the minimum GitHub secret/variable plan from the exact Cloudflare bootstrap resources and clean release metadata.     |
| First deployment       | The guarded workflow creates a missing Pages project and uploads the generated Admin token with the first Worker deployment.                                      |
| Credential boundaries  | The Cloudflare token permission list includes the required zone-scoped Workers Routes permission; token values remain outside arguments, logs, builds, and files. |
| Upgrade rehearsal      | An existing protected Worker can receive the optional online-upgrade secret without deploying code or applying migrations.                                        |
| Documentation contract | README, self-hosting, deployment, and fresh-account guidance are tested as one recommended beginner path.                                                         |

## Completed In 0.27.1

| Area                              | Result                                                                                                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accessibility automation          | Axe regression covers Login, Overview, Links, Create/Edit, Analytics, Settings, authenticated dialogs, light theme, and mobile navigation without disabling serious/critical rules.      |
| Keyboard workflows                | Shared modals and the mobile drawer move, contain, dismiss, and restore focus; controls expose names, errors, hints, busy state, and live status.                                        |
| Visual accessibility              | Reduced-motion preferences suppress nonessential animation, and maintained dark/light muted text and primary actions pass the tested contrast baseline.                                  |
| Fresh-account guidance            | One owner checklist covers scoped credentials, repository configuration, idempotent Cloudflare bootstrap, DNS-only Demo CNAMEs, optional R2 bindings, first use, upgrades, and rollback. |
| Deployment documentation contract | Automated checks keep GitHub commands repository-scoped and prevent the Demo DNS/R2 instructions from drifting.                                                                          |
| Dependency security               | Admin/site use Vite 6.4.3 and the official npm registry reports zero known production or development dependency vulnerabilities.                                                         |

## Completed In 0.27.0

| Area                 | Result                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Analytics filters    | The date range stays visible while the fourteen attribution fields move behind an explicit Advanced filters control. Saved views reopen advanced fields when needed. |
| Conversion semantics | The Admin now calls the metric Event Rate and shows the human-click denominator, avoiding the impression that it is a session/user conversion rate.                  |
| Conversion value     | Currency-separated totals already stored by the API are now summarized in Analytics, per-link Analytics, and CSV exports.                                            |
| Mobile Analytics     | The first viewport is no longer dominated by the complete filter form, and expanded filters retain zero horizontal overflow.                                         |
| Admin loading        | Authenticated pages are route-split. The production entry chunk decreased from about 573.7 KB to 298.0 KB before gzip.                                               |
| Visual consistency   | Analytics operational panels use the same bounded border radius and section treatment.                                                                               |

## P0 Before 1.0

### Private vulnerability reporting activation

The repository policy and canonical advisory URL are documented and tested in v0.28.3, but the GitHub repository setting is external state. A read-only API check on 2026-07-21 returned `enabled: false`. Before public 1.0, enable **Settings → Security → Code security → Private vulnerability reporting**, verify the advisory form opens for a non-maintainer, and retain the evidence. Until then, public issues may request private contact only and must contain no vulnerability details.

### Fresh-account deployment rehearsal

The maintained owner checklist and automation now cover repository setup, scoped credentials, D1/KV creation, first deployment, first login, first domain, first redirect, optional R2 backup, upgrade, and rollback. Before 1.0, repeat the exact checklist in an independent owner-controlled fork/account and retain the evidence; local automation and contract tests do not replace this external validation.

### Independent assistive-technology audit

The automated baseline now covers the core routes, dialogs, mobile navigation, keyboard focus, names, errors, reduced motion, and dark/light contrast. Before 1.0, perform a manual screen-reader and keyboard audit on the remaining advanced routes and publish any browser/assistive-technology limitations.

### Large-data operating envelope

Import files have a tested 10 MiB UTF-8 content limit, a 50,000-item normalization limit, Admin preflight rejection, Worker HTTP 413 enforcement, and bounded asynchronous D1 writes. Sequential Shlink API pulls use a lower explicit 5,000-item/100-page boundary and direct larger migrations to reviewed file batches. The v0.28.2 local D1-compatible scale profile now covers Links, Visits/Analytics, Audit, and Health History correctness plus conservative response-time budgets. Before 1.0, repeat the profile against an owner-controlled remote D1 instance to capture network and platform variance; local timings are not presented as remote latency guarantees.

## P1 Core Enhancements

### Privacy-safe click-to-conversion attribution

Current conversions are trusted server-side events associated with a link and time range. They are not tied to a unique click or session. A future design should use an opaque click identifier, an explicit attribution window, first/last-click rules, idempotent lead/sale events, and a public ingestion boundary that never exposes an Admin/write token. Raw customer email, name, and direct identifiers should remain out of the default model.

### Asynchronous signed click webhook

Completed in v0.28.4. Optional `link.clicked` delivery uses Queue/`ctx.waitUntil()` post-processing only, reuses the existing HMAC convention, excludes visitor identifiers and destination URLs, retries only transient failures, and never delays a redirect.

### Optional identity-provider authentication

Add Cloudflare Access or OIDC as an optional Admin authentication layer while preserving bearer-token recovery for self-hosters. Define logout, CSRF, token rotation, lockout recovery, and local-development behavior before implementation.

### Domain and ownership-scoped API tokens

Read/write/admin scopes are implemented. The remaining security gap is restricting automation tokens to specific domains or links they created, similar to Shlink's domain-specific and authored-short-URL roles.

### Per-link social preview controls

Destination preview inspection is implemented. The missing capability is explicit per-link social title, description, and image configuration with optional R2 storage and safe fallback behavior.

### Lifecycle review queue

Expiry and click limits are implemented. Add an opt-in dry-run queue for long-idle or expired links, with review, archive-first defaults, export, and restore guidance instead of automatic destructive deletion.

### Additional import adapters

Bitly and Short.io CSV are complete in v0.28.0. Add Rebrandly and TinyURL only when real redacted payloads, pagination/export contracts, and conflict behavior are available. Every adapter must preserve preview, `skip` defaults, bounded batches, and original source identifiers.

## P2 Optional Enhancements

- Extra-path forwarding and multi-segment slugs, only behind explicit settings and redirect regression gates
- Additional reviewed locales through the existing catalog-parity workflow
- Browser extension, Raycast, Shortcuts, MCP, and mobile clients generated against the stable OpenAPI contract
- Optional real-time event views after bounded polling and scheduled reports remain the default
- Optional Workers AI assistance while local deterministic suggestions remain available

## Deliberate Non-goals

- No synchronous destination probe, webhook, analytics query, or AI call in the redirect response path
- No multi-tenant billing or hosted-SaaS dependency in the core self-hosted edition
- No email tracking pixel by default
- No iframe cloaking
- No storage of raw visitor IP addresses
- No silent destructive cleanup or migration

## Conversion Metric Contract

- `eligibleClicks = totalClicks - classifiedBotClicks`
- `eventRate = conversionEvents / eligibleClicks`
- Event Rate can exceed 100% when one click produces multiple conversion events
- Values are aggregated separately by currency and never summed across unlike currencies
- Country/device/browser/referrer filters intentionally make conversion metrics unavailable until visit-level attribution exists

This is an event-performance view, not a customer funnel. A click-to-lead-to-sale funnel belongs to the future attribution work above.

## External Product References

- Shlink API key roles: https://shlink.io/documentation/api-docs/api-key-roles/
- Shlink extra-path, multi-segment slug, bot, and expired-link behavior: https://shlink.io/documentation/some-features/
- Dub click-to-lead-to-sale attribution model: https://dub.co/docs/concepts/attribution
- Kutt self-hosting, custom domains, OIDC, and API overview: https://github.com/thedevs-network/kutt

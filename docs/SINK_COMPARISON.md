# Linketry And Sink Feature Comparison

Updated: 2026-07-15

This comparison uses Sink's official repository and website as the baseline. It is a product-priority document, not a claim that every similarly named feature has identical behavior.

## Current Position

Linketry already covers the core self-hosted short-link workflow and goes further in operational safety: D1 is the source of truth, KV is only a cache, imports have conflict previews, and advanced deployments can add R2 backups, Queues, multiple domains, webhooks, API tokens, audit logs, health checks, and redirect rules.

The recommended product direction remains: make the basic edition deployable with one Worker domain and the default Pages domain, then expose optional infrastructure and operator tooling through Advanced mode.

The comparison was refreshed after Sink v0.2.11. Linketry now has the required first-run wizard, broad English/Simplified Chinese Admin coverage, OpenGraph destination previews, public statistics sharing, saved analytics views, scheduled reports, and stronger health-monitoring notifications. The table below contains the remaining gaps rather than already completed work.

## Gaps Compared With Sink

| Priority | Gap                                                             | Linketry direction                                                                                                                                                                                                                              |
| -------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | OpenAPI specification and authenticated API docs                | Publish the machine-readable contract and Scalar or Swagger UI first; use schema checks to prevent drift and make this the foundation for external clients.                                                                                     |
| P0       | Duplicate destination detection                                 | Warn during create/edit when the normalized destination already exists, show matching links, and continue to allow intentional duplicates.                                                                                                     |
| P0       | Beginner resource provisioning                                  | Extend the existing first-run Admin wizard with idempotent D1/KV provisioning guidance or automation, permission preflight, clearer manual/Actions paths, and a fresh-account rehearsal.                                                        |
| P1       | Optional Cloudflare Access authentication                       | Add Access only as an optional authenticated path with JWT, CSRF, logout, and recovery behavior defined; keep bearer-token access available.                                                                                                    |
| P1       | Asynchronous click webhook                                      | Add an opt-in signed `link.clicked` event through the current webhook conventions, always outside the redirect response path.                                                                                                                  |
| P1       | Per-link social preview customization and image storage         | The destination preview exists; add explicit title, description, and image controls with optional R2 storage without placing metadata work in redirects.                                                                                       |
| P1       | Official project site and safe Demo                             | Use a Linketry project domain, isolated resources, synthetic data, read-only or scheduled-reset behavior, rate limits, and a separate Demo redirect host.                                                                                       |
| P2       | Light/dark/system themes and optional card view                 | Add after density preferences, preserving accessibility and the existing compact operational workflows.                                                                                                                                       |
| P2       | Broader community-driven internationalization                   | Preserve complete EN/ZH support, then make additional locale contributions sustainable instead of blocking basic deployment on many built-in languages.                                                                                       |
| P2       | Real-time analytics stream and live globe                       | Useful for visual monitoring, but lower priority than deployment simplicity, API correctness, and Demo safety.                                                                                                                                |
| P2       | Workers AI-assisted slug and metadata                           | Existing local suggestions remain the default; an optional AI binding can be considered in Advanced mode.                                                                                                                                      |
| P3       | Browser extension, Raycast, Apple Shortcuts, MCP, mobile clients | Add only after the OpenAPI contract and deployment experience are stable.                                                                                                                                                                     |
| P3       | Infinite-loading management views                               | Consider when real datasets demonstrate pagination or rendering limits.                                                                                                                                                                        |

## Sink Strengths To Absorb

The following Sink ideas are accepted into Linketry's development direction. They are split by product tier so feature growth does not make first deployment harder.

### Basic Edition

- Fast first run: a required Setup wizard verifies the Worker API, one default short domain, and the first public short link.
- Complete English and Simplified Chinese coverage, with English as the default, including Admin pages, validation, empty states, errors, and public status pages.
- Custom slugs, QR codes, expiration, passwords, safety warnings, UTM parameters, import/export, and clear link-level analytics remain easy to discover.
- OpenGraph destination previews should show title, description, and image before publishing a link.
- Strong automated tests must cover API behavior, migration, backup/restore, and all redirect states.
- Link lists should stay responsive for large datasets through measured pagination, incremental loading, or virtualization.

### Advanced Edition

- Optional Workers AI assistance for slugs and OpenGraph metadata, with local suggestions retained when AI is not configured.
- Real-time visit event views and live logs; a geographic globe is optional presentation, not a core dependency.
- Combined analytics filters and reusable views for links, domains, campaigns, location, device, browser, referer, and UTM dimensions.
- Explicit slug case-sensitivity behavior with collision warnings and migration-safe defaults.
- Smart routing continues to cover country, device, browser, referer, language, A/B tests, and weighted targets.
- Social preview customization, public statistics sharing with privacy controls, and scheduled reports.
- A documented OpenAPI contract as the foundation for browser extensions, Raycast, Apple Shortcuts, MCP bridges, and future mobile clients.

### Preserve Linketry Advantages

- D1 remains the source of truth and KV remains cache only.
- Analytics failures never block redirects.
- Import and restore workflows keep preview, conflict handling, backup, and reporting safeguards.
- R2, Queues, Cron, multiple domains, AI, and integrations remain optional.
- Advanced visual features must not enter the redirect hot path.

## Delivery Order

1. Done in v0.9.24: bulk UTM append and normalization with preview and change records.
2. Publish the OpenAPI contract and authenticated API documentation.
3. Add non-blocking duplicate destination detection.
4. Complete beginner D1/KV provisioning and fresh-account deployment validation.
5. Launch the official Linketry project site and isolated Demo after the owner supplies the domain.
6. Add optional Cloudflare Access and asynchronous signed click webhooks.
7. Done in v0.16.0: Admin display preferences; follow with themes, card view, and social preview customization.
8. Consider broader locales, real-time views, optional Workers AI, and external clients after the foundations are stable.

## Deliberate Non-goals For The Basic Edition

- Three custom second-level domains are not required. One Worker domain can serve both short links and `/api/v1/*`; the Admin can use its generated `pages.dev` domain.
- R2, Queues, Cron, multiple domains, AI, real-time globe views, and client integrations must not block the first deployment.
- The supporter/coffee domain and platform approval must not block the Linketry project site or self-hosted release.
- Iframe cloaking is intentionally excluded from the core roadmap.
- Redirect stability, data ownership, migration safety, and recovery remain more important than visual analytics features.

## Official Sink References

- Repository and feature list: <https://github.com/miantiao-me/Sink>
- Product site: <https://sink.cool/>

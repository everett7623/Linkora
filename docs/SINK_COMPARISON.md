# Linkora And Sink Feature Comparison

Updated: 2026-07-10

This comparison uses Sink's official repository and website as the baseline. It is a product-priority document, not a claim that every similarly named feature has identical behavior.

## Current Position

Linkora already covers the core self-hosted short-link workflow and goes further in operational safety: D1 is the source of truth, KV is only a cache, imports have conflict previews, and advanced deployments can add R2 backups, Queues, multiple domains, webhooks, API tokens, audit logs, health checks, and redirect rules.

The recommended product direction remains: make the basic edition deployable with one Worker domain and the default Pages domain, then expose optional infrastructure and operator tooling through Advanced mode.

## Gaps Compared With Sink

| Priority | Gap                                                             | Linkora direction                                                                                                                                                                                                                              |
| -------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Complete internationalization                                   | English remains the default. English and Simplified Chinese now cover login, global navigation, mode selection, and core settings. Continue with every page, validation/error/empty state, redirect status pages, dates, numbers, and exports. |
| P0       | First-run deployment wizard                                     | Turn the existing Setup checks into a guided basic deployment and first-link flow. Keep R2, Queues, Cron, and multiple domains in an optional Advanced step.                                                                                   |
| P0       | Broader automated regression tests                              | Add API, migration, backup/restore, redirect-state, and browser tests so quick deployment remains dependable.                                                                                                                                  |
| P1       | OpenGraph/social preview cards                                  | Add preview image/title/description controls without placing metadata work in the redirect hot path.                                                                                                                                           |
| P1       | Explicit slug case-sensitivity UX                               | Document and test current behavior, then expose a safe setting only if migration semantics are clear.                                                                                                                                          |
| P1       | OpenAPI specification and integration docs                      | Publish a machine-readable authenticated API contract for extensions and external tools.                                                                                                                                                       |
| P2       | Real-time analytics stream and live globe                       | Useful for visual monitoring, but lower priority than deployment simplicity and correctness.                                                                                                                                                   |
| P2       | Workers AI-assisted slug and metadata                           | Existing local suggestions remain the default; an optional AI binding can be considered in Advanced mode.                                                                                                                                      |
| P3       | Browser extension, Raycast, Apple Shortcuts, and mobile clients | Add only after the API contract and one-click deployment experience are stable.                                                                                                                                                                |
| P3       | Infinite-loading management views                               | Consider when real datasets demonstrate pagination or rendering limits.                                                                                                                                                                        |

## Sink Strengths To Absorb

The following Sink ideas are accepted into Linkora's development direction. They are split by product tier so feature growth does not make first deployment harder.

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

### Preserve Linkora Advantages

- D1 remains the source of truth and KV remains cache only.
- Analytics failures never block redirects.
- Import and restore workflows keep preview, conflict handling, backup, and reporting safeguards.
- R2, Queues, Cron, multiple domains, AI, and integrations remain optional.
- Advanced visual features must not enter the redirect hot path.

## Delivery Order

1. Required quick deployment wizard and complete bilingual basic workflow.
2. Regression tests and OpenAPI contract.
3. OpenGraph preview cards and large-list performance.
4. Advanced real-time analytics and optional Workers AI.
5. Extensions and external clients after the API is stable.

## Deliberate Non-goals For The Basic Edition

- Three custom second-level domains are not required. One Worker domain can serve both short links and `/api/*`; the Admin can use its generated `pages.dev` domain.
- R2, Queues, Cron, multiple domains, AI, real-time globe views, and client integrations must not block the first deployment.
- Redirect stability, data ownership, migration safety, and recovery remain more important than visual analytics features.

## Official Sink References

- Repository and feature list: <https://github.com/miantiao-me/Sink>
- Product site: <https://sink.cool/>

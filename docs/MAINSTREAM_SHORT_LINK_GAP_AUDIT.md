# Mainstream Short-Link Gap Audit

Date: 2026-07-23

## Scope

This audit compares Linketry's documented capability surface with current official documentation from Bitly, Short.io, Dub, Rebrandly, and Shlink. It is a planning record, not a commitment to replicate hosted-product bundles or paid-plan restrictions.

Linketry already covers the core self-hosted product: branded multi-domain links, redirects, expiry, passwords, QR generation, analytics, country/device/browser/referer/language rules, weighted A/B routing, imports, OpenAPI, signed webhooks, backups, monitoring, public statistics, and an English/Simplified Chinese Admin.

## Evidence And Assessment

| Capability | Official-market evidence | Linketry status | Decision |
| --- | --- | --- | --- |
| Multi-segment slugs and request-path semantics | [Shlink](https://shlink.io/documentation/some-features/) supports multi-segment custom slugs, opt-in extra-path behavior, and configurable query forwarding. | Missing | Highest compatibility priority. Add multi-segment slugs, then per-link opt-in query forwarding and strict/append/ignore extra-path modes. Defaults must preserve today's exact-match, non-forwarding redirect behavior. |
| Mobile deep links | [Short.io](https://short.io/features/) and [Rebrandly](https://developers.rebrandly.com/docs/deep-links/edit) route iOS and Android traffic with web fallbacks. | Missing | Plan a bounded route extension with explicit iOS, Android, and default-web targets. It must be resolved locally in the existing redirect evaluator with no synchronous upstream call. |
| Branded QR assets and scan attribution | [Bitly](https://support.bitly.com/hc/en-us/articles/360020741972-What-is-a-QR-Code-) and [Rebrandly](https://support.rebrandly.com/en/articles/469739-how-do-i-customize-my-qr-codes) provide branded QR styles and scan-focused usage. | Basic QR preview/PNG only | Plan a QR Code studio with logo, colors, error-correction guardrails, PNG/SVG/PDF output, and explicitly labeled scan attribution. A visual QR change must never modify the encoded short URL. |
| Conversion and revenue attribution | [Dub](https://dub.co/docs/api-reference/links/create) exposes leads, conversions, sales, and sale amount alongside link analytics. | Authenticated conversion events exist; visitor/session-safe attribution and external campaign IDs are pending | Retain the existing privacy-first V9 plan. Do not add invasive cross-site identity collection merely to match hosted SaaS attribution. |
| Product integrations and client workflow | [Short.io](https://docs.short.io/articles/short.io-basics-and-security/get-started/what-is-short.io) lists automation and analytics integrations; [Rebrandly](https://support.rebrandly.com/en/articles/469658-what-is-the-browser-extension-s-automatic-link-detection) provides browser workflow support. | OpenAPI and signed webhooks exist; clients are deferred | Keep integration clients behind the stable API. A browser extension or one narrowly scoped automation connector can be evaluated only after the Pre-1.0 validation gates. |
| Link galleries and link-in-bio pages | [Bitly](https://support.bitly.com/hc/en-us/articles/13091184325133-How-do-Bitly-Links-Bitly-Codes-and-Bitly-Pages-work-together) and [Rebrandly](https://support.rebrandly.com/en/articles/469738-what-is-a-link-gallery) bundle landing pages with links. | Missing | Deliberate non-goal for the immediate roadmap. It is a separate publishing product and should not delay reliable link management. |
| Link cloaking | [Short.io](https://short.io/features/) offers URL cloaking. | Missing | Deliberate non-goal. It weakens destination transparency and conflicts with Linketry's warning-page and safe-redirect posture. |
| Collaboration, roles, and workspaces | [Rebrandly](https://support.rebrandly.com/en/articles/469536-rebrandly-s-getting-started-guide) supports teammate workspaces. | Deferred V10 | Keep deferred until the single-admin self-hosted product and its governance model are stable. |

## Prioritized Roadmap

### After Pre-1.0 Validation

1. Multi-segment slugs and opt-in query/extra-path forwarding, with exact-match defaults and redirect regression coverage.
2. Mobile deep linking with explicit platform fallbacks and no redirect-path network dependency.
3. Branded QR Code studio and scan attribution that remains separate from ordinary link-click analytics.

### Later, If The Foundation Remains Stable

1. Privacy-safe conversion attribution and external campaign IDs.
2. A small number of API-based clients or connectors, beginning with a browser workflow only if it can reuse the published OpenAPI contract.
3. Per-link social previews, which are already planned and align with broader link-management workflows.

## Guardrails

- Do not change redirect defaults for existing links.
- Keep D1 as the source of truth and preserve asynchronous analytics/webhook delivery.
- Do not introduce cloaking, user tracking, or landing-page scope into the core redirect release path.
- Do not add team features before the V10 governance work is explicitly approved.

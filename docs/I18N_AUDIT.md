# Admin Internationalization Audit

Updated: 2026-07-10

## Result

The Admin's required deployment, link management, import/export, settings, operations, recovery, audit, and analytics workflows now use the English/Simplified Chinese message catalog. English remains the default locale.

Automated checks verify that:

- English and Simplified Chinese catalogs contain identical keys.
- Repeated template variables interpolate correctly.
- Unknown placeholders are preserved rather than silently removed.

## Intentionally Untranslated Text

The remaining scanner matches are not general UI prose:

- Protocol and analytics fields: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, HTTP, JSON, CSV, URL.
- Product and platform names: Linkora, Shlink, Sink, YOURLS, Dub, Cloudflare Workers, D1, KV, R2.
- Stable audit action names such as `link.create`, shown with English-friendly labels so operators can correlate UI filters with logs and API values.
- Example values and URLs such as `https://example.com`, `go.example.com`, slugs, tags, and campaign examples.
- Server-provided validation/import errors, which remain verbatim for accurate diagnosis.

## Remaining Product Work

- Done: public 404, disabled, expired, password, and warning pages use weighted `Accept-Language` negotiation with redirect regression tests.
- Add browser smoke tests that switch languages and exercise Setup, Create Link, Links, restore preview, and reset confirmation.
- Add locale-aware instance settings for time zone and CSV/export formatting.
- Translate documentation where a Chinese self-hosting guide materially improves deployment success.

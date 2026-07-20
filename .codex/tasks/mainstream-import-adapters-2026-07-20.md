# Mainstream Import Adapters

Date: 2026-07-20
Target version: 0.28.0
Status: Planned

## Goal

Add reliable migration paths for mainstream short-link platforms without guessing export fields or weakening Linketry's existing preview and conflict-safety behavior.

## Delivery Order

### Phase 1 — File Imports

- [ ] Collect representative, redacted Bitly and Short.io CSV exports before fixing the production field contract.
- [ ] Add a Bitly CSV adapter using the documented `Link`, `Custom Link`, `Date created`, `Title`, `Destination URL`, `Engagements`, and `Status` columns.
- [ ] Preserve the Bitly short URL, custom domain, case-sensitive slug, destination, title, creation time, click total, and a verified status mapping.
- [ ] Add a Short.io CSV adapter using the documented ID, short URL, original path, original URL, title, click, created, updated, expiry, creator, and tag columns.
- [ ] Preserve the Short.io short domain, slug, destination, title, tags, click total, timestamps, and expiry when present.
- [ ] Register both adapters for explicit selection and conservative auto-detection before the Generic adapters.
- [ ] Add Admin source choices and localized guidance without adding another polling or credential flow.

### Phase 2 — API Import

- [ ] Collect a representative, redacted Rebrandly response and confirm pagination behavior.
- [ ] Add Rebrandly JSON/API import only after verifying `slashtag`, `destination`, `shortUrl`, `domain`, timestamps, and source ID against the current API contract.
- [ ] Keep any Rebrandly API credential request-scoped and out of browser persistence, logs, audit metadata, and saved settings.

### Deferred Sources

- [ ] Keep Kutt, TinyURL, BL.INK, and Cuttly on Generic CSV/JSON until a current official export contract and redacted fixture are available.
- [ ] Do not expose a named adapter when it would be less reliable than an explicit Generic field mapping.

## Acceptance

- [ ] Representative fixtures contain no credentials, personal domains, private destinations, or account identifiers.
- [ ] Auto-detection does not claim unrelated CSV/JSON payloads.
- [ ] Preview covers valid, invalid, and existing-slug conflict rows.
- [ ] Default conflicts remain `skip`; `rename` and explicit `overwrite` retain their current behavior.
- [ ] Source slug and short domain are preserved when supplied by the platform.
- [ ] Bitly and Short.io fixtures cover custom domains, empty optional fields, quoted CSV values, and malformed rows.
- [ ] Unit coverage verifies normalization and detection; route coverage verifies preview and confirm contracts.
- [ ] Import failure reporting remains downloadable and large confirmations remain bounded and asynchronous.
- [ ] Redirect handling, asynchronous analytics, D1 source-of-truth ownership, KV cache semantics, migrations, and production data are unchanged.

## Contract Sources

- Bitly export contract: <https://support.bitly.com/hc/en-us/articles/115000268051-How-do-I-export-all-data-from-the-Links-page>
- Short.io export contract: <https://docs.short.io/articles/managing-links/how-to-export-short-links-from-short.io>
- Rebrandly list-links contract: <https://developers.rebrandly.com/docs/list-links>
- Rebrandly export guidance: <https://support.rebrandly.com/en/articles/469699-can-i-move-links-between-my-workspaces>

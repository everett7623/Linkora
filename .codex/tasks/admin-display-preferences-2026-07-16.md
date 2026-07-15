# Admin Display Preferences - 2026-07-16

## Status

Completed in Linketry v0.16.0.

## Delivered

- [x] Added comfortable and compact sidebar density stored in canonical Linketry browser storage.
- [x] Added comfortable and compact table density applied across Admin tables and stored per browser.
- [x] Added authenticated instance-level optional Advanced-module visibility stored in D1 settings.
- [x] Kept core navigation and every direct route available, including backup and recovery paths.
- [x] Preserved Simple/Advanced filtering and complete English/Simplified Chinese catalogs.
- [x] Added stable setting validation, unit tests, and an end-to-end browser persistence regression.

## Safety

- Redirect handling, visit analytics, D1 schema, and KV cache behavior were not changed.
- Optional-module visibility affects Admin navigation only and is not an authorization boundary.

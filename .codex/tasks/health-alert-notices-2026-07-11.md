# Health Alert Notices - 2026-07-11

## Status

Implementation complete and verified locally for Linkora 0.8.10.

## Completed

- [x] Added an authenticated sanitized health alert status endpoint.
- [x] Mapped persisted failures to current link slug, domain, and fallback URL.
- [x] Preserved useful remnants when a failed link has since been deleted.
- [x] Added persistent Active Health Alerts to Operations.
- [x] Displayed consecutive failures, alert threshold state, and last alert time.
- [x] Added response mapping and browser API coverage.
- [x] Kept internal state private and preserved redirect, schema, analytics, and KV behavior.

## Deferred

- [x] Bounded timestamped scheduled per-target health history (latest 200 records).

## Verification

- [x] Admin unit and Playwright smoke tests
- [x] Admin production build
- [x] Worker type-check
- [x] Worker tests

# Health Alert Controls - 2026-07-11

## Status

Implementation complete and verified locally for Linkora 0.8.8.

## Completed

- [x] Added configurable 1-10 consecutive-failure thresholds.
- [x] Added 0-10080 minute repeat alert suppression.
- [x] Added signed recovery Webhook notifications.
- [x] Stored compact internal alert state in D1 settings.
- [x] Rotated limited monitoring batches across all active links.
- [x] Excluded internal state and cursors from Admin settings and backups.
- [x] Added bilingual controls and state-machine tests.
- [x] Kept redirects, schema shape, analytics isolation, and KV behavior unchanged.

## Deferred

- [ ] Full per-check target status history and Admin notices.

## Verification

- [x] Admin unit and Playwright smoke tests
- [x] Admin production build
- [x] Worker type-check
- [x] Worker tests

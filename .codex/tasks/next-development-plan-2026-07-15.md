# Next Development Plan - 2026-07-15

## Status

Planned for the next development session. No product functionality is implemented by this task record.

## Priority 1 — Bulk UTM Append And Normalization

- [ ] Reuse Advanced Links selection and filter scope.
- [ ] Offer add-missing, replace-selected, and remove-selected UTM modes.
- [ ] Preserve unrelated query parameters, fragments, URL encoding, and destination validity.
- [ ] Require a preview with before/after URLs and an exact affected count.
- [ ] Keep D1 as the source of truth and write in bounded batches.
- [ ] Clear KV only for successfully updated links; do not change redirect logic.
- [ ] Produce a downloadable change record and document rollback through backup/CSV data.
- [ ] Cover URL policy, partial batches, cache invalidation, and Admin confirmation flows.

## Priority 2 — Admin Display Preferences

- [ ] Store sidebar and table density preferences in the browser for the current Admin.
- [ ] Add compact and comfortable layouts without reducing touch-target accessibility.
- [ ] Add instance-level visibility settings for optional Advanced modules.
- [ ] Keep Overview, Links, Create Link, Import/Export, Setup, Settings, and recovery access reachable.
- [ ] Preserve Simple/Advanced mode and English/Simplified Chinese behavior.
- [ ] Add persistence, navigation, and hidden-module regression coverage.

## Deferred

- [ ] Do not rotate the Shlink API key while Shlink is still required.
- [ ] Do not cut over the legacy short domain until remaining Shlink dependencies are confirmed clear.

## Required Verification

- [ ] Worker type-check and focused policy tests.
- [ ] Admin production build, unit tests, and browser smoke tests.
- [ ] Large-batch regression for UTM writes and selective KV clearing.
- [ ] Release metadata, changelog, task records, and diff checks.

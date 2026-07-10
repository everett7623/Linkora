# Bulk Create, Webhook, And Reset EN/ZH — 2026-07-10

## Status

Core and safety flows complete and verified.

## Completed

- [x] Bulk Create heading, row format, parsed count, validation, result summary, and actions.
- [x] Webhook load/save/test feedback, enable control, heading, and primary actions.
- [x] Reset danger-zone explanation, deletion scope, preview count, pre-reset backup, exact confirmation phrase guidance, and result summary.

## Safety Boundary

- The required confirmation value remains exactly `RESET LINKORA` in every locale.
- Server and event identifiers remain unchanged.

## Verification

- [x] Admin tests
- [x] Admin production build
- [x] Worker type-check
- [x] Diff check

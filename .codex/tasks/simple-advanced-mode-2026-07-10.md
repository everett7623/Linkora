# Simple And Advanced Mode — 2026-07-10

## Status

Done.

## Goal

Make Linkora simple to deploy and use by default while preserving the existing advanced operations features.

## Scope

- Add a browser-local Simple / Advanced Admin mode switch.
- Keep daily link management visible in Simple mode and hide advanced navigation without deleting data.
- Hide advanced filters, bulk actions, analytics shortcuts, and advanced Create/Edit fields in Simple mode.
- Show deployment capability guidance when Advanced mode is enabled.
- Report advanced runtime bindings through an authenticated, typed API without exposing resource identifiers.
- Make R2 backups, Queues, Cron, and multiple Worker domains optional in GitHub Actions deployment.
- Document one-domain quick deployment as the recommended starting point.
- Keep the three-domain deployment available for migration and operational isolation.

## Safety Boundaries

- Do not change redirect behavior.
- D1 and KV remain required core bindings.
- R2 and Queues remain optional runtime bindings.
- Switching Admin mode changes presentation only; it does not create, remove, or mutate Cloudflare resources.

## Verification

- [x] Worker type-check
- [x] Admin production build
- [x] Admin mode and API Origin normalization tests
- [x] Hidden advanced filter reset test
- [x] Advanced capability contract and summary test
- [x] GitHub Actions generated config review for basic and advanced profiles
- [x] Version and release metadata synchronization

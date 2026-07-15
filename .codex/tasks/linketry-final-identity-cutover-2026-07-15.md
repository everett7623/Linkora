# Linketry Final Identity Cutover — 2026-07-15

## Objective

Complete the Linketry identity migration across local code, GitHub, and Cloudflare without changing redirect behavior or losing production data.

## Completed

- [x] Export and retain a full pre-cutover D1 snapshot.
- [x] Create `linketry-db`, import all application tables, and verify exact source/target row counts.
- [x] Copy all R2 backup objects into `linketry-backups`, normalize their metadata, and verify object counts.
- [x] Rename production KV and Queue resources while retaining their identifiers.
- [x] Deploy `linketry-worker`, bind canonical resources, transfer `go.uukk.de`, preserve the Admin token, and verify health/auth/redirect behavior.
- [x] Create the canonical `linketry-admin` Pages project and transfer `admin.uukk.de`.
- [x] Remove superseded local compatibility code and documentation references.
- [x] Configure GitHub Actions and repository variables to use only `LINKETRY_*` names.

## Final Gates

- [ ] Pass Worker type-check/tests and Admin unit/browser/build checks.
- [ ] Complete the GitHub Actions deployment and confirm `admin.uukk.de` is active.
- [ ] Remove superseded Cloudflare rollback resources after production verification.
- [ ] Confirm zero previous-name matches in the working tree and current Cloudflare/GitHub inventories.

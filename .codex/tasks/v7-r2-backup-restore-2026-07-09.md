# V7 R2 Backup Restore - 2026-07-09

## Goal

Add a safe, operator-friendly restore path for completed Cloudflare R2 backup snapshots.

## Completed

- [x] Added restore preview endpoint for completed R2 backups.
- [x] Added restore endpoint with explicit `confirm: true`.
- [x] Added conflict strategies: `skip`, `rename`, and `overwrite`.
- [x] Added pre-restore R2 backup creation before data mutation.
- [x] Added restore report fields for created, overwritten, renamed, skipped, failed, and redirect-rule counts.
- [x] Added Admin Backups restore button and preview modal.
- [x] Preserved restored link domains from backup payloads.
- [x] Refreshed KV cache for restored active links.
- [x] Documented the restore workflow and API endpoints.

## Follow-Up

- [ ] Add configurable R2 backup retention.
- [ ] Add retention cleanup for old backup records and R2 objects.
- [ ] Add periodic target monitoring and failure alerts.
- [ ] Add operations dashboard widgets for backup freshness and monitoring status.

## Verification

- [x] `npm run type-check --workspace=apps/worker`
- [x] `npm run build --workspace=apps/admin`
- [x] `git diff --check`

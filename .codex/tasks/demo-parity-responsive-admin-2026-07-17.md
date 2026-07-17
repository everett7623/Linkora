# Demo Parity And Responsive Admin - 2026-07-17

## Status

Core rollout complete. Linketry v0.25.0 delivered Admin parity, v0.25.1 repaired Wrangler inventory compatibility, and v0.25.2 records the live verification and pending advanced-token follow-up.

## Completed

- [x] Audited all 17 production Admin routes against the live public Demo.
- [x] Made fresh Demo sessions open in Advanced mode while preserving explicit stored choices.
- [x] Replaced the fixed narrow-screen Sidebar with an accessible overlay drawer.
- [x] Added synthetic rules, imports, tokens, health history, saved views, reports, backups, and audits.
- [x] Added isolated R2/Queue configuration and resource-name protection to the Demo deployment gate.
- [x] Generated valid synthetic backup and Analytics report objects for upload after advanced bindings are activated.
- [x] Replaced production token-recovery guidance on Demo Setup with isolation information.
- [x] Added configurable Playwright ports and 390px responsive layout coverage.

## Safety Boundary

- Redirect routing and analytics failure isolation were not changed.
- D1 remains the source of truth and KV remains cache only.
- Demo resources must use the `linketry-demo-*` prefix and remain outside protected production inventories.
- All Demo mutations continue to be rejected for public visitors.

## Verification

- Admin unit tests, 14 Chromium tests, builds, deployment policy tests, and Demo seed tests passed.
- The full migration set and expanded seed executed successfully against isolated local D1 and the live isolated Demo D1.
- GitHub Actions run `29536944045` deployed the core Demo successfully.
- Live checks covered all 17 Admin routes, the 390x844 drawer/layout, synthetic advanced records, and read-only create rejection.
- R2 object upload and Queue activation remain pending because the old token cannot list R2 buckets.

## Follow-up Record

See `.codex/tasks/demo-live-rollout-followup-2026-07-17.md` for credential rotation, R2/Queue activation, and API custom-domain work.

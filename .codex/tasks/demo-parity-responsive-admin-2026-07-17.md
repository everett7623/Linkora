# Demo Parity And Responsive Admin - 2026-07-17

## Status

Complete in Linketry v0.25.0.

## Completed

- [x] Audited all 17 production Admin routes against the live public Demo.
- [x] Made fresh Demo sessions open in Advanced mode while preserving explicit stored choices.
- [x] Replaced the fixed narrow-screen Sidebar with an accessible overlay drawer.
- [x] Added synthetic rules, imports, tokens, health history, saved views, reports, backups, and audits.
- [x] Added isolated R2/Queue configuration and resource-name protection to the Demo deployment gate.
- [x] Generated and uploaded valid synthetic backup and Analytics report objects.
- [x] Replaced production token-recovery guidance on Demo Setup with isolation information.
- [x] Added configurable Playwright ports and 390px responsive layout coverage.

## Safety Boundary

- Redirect routing and analytics failure isolation were not changed.
- D1 remains the source of truth and KV remains cache only.
- Demo resources must use the `linketry-demo-*` prefix and remain outside protected production inventories.
- All Demo mutations continue to be rejected for public visitors.

## Verification

- Admin unit tests, build, focused mobile Chromium test, deployment policy tests, and Demo seed tests passed.
- The full migration set and expanded seed executed successfully against isolated local D1.

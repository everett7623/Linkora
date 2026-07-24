# Sidebar Update Center - 2026-07-23

## Goal

Align the Linketry Admin shell with the compact Sub2API-style reference: make the brand/version area scannable, provide a focused version status panel, and keep existing protected online-upgrade behavior unchanged.

## Scope

- Sidebar brand and version status presentation.
- Version popover states: current, update available, checking, and unavailable.
- Reuse the existing top-level protected upgrade action and confirmation dialog.
- Responsive desktop, collapsed, and mobile sidebar behavior.

## Compatibility Contract

- Keep `useUpdateCheck`, online upgrade polling, release gates, feedback persistence, and reload behavior unchanged.
- Keep the existing top update banner available as the authoritative upgrade workflow and fallback.
- Do not add new API calls, credentials, routes, or redirect-path behavior.

## Status

- [x] Audit the current shell and Sub2API reference interaction states.
- [x] Implement the sidebar version center and responsive panel.
- [x] Add browser regression coverage for panel states and upgrade handoff.
- [x] Verify desktop/mobile screenshots and accessibility.
- [x] Synchronize v0.29.11 metadata and documentation.

## Verification

- 25 Admin browser tests and 64 Admin unit tests pass.
- 110 Worker tests, Worker type-check, and 84 deployment tests pass.
- 8 project-site tests plus normal/Demo Admin and project-site production builds pass.
- Desktop and mobile browser inspection confirms a 320 px panel that remains inside the viewport.

## Release Outcome

- `main` was pushed at commit `6806f4c685caa52afe83caf459f27344c5ca29e0`.
- Isolated Demo workflow `30068332458` completed successfully for v0.29.11.
- Production workflow `30068332470` stopped before mutations because the exact release and commit approvals still referenced v0.29.9 and commit `ba27982e0b11fa81645a2f6a2961e59c214e0a4c`; production remains on v0.29.10 until those approvals are deliberately updated.

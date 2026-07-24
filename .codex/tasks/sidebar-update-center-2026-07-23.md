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

## Remaining Release Step

- Push `main`, then verify the protected production and isolated Demo workflows for v0.29.11.

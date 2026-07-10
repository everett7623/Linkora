# First-run Deployment Wizard — 2026-07-10

## Status

Done and locally verified.

## Goal

Make the required basic deployment path obvious and verifiable without requiring three custom domains or any advanced Cloudflare resources.

## Required Basic Steps

- [x] Verify the authenticated Worker API responds.
- [x] Require one saved default short-link domain.
- [x] Require at least one created short link.
- [x] Derive progress from real instance state instead of manual checkboxes.
- [x] Show a ready state only when all three checks pass.
- [x] Provide direct actions to Settings, Create Link, and Links.
- [x] Explain that three custom domains are optional.

## Advanced Path

- [x] Keep R2, Queue, Cron, branded Admin domain, and multiple Worker domains optional.
- [x] Link Advanced-mode users to the advanced deployment documentation.
- [x] Keep the existing authenticated capability report and checks visible.

## Internationalization

- [x] English is the default.
- [x] All wizard labels, status text, actions, and guidance support Simplified Chinese.
- [x] Setup status cards and advanced capability labels follow the selected locale.

## Safety Boundaries

- The wizard does not create, delete, or reconfigure Cloudflare resources.
- The wizard does not change redirect behavior.
- Completion is derived from existing authenticated APIs and stored instance settings.

## Verification

- [x] Admin unit tests
- [x] Admin production build
- [x] Worker type-check
- [x] Diff and file-size checks

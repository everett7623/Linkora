# Sidebar Version And Update Status - 2026-07-19

## Objective

Move release discovery back to the bottom-left of the Admin shell while preserving automatic checks and a clear operator-controlled update path.

## Completed

- Removed the running version from the Logo row.
- Removed the duplicate desktop and mobile toolbar update buttons.
- Added a sidebar-footer version control for expanded, collapsed, and mobile layouts.
- Kept available-version state visible after the release banner is dismissed.
- Made the footer control force a fresh GitHub check and resurface the release action.
- Preserved the automatic mount check, 15-minute foreground polling, and visibility refresh.
- Added browser coverage for update persistence, manual refresh, toolbar cleanup, and responsive placement.
- Visually verified 1440x900 desktop, 80px collapsed navigation, and 390x844 mobile navigation without horizontal overflow.

## Release Boundary

- Automatic discovery does not automatically deploy a release.
- Applying an update still requires an explicit operator action and protected upgrade capability.
- No redirect, analytics, D1, KV, migration, production-data, or Demo-isolation behavior changed.

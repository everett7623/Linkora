# Sidebar Footer Controls - 2026-07-20

## Objective

Restore the interface-mode, language, theme, and owner-support controls to the bottom-left Sidebar footer while preserving responsive navigation, release status, Demo read-only state, and update behavior.

## Findings

- Desktop currently renders the four controls in the main content toolbar.
- The Sidebar footer renders those controls only in the mobile drawer.
- The pre-v0.26 shell used a clearer footer layout: three utility icons in one row, followed by a full-width interface-mode row.
- The newer Sidebar version/update control must remain available in expanded, collapsed, and mobile layouts.

## Implementation Plan

- Remove preference/support controls from the desktop content toolbar.
- Restore the earlier Sidebar presentation for language, theme, support, and interface mode.
- Keep compact icon-only behavior for the collapsed Sidebar and retain the mobile drawer controls.
- Add browser regression coverage for desktop, collapsed, and mobile placement.
- Synchronize v0.27.3 release metadata and verify affected builds and tests.

## Implemented

- Removed interface mode and Sidebar utility actions from the desktop content toolbar.
- Restored the earlier three-icon row and separate mode/status row in the Sidebar footer.
- Applied the same footer composition to desktop, collapsed, mobile, and public-Demo navigation.
- Kept version/update discovery, logout, theme, locale, support URL, and mode state handlers unchanged.
- Added placement assertions to the existing responsive and Sidebar utility browser suites.

## Verification

- Passed 48 Admin unit tests and 20 Admin browser tests, including desktop, collapsed, mobile, theme, locale, update, and accessibility coverage.
- Passed the Admin production TypeScript/Vite build.
- Passed Worker type-check and 82 Worker tests.
- Passed 64 deployment safety tests, 6 Demo API tests, and 4 project-site tests plus the site production build.
- Confirmed every changed TSX/TS file remains below the project file-size limit and introduced no new React Hook, state, or accessibility violations.
- Confirmed version metadata is synchronized at v0.27.3 and the working diff passes whitespace validation.

## Safety

- No redirect handlers, analytics scheduling, D1/KV access, migrations, authentication, deployment gates, or production resources are in scope.
- Existing locale, theme, mode, support URL, update discovery, and logout handlers remain unchanged.

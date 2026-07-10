# English / Chinese Foundation And Sink Gap Review — 2026-07-10

## Status

Core foundation complete; full-page localization remains in progress.

## Goal

Keep English as the default Admin language, add a persistent Simplified Chinese option, and prioritize the remaining product work against Sink without increasing basic deployment complexity.

## Completed Scope

- [x] Review Sink's official feature list and roadmap.
- [x] Record prioritized product gaps in `docs/SINK_COMPARISON.md`.
- [x] Add a typed English and Simplified Chinese message catalog.
- [x] Default new browsers to English and persist an explicit language choice locally.
- [x] Add language controls to Login, Sidebar, and Settings.
- [x] Localize Login, global navigation, Simple / Advanced mode, and core Settings.
- [x] Localize the required Setup wizard, Overview, Links basic workflow, and Create Link basic workflow.

## Remaining Scope

- [x] Complete the first localization pass for Edit Link, Import/Export, and Tags.
- [ ] Localize remaining import details, advanced-only controls, and all remaining Advanced pages.
- [ ] Localize validation, error, loading, and empty-state messages across every page.
- [ ] Add locale-aware dates, numbers, time zones, and exports.
- [ ] Localize redirect/status HTML templates in a separately tested redirect-safety change.
- [ ] Add i18n behavior tests and a browser smoke test for both languages.

## Safety Boundaries

- No redirect handler or public status-page behavior changes in this pass.
- Language selection is browser-local and does not mutate instance data.
- Missing advanced infrastructure never blocks basic deployment.

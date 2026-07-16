# Community Locale Workflow - 2026-07-16

## Status

Completed in v0.20.0.

## Scope

- [x] Add one typed locale registry as the source of supported Admin locale metadata.
- [x] Resolve stored locale values through the registry and synchronize the document language and direction.
- [x] Render the language switcher from registered native-language labels.
- [x] Add an automated catalog gate for locale registration, message-key parity, non-empty values, and interpolation placeholders.
- [x] Document the contribution workflow for adding and reviewing Admin translations.
- [x] Add focused unit and browser regression coverage.
- [x] Synchronize v0.20.0 release metadata and planning documents.

## Safety Boundary

- Worker routes, public redirect templates, redirect behavior, D1, KV, analytics, and API contracts remain unchanged.
- Existing English and Simplified Chinese copy remains the shipped baseline; the workflow does not add unreviewed machine translations.
- Invalid or removed browser locale values fall back to English without throwing during Admin startup.
- New locale catalogs must preserve every English message key and interpolation placeholder before they can pass CI.

## Verification

- Admin unit tests: 35 passed.
- Admin Playwright browser tests: 11 passed with the configured local Chrome executable.
- Admin production build: passed (existing bundle-size advisory only).
- Worker tests: 60 passed.
- Deployment safety tests: 35 passed.
- Project site tests: 3 passed; production build passed.
- Changed code files stay within project line limits.

# Fallback URL Editing - 2026-07-11

## Status

Implementation complete and verified locally for Linkora 0.8.5.

## Completed

- [x] Added fallback URL fields to Create Link and Edit Link in Advanced mode.
- [x] Added bilingual labels, help text, and client validation.
- [x] Added Worker normalization for optional HTTP(S) fallback URLs.
- [x] Added create, update, and clear persistence behavior.
- [x] Added Worker unit tests for valid, invalid, unsafe, and empty values.
- [x] Kept public redirect behavior, analytics, schema, and KV behavior unchanged.

## Verification

- [x] Admin unit and Playwright smoke tests
- [x] Admin production build
- [x] Worker type-check
- [x] Worker tests

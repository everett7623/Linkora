# Bot Classification - 2026-07-11

## Status

Implementation complete and verified locally for Linkora 0.8.7.

## Completed

- [x] Added boundary-aware generic bot token matching.
- [x] Added major search, social preview, SEO, AI, Headless, monitoring, and automation clients.
- [x] Added real desktop/mobile browser negative cases.
- [x] Added a CUBOT Android regression case for the previous broad `/bot/` false positive.
- [x] Kept classification inside asynchronous analytics recording without changing redirects.

## Verification

- [x] Admin unit and Playwright smoke tests
- [x] Admin production build
- [x] Worker type-check
- [x] Worker tests

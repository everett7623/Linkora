# Shlink API Pagination - 2026-07-09

## Finding

Historical Linkora export `linkora-links-2026-07-07.csv` contains 194 links with 194 unique slugs, all under `s.y8o.de`.

The Admin Shlink API fetch preview only showed 100 links, which indicates the fetch stopped after the first page.

## Fix

- [x] Shlink API pagination now accepts `pagesTotal`, `pagesCount`, and `totalPages`.
- [x] If page count is missing, fetching continues while pages are full and stops on an empty or short page.
- [x] Fetch still caps at 5000 items for safety.

## Verification

- [x] Historical CSV row count checked: 194 rows, 194 unique slugs.
- [x] `npm run type-check --workspace=apps/worker`

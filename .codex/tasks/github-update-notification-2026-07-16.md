# GitHub Update Notification - 2026-07-16

## Status

Completed in v0.18.0.

## Scope

- [x] Check the canonical GitHub repository when an authenticated Admin session opens.
- [x] Read the upstream package version because the repository currently has no Releases or Tags.
- [x] Cache successful checks in the browser to stay within GitHub's anonymous API limit.
- [x] Show an English/Chinese update banner only when the upstream semantic version is newer.
- [x] Allow the current upstream version notice to be dismissed without hiding later versions.
- [x] Keep GitHub failures non-blocking and validate the external response shape before use.
- [x] Add regression coverage and synchronize release metadata.

## Safety Boundary

- The check is read-only and sends no Admin token or instance data to GitHub.
- The Admin calls only the hard-coded public Linketry repository endpoint.
- Malformed responses, rate limits, timeouts, and offline failures must not block authentication or navigation.
- Redirect logic, Worker routes, D1, KV, analytics, and deployment behavior are unchanged.

## Verification

- Admin unit tests: 25 passed.
- Admin Playwright browser tests: 10 passed with the configured local Chromium executable path.
- Admin production build: passed.

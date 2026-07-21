# Asynchronous Signed Click Webhook

Date: 2026-07-21
Target version: 0.28.4
Status: Completed

## Goal

Add an opt-in, privacy-minimized `link.clicked` webhook through the existing signed delivery system without changing redirect decisions or allowing delivery failures to affect visit accounting.

## Planned

- [x] Expose `link.clicked` as an available event without enabling it in the default event set.
- [x] Emit the event only after core visit accounting succeeds in Queue/`waitUntil()` post-processing.
- [x] Exclude IP, IP hash, User-Agent, Referer, country, and full destination URLs from the payload.
- [x] Add bounded retry for transient delivery failures while keeping one stable event ID and signature across attempts.
- [x] Add focused event, payload, signature, retry, and failure-observability coverage.
- [x] Synchronize v0.28.4 release metadata and maintained documentation.
- [x] Preserve the Demo workflow safety contract across Windows CRLF and CI LF checkouts.

## Boundaries

- No redirect-handler or redirect-decision changes.
- No database schema or migration changes.
- No synchronous webhook delivery on the visitor response path.
- No production, Demo, GitHub setting, or Cloudflare account mutation.
- Cloudflare Access authentication remains a separate design task because cross-origin cookies, CORS preflight, logout, CSRF, and recovery require one complete contract.

## Verification

- [x] 75 deployment, 104 Worker, 58 Admin unit, 25 Admin browser scenarios, 6 Demo API, and 4 project-site tests pass.
- [x] Worker type-check and Admin/Site production builds pass under the maintained Node 24 runtime.
- [x] Official npm registry audit reports zero known vulnerabilities after the transitive dev-only `brace-expansion` update to 1.1.16.
- [x] `git diff --check` passes; all changed TypeScript files remain below the project line limits.

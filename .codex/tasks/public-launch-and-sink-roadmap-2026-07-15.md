# Public Launch And Sink Follow-Up Roadmap - 2026-07-15

## Status

Implementation is in progress. Bulk UTM, OpenAPI, duplicate detection, the project site, deployment safety foundations, and Admin display preferences are delivered; fresh-account rehearsal, site-domain activation, the isolated Demo, and optional integrations remain.

## Confirmed Decisions

- [x] Complete bulk UTM append and normalization in v0.9.24.
- [x] Use a dedicated Linketry domain for the public project introduction and Demo.
- [x] Defer domain purchase and DNS configuration until the owner selects the domain.
- [x] Keep the future supporter/coffee page on a separate owner-managed domain.
- [x] Do not block the Linketry site or Demo on supporter-platform approval.
- [x] Keep the Demo isolated from production data, bindings, and secrets.
- [x] Separate deployment into owner production upgrades, fresh beginner self-hosting, and the official Demo.

## Ordered Delivery

1. Bulk UTM append and normalization — completed in v0.9.24.
2. OpenAPI and authenticated API documentation — completed in v0.10.1.
3. Non-blocking duplicate destination detection — completed in v0.10.2.
4. Beginner D1/KV provisioning and deployment preflight.
5. Official project site and isolated, read-only or resettable Demo.
6. Optional Cloudflare Access authentication and asynchronous signed click webhooks.
7. Admin density and optional-module visibility preferences — completed in v0.16.0.
8. Theme, card view, social preview customization, broader locales, real-time views, optional AI, and external clients.

Detailed acceptance criteria are tracked in `TASKS.md` and the phase boundaries are mirrored in `docs/ROADMAP.md`.

## Safety Boundaries

- Redirect behavior remains unchanged until a specifically approved implementation task requires it.
- D1 remains the source of truth and KV remains cache only.
- Existing production upgrades may reuse their current bindings, but require a verified backup and non-destructive incremental migrations; initialization, reset, Demo seeding, and automatic resource replacement are prohibited.
- Fresh beginner installs must create resources in the new user's own Cloudflare account and must not depend on maintainer domains, identifiers, tokens, databases, or existing state.
- Demo resources must be separate from production and use synthetic data.
- Demo Worker, Pages, D1, KV, R2, Queue, Token, and domain identifiers must never reuse the existing production values.
- Demo deployment must fail closed before migrations or deployment when a protected production identifier or domain matches.
- Demo automation must not change production DNS, bindings, migrations, backups, or data.
- Demo credentials must not authorize production or unrestricted destructive actions.
- Any future production deployment change related to the public launch requires a verified production backup first.
- Analytics, webhooks, AI, and presentation features must not block redirects.
- No sponsor URL is committed until the owner supplies the final lawful destination.

## Verification For Future Implementation

- [ ] Worker type-check and focused policy tests for each backend phase.
- [ ] Admin build, unit tests, and browser smoke coverage for each UI phase.
- [ ] Fresh-account deployment rehearsal before calling beginner deployment complete.
- [ ] Existing-production upgrade rehearsal proves that stored links and analytics survive the release.
- [ ] Demo isolation, reset, abuse-control, and secret-exposure checks before public launch.
- [ ] Production-resource mismatch checks prove that Demo deployment stops before any write when identifiers overlap.
- [ ] Release metadata, changelog, progress, task, roadmap, and diff checks for every completed phase.

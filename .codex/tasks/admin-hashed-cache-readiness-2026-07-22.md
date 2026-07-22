# Admin Hashed Cache Readiness - 2026-07-22

## Objective

Keep the v0.29.4 Admin module-identity recovery while allowing production custom domains to cache canonical Vite content-hashed assets without causing a false deployment failure.

## Scope

- [x] Capture the production readiness failure after Worker, Admin, and site deployment succeeded.
- [x] Verify production and Demo v0.29.4 Overview rendering in authenticated browsers.
- [x] Require canonical `/assets/<name>-<content-hash>.js|css` paths without query or fragment identities.
- [x] Permit long-lived caching only after the content hash is part of the canonical asset path.
- [x] Add regression coverage for long-lived hashed assets, query suffixes, and non-hashed paths.
- [x] Complete v0.29.5 regression and release metadata synchronization.
- [ ] Deploy v0.29.5 and verify both live workflow conclusions.

## Safety

- Redirect handlers and decisions are unchanged.
- Worker API behavior, D1, KV, migrations, analytics ingestion, and stored data are unchanged.
- Deployment readiness continues to fail closed for missing assets, HTML fallbacks, wrong MIME types, query/fragment identities, and non-hashed entry paths.

# GPL-3.0 License Change — 2026-07-09

## Status

Done.

## Scope

- Changed Linkora project licensing from MIT to GNU GPL v3 only.
- Updated package metadata to use SPDX `GPL-3.0-only`.
- Replaced the root `LICENSE` notice.
- Updated README, roadmap, changelog, progress, task tracking, example configs, deployment docs, and runtime version metadata.
- Bumped Linkora from `0.7.2` to `0.7.3`.

## Verification

- `npm run type-check --workspace=apps/worker` passed.
- `npm run build --workspace=apps/admin` passed.
- `git diff --check` passed with only existing Windows LF-to-CRLF warnings.
- GitHub repository variables updated: `LINKORA_VERSION=0.7.3`, `LINKORA_SHORT_DOMAIN=s.y8o.de`, `LINKORA_API_URL=https://s.y8o.de`.

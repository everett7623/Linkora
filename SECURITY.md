# Security Policy

## Supported Versions

Security fixes are provided for the latest Linketry release published from `main`. Older pre-1.0 releases may receive upgrade guidance, but they are not maintained as parallel security branches.

## Report A Vulnerability Privately

Use [GitHub private vulnerability reporting](https://github.com/everett7623/Linketry/security/advisories/new). Do not open a public issue for an unpatched vulnerability.

The repository owner must enable **Settings → Security → Code security → Private vulnerability reporting** before the public 1.0 launch. Until that external setting is enabled, open only a minimal public issue requesting a private security contact. Do not include the vulnerability, affected route, proof of concept, logs, data, or credentials in that issue.

Include:

- the affected Linketry version and deployment type;
- the affected route, component, or workflow;
- reproducible steps or a minimal proof of concept;
- the security impact and required privileges;
- any known mitigation that does not destroy data.

Never include a live Cloudflare API token, Linketry Admin token, GitHub token, D1 export, R2 backup, visitor data, or private domain configuration. If a credential may have been exposed, revoke or rotate it before sending the report.

## Response Process

The maintainer aims to acknowledge a complete private report within 7 calendar days and provide an initial assessment within 14 calendar days. These are best-effort targets, not a paid-support SLA.

Validated reports are kept private while a fix and upgrade guidance are prepared. Public disclosure should follow the patched release or a mutually agreed disclosure date. The project does not currently operate a bug-bounty program.

## Security Boundaries

- D1 is the source of truth; KV is a redirect cache.
- Analytics, notifications, and Webhooks must never make redirects depend on their success.
- Admin and API tokens are operator-managed secrets and must not be committed, logged, embedded in browser builds, or sent to public issue trackers.
- Public Demo data and credentials must remain isolated from production resources.
- A vulnerability in Cloudflare, GitHub, a browser, or another third-party service should also be reported to that provider.

For supported runtimes, backups, upgrades, and rollback expectations, see [SUPPORT.md](SUPPORT.md).

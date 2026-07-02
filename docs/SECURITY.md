# Security

## Authentication

### V1: Bearer Token

All management API endpoints require:

```
Authorization: Bearer <ADMIN_TOKEN>
```

- The token is set via `wrangler secret put ADMIN_TOKEN`
- Never stored in code or committed to Git
- The admin frontend stores the token in `localStorage` after login

### V3+: API Tokens (Planned)

- Scoped tokens (read, write, admin)
- Token hashes stored in D1 (never plaintext)
- Token revocation
- Last-used tracking

## Input Validation

### URL Validation

All `long_url` values are validated:

- Must start with `http://` or `https://`
- `javascript:` URLs are blocked
- `data:` URLs are blocked
- Must be a valid URL format (parseable by `new URL()`)

### Slug Validation

- Allowed characters: `a-z`, `A-Z`, `0-9`, `-`, `_`
- Maximum length: 100 characters
- Cannot be empty
- Reserved paths are blocked

### Reserved Paths

These slugs cannot be created:

```
admin, api, health, login, settings,
assets, static, favicon.ico, robots.txt, sitemap.xml
```

## Data Protection

### Secrets Management

- `ADMIN_TOKEN` is stored as a Cloudflare Worker secret (encrypted at rest)
- Never exposed in API responses or logs
- Error messages do not leak internal details or stack traces

### IP Privacy

- IP addresses are hashed (SHA-256) before storage
- Raw IPs are never stored in the database
- Only the hash is kept for unique visitor approximation

### CORS

- API endpoints have CORS headers for cross-origin admin frontend access
- All origins are currently allowed (`*`) for flexibility
- Restrict in production if admin is on a known domain

## Operational Security

### What NOT to do

- Never commit `ADMIN_TOKEN` or any secrets to the repository
- Never expose `wrangler.toml` with real resource IDs publicly (use `.gitignore` or dummy values)
- Never run delete/overwrite operations without confirmation
- Never disable HTTPS for the Worker

### Recommended Practices

1. Use a strong, random token (>= 32 characters)
2. Rotate `ADMIN_TOKEN` periodically
3. Monitor access patterns for anomalies
4. Keep regular backups (see [BACKUP_AND_RESTORE.md](BACKUP_AND_RESTORE.md))
5. Review import previews before confirming
6. Test with a staging domain before production changes

## Error Handling

- API errors return structured JSON with `success: false`
- No stack traces or internal paths are exposed
- Database errors are caught and return generic messages
- Statistics failures are silently caught (never block redirects)

## Attack Surface

| Vector | Mitigation |
|--------|-----------|
| Brute-force token | Cloudflare rate limiting (configure in dashboard) |
| Open redirect | `long_url` must be `http(s)://`; no relative/javascript/data URLs |
| Slug injection | Strict alphanumeric + `-` + `_` pattern |
| XSS via titles | React auto-escapes output; no `dangerouslySetInnerHTML` |
| SSRF | No server-side URL fetching in V1 |
| Data exfiltration | All export endpoints require auth |

## Reporting Vulnerabilities

If you discover a security issue, please report it privately via GitHub Security Advisories or email the maintainer directly. Do not open a public issue for security vulnerabilities.

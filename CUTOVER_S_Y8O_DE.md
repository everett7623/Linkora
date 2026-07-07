# s.y8o.de Cutover Plan

This document is the production cutover checklist for moving `s.y8o.de` from Shlink to Linkora.

Do not run this plan casually. `s.y8o.de` is the real short-link domain.

---

## Current State

| Item | Value |
|------|-------|
| Admin domain | `admin.y8o.de` |
| Linkora test short/API domain | `go.y8o.de` |
| Production short domain to migrate | `s.y8o.de` |
| Linkora Worker | `linkora-worker` |
| Linkora D1 | `linkora-db` |
| Imported Shlink links | 195 |
| Current Admin copy/open domain | `go.y8o.de` |

`go.y8o.de` should stay available after cutover as a test and fallback domain.

---

## Pre-Cutover Checklist

- [ ] Shlink API key used during migration has been revoked or rotated
- [ ] `https://go.y8o.de/health` returns 200
- [ ] Important slugs work on `go.y8o.de`
- [ ] Admin can log in at `https://admin.y8o.de`
- [ ] Admin Settings has `default_domain=go.y8o.de` before cutover
- [ ] Export a fresh Linkora backup from Admin
- [ ] Keep Shlink running for rollback

Recommended sample slugs:

```txt
nicecc
mofamao
kexinyun
thordata
fmta
```

Expected command:

```bash
curl -I https://go.y8o.de/nicecc
```

Expected result:

```txt
HTTP/2 302
location: https://www.nicecc.cc/#/register?code=...
```

---

## Cutover Steps

### 1. Add `s.y8o.de` to Worker routes

Update `apps/worker/wrangler.toml`:

```toml
routes = [
  { pattern = "go.y8o.de", custom_domain = true },
  { pattern = "s.y8o.de", custom_domain = true }
]
```

Deploy Worker:

```bash
npm run deploy --workspace=apps/worker
```

### 2. Confirm Cloudflare custom domain status

In Cloudflare Dashboard:

1. Open **Workers & Pages**
2. Select `linkora-worker`
3. Confirm both custom domains are active:
   - `go.y8o.de`
   - `s.y8o.de`

If Cloudflare asks for DNS changes, follow the dashboard prompt.

### 3. Test `s.y8o.de`

Run:

```bash
curl -I https://s.y8o.de/health
curl -I https://s.y8o.de/nicecc
curl -I https://s.y8o.de/mofamao
curl -I https://s.y8o.de/kexinyun
curl -I https://s.y8o.de/thordata
curl -I https://s.y8o.de/fmta
```

Expected:

- `/health` returns Linkora JSON
- Slugs return `301` or `302` to the same destinations as Shlink
- Missing slugs return Linkora 404 page

### 4. Update Admin default domain

After `s.y8o.de` is confirmed working, update Admin Settings:

```txt
Default Domain: s.y8o.de
```

This only changes Admin copy/open behavior. It does not rewrite imported `short_url` values.

### 5. Smoke test Admin after cutover

In `https://admin.y8o.de`:

- [ ] Links list loads
- [ ] Copy button copies `https://s.y8o.de/<slug>`
- [ ] Open button opens `https://s.y8o.de/<slug>`
- [ ] Create a temporary link and verify redirect
- [ ] Delete the temporary link and verify 404

---

## Rollback Plan

If Linkora has a production issue:

1. Remove or disable the `s.y8o.de` Worker route/custom domain
2. Restore the old Shlink DNS / Cloudflare route
3. Change Admin Settings back to:

```txt
Default Domain: go.y8o.de
```

4. Keep Linkora data intact
5. Investigate with `go.y8o.de` while Shlink serves production traffic

Do not delete Shlink immediately after cutover. Keep it for at least 1-2 weeks.

---

## Post-Cutover Tasks

- [ ] Monitor high-traffic slugs
- [ ] Export a fresh backup after the first successful day
- [ ] Check total clicks growth in Linkora
- [ ] Keep Shlink available for rollback
- [ ] Update `PROGRESS.md` after the cutover is stable

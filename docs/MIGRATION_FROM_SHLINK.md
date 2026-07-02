# Migration from Shlink to Linkora

This guide covers the complete process of migrating from Shlink to Linkora while ensuring zero downtime for existing short links.

## Overview

```
Phase 1: Deploy Linkora to test domain (go.y8o.de)
Phase 2: Import Shlink data
Phase 3: Validate redirects
Phase 4: Switch production domain (s.y8o.de)
Phase 5: Monitor and keep Shlink as fallback
```

## Prerequisites

- Linkora deployed and working on a test domain (see [DEPLOYMENT.md](DEPLOYMENT.md))
- Access to Shlink data export (JSON/CSV/JSONL)
- DNS managed through Cloudflare (for easy switching)

## Phase 1: Deploy Linkora

1. Follow the [Deployment Guide](DEPLOYMENT.md) to set up Linkora on a test domain:
   - Short links: `go.y8o.de`
   - Admin: `admin.y8o.de`

2. Verify the health endpoint works:
   ```bash
   curl https://go.y8o.de/health
   ```

3. Log into the admin panel and create a test link to confirm everything works.

## Phase 2: Import Shlink Data

### Export from Shlink

```bash
# Via Shlink CLI
shlink short-url:list --format=json > shlink-export.json

# Or via API
curl -H "X-Api-Key: YOUR_KEY" \
  "https://your-shlink/rest/v3/short-urls?itemsPerPage=-1" \
  | jq '.shortUrls.data' > shlink-export.json
```

### Import into Linkora

1. Go to **Import / Export** in the admin panel
2. Select source type: **Shlink**
3. Upload your export file
4. Review the preview:
   - Total records to import
   - Valid records
   - Conflicts (slugs that already exist)
5. Confirm the import

Or via API:

```bash
# Preview
curl -X POST https://go.y8o.de/api/import/preview \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source":"shlink","data":'$(cat shlink-export.json)'}'

# Confirm
curl -X POST https://go.y8o.de/api/import/confirm \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source":"shlink","data":'$(cat shlink-export.json)',"conflictStrategy":"skip"}'
```

### Key behaviors during import:

- Original `shortCode` values are preserved as Linkora `slug`
- Click counts are imported
- Tags are auto-created
- Conflicts are skipped (not overwritten)
- Source is recorded as `"shlink"`

## Phase 3: Validate Redirects

### Automated Testing

Test your most important slugs:

```bash
# Test a slug redirect (should return 302 with Location header)
curl -I https://go.y8o.de/your-slug

# Expected:
# HTTP/2 302
# location: https://your-original-long-url.com
```

### Validation Checklist

- [ ] Test 30-50 random imported slugs
- [ ] Test your top 10 most-visited slugs
- [ ] Verify click counts match (approximately)
- [ ] Check that disabled links show disabled page
- [ ] Confirm non-existent slugs show 404

## Phase 4: Switch Production Domain

Once confident, switch your production short-link domain:

### DNS/Cloudflare Route Method

1. In Cloudflare Dashboard, go to your Worker settings
2. Add your production domain (e.g., `s.y8o.de`) as a Custom Domain
3. Remove the domain from your Shlink setup

The switch is near-instant since Cloudflare handles the routing.

### Verification After Switch

```bash
# Test production domain
curl -I https://s.y8o.de/your-popular-slug

# Health check
curl https://s.y8o.de/health
```

## Phase 5: Monitor and Fallback

### Keep Shlink Running (1-2 weeks)

- Do NOT shut down Shlink immediately
- Keep it running on a different port/domain as a fallback
- Monitor Linkora access logs for any issues

### Rollback Plan

If issues arise:

1. Remove `s.y8o.de` from Linkora Worker custom domains
2. Point `s.y8o.de` back to Shlink
3. Investigate and fix the issue in Linkora
4. Re-attempt the switch

### After Stable Period

After 1-2 weeks with no issues:

1. Stop Shlink service
2. Keep a final backup of Shlink database
3. Remove Shlink from your server

## Domain Planning

| Phase | `go.y8o.de` | `s.y8o.de` | `admin.y8o.de` |
|-------|------------|-----------|---------------|
| Testing | Linkora Worker | Shlink (unchanged) | Linkora Admin |
| Migration | Linkora Worker | Linkora Worker | Linkora Admin |
| Final | (can decommission) | Linkora Worker | Linkora Admin |

## Troubleshooting

### Imported slug not redirecting

1. Check the link exists: Search in admin panel
2. Verify status is `active`
3. Clear KV cache by editing and saving the link

### Click counts don't match exactly

This is expected. Linkora imports `visitsSummary.total` from Shlink which may include bot visits. Going forward, Linkora tracks clicks independently.

### Some slugs were skipped

Check the import report for conflict details. Skipped slugs already existed in Linkora (perhaps from a previous import attempt).

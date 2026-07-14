# Migration From Shlink

This is the cutover process for moving from Shlink to Linkora.

## Safe Migration Plan

1. Keep Shlink running.
2. Export all short URLs from Shlink.
3. Deploy Linkora to a temporary test short-link domain, for example `go.example.com`.
4. Import Shlink data into Linkora.
5. Verify the import report.
6. Spot-check 30 to 50 old slugs.
7. Test high-traffic slugs.
8. Run Linkora in parallel for 1 to 2 weeks.
9. Back up Shlink.
10. Cut the old Shlink short domain DNS or Cloudflare routing over to Linkora.
11. Keep Shlink available for rollback for 1 to 2 weeks.

## Rollback

If Linkora has a production issue after cutover, point the old short domain back to Shlink immediately.

## Current Status

Use [../CUTOVER.md](../CUTOVER.md) as a starting template, then fill in your own domain, DNS, spot-check slug, and rollback details.

Outstanding operational tasks:

- Revoke or rotate the Shlink API key used during migration after Shlink is no longer needed. This is intentionally deferred while the existing Shlink instance remains active.
- Cut over the old short domain only after confirming that no legacy links still depend on Shlink.

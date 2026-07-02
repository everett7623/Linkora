# Roadmap

## V1: Stable Shlink Replacement (Current)

Core goal: Replace Shlink with a stable, self-hosted shortener on Cloudflare.

- [x] Short link redirect (KV cache + D1 fallback)
- [x] Admin login (Bearer token)
- [x] Link CRUD (create, edit, delete, disable/enable)
- [x] Search and filter links
- [x] Tags
- [x] Basic click statistics (async, non-blocking)
- [x] Shlink import (JSON/JSONL/CSV)
- [x] Generic CSV/JSON import
- [x] Export (CSV, JSON, backup.json)
- [x] Import preview & conflict detection
- [x] Settings page
- [x] KV cache management
- [x] Health check endpoint
- [x] Admin frontend (React + Tailwind)
- [x] Documentation

---

## V2: Management Enhancement

Goal: Make Linkora admin more powerful than Shlink.

### Links
- [ ] Link expiration (`expires_at`)
- [ ] Max click limit (`max_clicks`)
- [ ] Password-protected links
- [ ] Warning/safety interstitial page
- [ ] Auto-fetch page title from URL

### Batch Operations
- [ ] Bulk delete
- [ ] Bulk disable/enable
- [ ] Bulk tag assignment
- [ ] Bulk archive

### Tags
- [ ] Tag colors
- [ ] Tag descriptions
- [ ] Link count per tag

### Import
- [ ] Sink adapter
- [ ] YOURLS adapter
- [ ] Dub adapter
- [ ] Bitly adapter
- [ ] Enhanced field mapping for generic CSV/JSON
- [ ] Import conflict strategies: rename, overwrite
- [ ] Import report download (CSV)
- [ ] Linkora backup.json restore

### Admin UI
- [ ] QR code generation
- [ ] Advanced link table with sortable columns
- [ ] Bulk action toolbar
- [ ] Import wizard with step-by-step flow
- [ ] Audit logs page

### Other
- [ ] UTM parameter templates
- [ ] Operation audit logs
- [ ] Delete confirmation modal

---

## V3: Analytics & Automation

Goal: Long-term operation, detailed analytics, automated backups.

### Analytics
- [ ] Daily visit trends chart
- [ ] Top links by clicks
- [ ] Top referrers
- [ ] Top countries (via CF headers)
- [ ] Top devices/browsers/OS
- [ ] Bot traffic percentage
- [ ] Recent visits log
- [ ] `daily_stats` aggregation table

### Backup & Automation
- [ ] Auto-backup to Cloudflare R2
- [ ] Daily scheduled backups (Cron Triggers)
- [ ] 30-day backup retention
- [ ] One-click restore from backup
- [ ] Backup status in dashboard

### API & Integration
- [ ] API Token management (create, revoke)
- [ ] Token permission scopes (read, write, admin)
- [ ] Webhook notifications
- [ ] Link anomaly alerts

### Infrastructure
- [ ] Cloudflare Queues for async statistics
- [ ] Multi-domain management
- [ ] System status page
- [ ] Enhanced health check
- [ ] Custom 404/disabled/expired pages

---

## V4: Smart Redirect & Operations

Goal: Advanced routing, AI features, campaign management.

### Smart Redirect Rules
- [ ] Redirect by country
- [ ] Redirect by device type
- [ ] Redirect by browser
- [ ] Redirect by referrer
- [ ] Redirect by language
- [ ] A/B testing (traffic split)
- [ ] Weighted distribution
- [ ] Fallback URL on target failure

### AI Features
- [ ] AI-generated slugs
- [ ] AI-generated titles
- [ ] AI tag suggestions
- [ ] AI link descriptions

### Campaign & Organization
- [ ] Campaign management
- [ ] Project/folder grouping
- [ ] Link notes
- [ ] Affiliate link annotations

### Monitoring
- [ ] Target URL health check
- [ ] Dead link detection & alerts
- [ ] Batch URL replacement
- [ ] Auto-archive inactive links

### Multi-user (Optional)
- [ ] Multi-user support
- [ ] Role-based permissions
- [ ] Team collaboration

---

## Design Principles

1. **Stability first** - New features must never break redirects
2. **Modular** - Each feature is isolated and can be disabled
3. **Data safe** - All changes are reversible, exports always available
4. **Incremental** - Ship V1 stable, then iterate

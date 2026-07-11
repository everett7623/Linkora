-- Linkora V1 Initial Schema

CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  long_url TEXT NOT NULL,
  short_url TEXT,
  title TEXT,
  description TEXT,
  tags TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  redirect_type INTEGER NOT NULL DEFAULT 302,
  clicks INTEGER NOT NULL DEFAULT 0,
  source TEXT,
  source_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_clicked_at TEXT,
  expires_at TEXT,
  max_clicks INTEGER,
  password_hash TEXT,
  warning_enabled INTEGER NOT NULL DEFAULT 0,
  fallback_url TEXT,
  archived INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_links_slug ON links(slug);
CREATE INDEX IF NOT EXISTS idx_links_status ON links(status);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at);

CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  link_id TEXT,
  slug TEXT NOT NULL,
  domain TEXT,
  referer TEXT,
  country TEXT,
  user_agent TEXT,
  browser TEXT,
  os TEXT,
  device_type TEXT,
  ip_hash TEXT,
  is_bot INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_visits_link_id ON visits(link_id);
CREATE INDEX IF NOT EXISTS idx_visits_slug ON visits(slug);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at);

-- V2/V3: daily_stats table (schema ready, not used in V1)
CREATE TABLE IF NOT EXISTS daily_stats (
  id TEXT PRIMARY KEY,
  link_id TEXT,
  slug TEXT NOT NULL,
  date TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  unique_clicks INTEGER NOT NULL DEFAULT 0,
  top_country TEXT,
  top_referer TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_link_id ON daily_stats(link_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- V2: domains table
CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  is_default INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS import_jobs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  filename TEXT,
  total_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  conflict_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  report TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

-- V3: api_tokens table
CREATE TABLE IF NOT EXISTS api_tokens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  scopes TEXT NOT NULL,
  last_used_at TEXT,
  created_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL
);

-- V2: audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  detail TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

-- V3: backups table
CREATE TABLE IF NOT EXISTS backups (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  storage TEXT NOT NULL,
  size INTEGER,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- V4: redirect_rules table
CREATE TABLE IF NOT EXISTS redirect_rules (
  id TEXT PRIMARY KEY,
  link_id TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  rule_config TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Default settings
INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES
  ('default_redirect_type', '302', datetime('now')),
  ('default_domain', '', datetime('now')),
  ('site_name', 'Linkora', datetime('now')),
  ('backup_retention_days', '30', datetime('now')),
  ('health_monitoring_enabled', 'false', datetime('now')),
  ('health_monitoring_limit', '20', datetime('now')),
  ('health_failure_threshold', '2', datetime('now')),
  ('health_alert_suppression_minutes', '1440', datetime('now'));

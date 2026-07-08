export type LinkStatus = 'active' | 'disabled' | 'expired' | 'archived';
export type RedirectType = 301 | 302;

export interface Link {
  id: string;
  slug: string;
  domain?: string | null;
  long_url: string;
  short_url?: string | null;
  title?: string | null;
  description?: string | null;
  tags?: string | null;
  status: LinkStatus;
  redirect_type: RedirectType;
  clicks: number;
  source?: string | null;
  source_id?: string | null;
  created_at: string;
  updated_at: string;
  last_clicked_at?: string | null;
  expires_at?: string | null;
  max_clicks?: number | null;
  password_hash?: string | null;
  password_protected?: boolean;
  warning_enabled: number;
  fallback_url?: string | null;
  archived: number;
}

export interface Visit {
  id: string;
  link_id?: string | null;
  slug: string;
  domain?: string | null;
  referer?: string | null;
  country?: string | null;
  user_agent?: string | null;
  browser?: string | null;
  os?: string | null;
  device_type?: string | null;
  ip_hash?: string | null;
  is_bot: number;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Domain {
  id: string;
  domain: string;
  is_default: number;
  status: 'active' | 'disabled';
  created_at: string;
  updated_at: string;
}

export interface ImportJob {
  id: string;
  source: string;
  filename?: string | null;
  total_count: number;
  success_count: number;
  skipped_count: number;
  conflict_count: number;
  failed_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  report?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface AuditLog {
  id: string;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  detail?: string | null;
  ip_hash?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export type BackupStatus = 'processing' | 'completed' | 'failed';

export interface Backup {
  id: string;
  filename: string;
  storage: string;
  size?: number | null;
  status: BackupStatus;
  created_at: string;
}

export type RedirectRuleType = 'country' | 'device' | 'browser' | 'referer' | 'language' | 'weighted';

export interface RedirectRuleTarget {
  url: string;
  weight?: number;
}

export interface RedirectRuleConfig {
  enabled?: boolean;
  values?: string[];
  targetUrl?: string;
  targets?: RedirectRuleTarget[];
}

export interface RedirectRule {
  id: string;
  link_id: string;
  rule_type: RedirectRuleType;
  rule_config: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export type ApiTokenScope = 'read' | 'write' | 'admin';

export interface ApiToken {
  id: string;
  name: string;
  scopes: ApiTokenScope[];
  last_used_at?: string | null;
  created_at: string;
  revoked_at?: string | null;
}

export interface Setting {
  key: string;
  value?: string | null;
  updated_at: string;
}

export interface NormalizedImportItem {
  slug: string;
  longUrl: string;
  shortUrl?: string;
  title?: string;
  description?: string;
  tags?: string[];
  clicks?: number;
  createdAt?: string;
  updatedAt?: string;
  lastClickedAt?: string;
  source?: string;
  sourceId?: string;
  status?: LinkStatus;
  redirectType?: RedirectType;
  expiresAt?: string | null;
  maxClicks?: number | null;
  passwordHash?: string | null;
  warningEnabled?: boolean;
  fallbackUrl?: string | null;
  archived?: number;
  raw?: unknown;
}

export type ImportFieldMapping = Partial<Record<keyof NormalizedImportItem, string | string[]>>;

export interface ImportValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ImportAdapter {
  source: string;
  detect(input: unknown): boolean;
  parse(input: unknown): Promise<NormalizedImportItem[]>;
  validate(item: NormalizedImportItem): ImportValidationResult;
}

export interface KVCacheEntry {
  id: string;
  slug: string;
  domain?: string | null;
  longUrl: string;
  redirectType: RedirectType;
  status: LinkStatus;
  expiresAt?: string | null;
  maxClicks?: number | null;
  warningEnabled: boolean;
}

export interface VisitLinkSnapshot {
  id: string;
  slug: string;
  domain?: string | null;
  long_url: string;
  redirect_type: RedirectType;
  status: LinkStatus;
  expires_at?: string | null;
  max_clicks?: number | null;
  warning_enabled: number;
  password_protected: boolean;
}

export interface VisitRequestSnapshot {
  user_agent?: string | null;
  referer?: string | null;
  country?: string | null;
  ip?: string | null;
}

export interface VisitQueueMessage {
  link: VisitLinkSnapshot;
  request: VisitRequestSnapshot;
  domain: string;
  queued_at: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface OverviewStats {
  totalLinks: number;
  totalClicks: number;
  todayClicks: number;
  recentLinks: Link[];
  topLinks: Link[];
}

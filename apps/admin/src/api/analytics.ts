import { apiDelete, apiGet, apiPost, apiPut, downloadFile } from './client';
import type { ConversionEvent, Link, Visit } from '@linketry/shared';

export interface AnalyticsFilters {
  days?: number;
  link_id?: string;
  slug?: string;
  domain?: string;
  tag?: string;
  campaign?: string;
  project?: string;
  country?: string;
  device?: string;
  browser?: string;
  referer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface AnalyticsSummary {
  days: number;
  timezoneOffsetMinutes: number;
  rangeStart: string;
  rangeEnd: string;
  totalClicks: number;
  botClicks: number;
  uniqueVisitors: number;
  uniqueLinks: number;
  eligibleClicks: number;
  conversionsTotal: number | null;
  conversionRate: number | null;
  conversionAttributionAvailable: boolean;
  daily: Array<{
    date: string;
    clicks: number;
    humanClicks: number;
    botClicks: number;
    uniqueVisitors: number;
  }>;
  previousPeriod: {
    rangeStart: string;
    rangeEnd: string;
    totalClicks: number;
    humanClicks: number;
    botClicks: number;
    uniqueVisitors: number;
    daily: Array<{
      date: string;
      clicks: number;
      humanClicks: number;
      botClicks: number;
      uniqueVisitors: number;
    }>;
  };
  hourlyHeatmap: Array<{
    weekday: number;
    hour: number;
    clicks: number;
    humanClicks: number;
    botClicks: number;
  }>;
  topLinks: Array<{
    id?: string | null;
    slug: string;
    domain?: string | null;
    title?: string | null;
    clicks: number;
  }>;
  topCountries: Array<{ country: string; clicks: number }>;
  geography: {
    countries: Array<{ country: string; clicks: number }>;
    mappedClicks: number;
    unknownClicks: number;
  };
  topReferrers: Array<{ referer: string; clicks: number }>;
  topBrowsers: Array<{ browser: string; clicks: number }>;
  topDevices: Array<{ device_type: string; clicks: number }>;
  topOperatingSystems: Array<{ os: string; clicks: number }>;
  topUtmSources: Array<{ value: string; clicks: number }>;
  topUtmMediums: Array<{ value: string; clicks: number }>;
  topUtmCampaigns: Array<{ value: string; clicks: number }>;
  topUtmTerms: Array<{ value: string; clicks: number }>;
  topUtmContents: Array<{ value: string; clicks: number }>;
  topTargets: Array<{
    target_url: string;
    redirect_rule_id?: string | null;
    redirect_rule_type?: string | null;
    clicks: number;
  }>;
  topConversionEvents: Array<{
    event_name: string;
    currency: string | null;
    conversions: number;
    value_total: number;
  }>;
  conversionValues: Array<{
    currency: string | null;
    conversions: number;
    value_total: number;
  }>;
  recentVisits: Visit[];
}

export interface LinkAnalyticsResponse {
  link: Link;
  summary: AnalyticsSummary;
}

export interface PublicStatsConfig {
  enabled: boolean;
  days?: number;
  show_countries?: boolean;
  show_referrers?: boolean;
  created_at?: string;
  token?: string;
}

export interface SavedAnalyticsView {
  id: string;
  name: string;
  filters: AnalyticsFilters;
  created_at: string;
}
export function getSavedAnalyticsViews(): Promise<{ items: SavedAnalyticsView[] }> {
  return apiGet('/api/v1/analytics-views');
}
export function saveAnalyticsView(
  name: string,
  filters: AnalyticsFilters
): Promise<SavedAnalyticsView> {
  return apiPost('/api/v1/analytics-views', { name, filters });
}
export function deleteAnalyticsView(id: string): Promise<{ deleted: boolean }> {
  return apiDelete(`/api/v1/analytics-views/${id}`);
}

export interface AnalyticsReportRecord {
  key: string;
  created_at: string;
  status: 'completed' | 'failed';
  size: number | null;
  error?: string;
}
export interface AnalyticsReportState {
  config: { enabled: boolean; days: number; saved_view_id: string | null };
  records: AnalyticsReportRecord[];
  r2Configured: boolean;
}
export function getAnalyticsReportState(): Promise<AnalyticsReportState> {
  return apiGet('/api/v1/analytics-reports');
}
export function saveAnalyticsReportConfig(
  payload: AnalyticsReportState['config']
): Promise<AnalyticsReportState['config']> {
  return apiPut('/api/v1/analytics-reports/config', payload);
}
export function runAnalyticsReport(): Promise<AnalyticsReportRecord> {
  return apiPost('/api/v1/analytics-reports/run');
}
export function downloadScheduledAnalyticsReport(record: AnalyticsReportRecord): Promise<void> {
  return downloadFile(
    `/api/v1/analytics-reports/download?key=${encodeURIComponent(record.key)}`,
    record.key.split('/').pop() ?? 'linketry-analytics.csv'
  );
}

export function getPublicStatsConfig(id: string): Promise<PublicStatsConfig> {
  return apiGet(`/api/v1/public-stats/links/${id}`);
}

export function createPublicStatsShare(
  id: string,
  payload: { days: number; show_countries: boolean; show_referrers: boolean }
): Promise<PublicStatsConfig> {
  return apiPost(`/api/v1/public-stats/links/${id}`, payload);
}

export function disablePublicStatsShare(id: string): Promise<PublicStatsConfig> {
  return apiDelete(`/api/v1/public-stats/links/${id}`);
}

export interface ConversionPayload {
  event_id?: string;
  link_id?: string;
  slug?: string;
  domain?: string;
  event_name: string;
  value?: number | null;
  currency?: string | null;
  metadata?: unknown;
}

export function getAnalytics(filters: AnalyticsFilters = {}): Promise<AnalyticsSummary> {
  const q = analyticsQuery(filters);
  return apiGet(`/api/v1/analytics?${q.toString()}`);
}

export function getLinkAnalytics(
  id: string,
  filters: AnalyticsFilters = {}
): Promise<LinkAnalyticsResponse> {
  const q = analyticsQuery(filters);
  return apiGet(`/api/v1/analytics/links/${id}?${q.toString()}`);
}

export function createConversion(
  payload: ConversionPayload
): Promise<(ConversionEvent & { duplicate: false }) | { id: string; duplicate: true }> {
  return apiPost('/api/v1/conversions', payload);
}

export function downloadAnalyticsReport(filters: AnalyticsFilters = {}): Promise<void> {
  const q = analyticsQuery(filters);
  const suffix = new Date().toISOString().slice(0, 10);
  return downloadFile(
    `/api/v1/export/analytics.csv?${q.toString()}`,
    `linketry-analytics-${suffix}.csv`
  );
}

function analyticsQuery(filters: AnalyticsFilters): URLSearchParams {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      q.set(key, String(value));
    }
  }
  if (!q.has('days')) q.set('days', '30');
  q.set('timezone_offset', String(-new Date().getTimezoneOffset()));
  return q;
}

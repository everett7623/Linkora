import { apiGet } from './client';
import type { Visit } from '@linkora/shared';

export interface AnalyticsSummary {
  days: number;
  totalClicks: number;
  botClicks: number;
  uniqueLinks: number;
  daily: Array<{ date: string; clicks: number }>;
  topLinks: Array<{ slug: string; title?: string | null; clicks: number }>;
  topCountries: Array<{ country: string; clicks: number }>;
  topReferrers: Array<{ referer: string; clicks: number }>;
  topBrowsers: Array<{ browser: string; clicks: number }>;
  topDevices: Array<{ device_type: string; clicks: number }>;
  recentVisits: Visit[];
}

export function getAnalytics(days = 30): Promise<AnalyticsSummary> {
  const q = new URLSearchParams({ days: String(days) });
  return apiGet(`/api/analytics?${q.toString()}`);
}

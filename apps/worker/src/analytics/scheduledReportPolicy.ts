export interface AnalyticsReportConfig { enabled: boolean; days: number; saved_view_id: string | null; }
export interface AnalyticsReportRecord { key: string; created_at: string; status: 'completed' | 'failed'; size: number | null; error?: string; }

export function parseReportConfig(value?: string): AnalyticsReportConfig {
  try { const item = JSON.parse(value ?? '{}') as Partial<AnalyticsReportConfig>; return { enabled: item.enabled === true, days: [7,30,90,365].includes(Number(item.days)) ? Number(item.days) : 30, saved_view_id: typeof item.saved_view_id === 'string' && item.saved_view_id ? item.saved_view_id : null }; }
  catch { return { enabled: false, days: 30, saved_view_id: null }; }
}
export function parseReportRecords(value?: string): AnalyticsReportRecord[] {
  try { const items = JSON.parse(value ?? '[]'); return Array.isArray(items) ? items.filter((item) => item && typeof item.key === 'string' && typeof item.created_at === 'string').slice(0, 30) : []; }
  catch { return []; }
}

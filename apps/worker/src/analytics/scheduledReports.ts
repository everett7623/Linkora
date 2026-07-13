import type { Env } from '../types';
import { getSettings, setSetting } from '../db/index';
import { getAnalyticsSummary, type AnalyticsFilters } from '../db/analytics';
import { analyticsCsv } from '../routes/export';
import { now } from '../utils/id';
import { listSavedAnalyticsViews } from './savedViews';
import { parseReportConfig, parseReportRecords, type AnalyticsReportConfig, type AnalyticsReportRecord } from './scheduledReportPolicy';

const CONFIG_KEY = 'analytics_report_schedule';
const RECORDS_KEY = 'analytics_report_records';

export async function getAnalyticsReportState(env: Env) {
  const settings = await getSettings(env);
  return { config: parseReportConfig(settings[CONFIG_KEY]), records: parseReportRecords(settings[RECORDS_KEY]), r2Configured: Boolean(env.BACKUPS) };
}

export async function saveAnalyticsReportConfig(env: Env, config: AnalyticsReportConfig): Promise<AnalyticsReportConfig> {
  const normalized = { enabled: config.enabled === true, days: [7,30,90,365].includes(config.days) ? config.days : 30, saved_view_id: config.saved_view_id || null };
  if (normalized.saved_view_id && !(await listSavedAnalyticsViews(env)).some((view) => view.id === normalized.saved_view_id)) throw new Error('Saved Analytics view not found');
  await setSetting(env, CONFIG_KEY, JSON.stringify(normalized), now());
  return normalized;
}

export async function createScheduledAnalyticsReport(env: Env, force = false): Promise<AnalyticsReportRecord | null> {
  const state = await getAnalyticsReportState(env);
  if (!force && !state.config.enabled) return null;
  const createdAt = now();
  const key = `reports/linkora-analytics-${createdAt.slice(0, 19).replace(/[-:T]/g, '')}.csv`;
  let record: AnalyticsReportRecord;
  try {
    if (!env.BACKUPS) throw new Error('R2 backup bucket is not configured');
    let filters: AnalyticsFilters = { days: state.config.days };
    if (state.config.saved_view_id) {
      const view = (await listSavedAnalyticsViews(env)).find((item) => item.id === state.config.saved_view_id);
      if (view) filters = savedFilters(view.filters);
    }
    const body = analyticsCsv(await getAnalyticsSummary(env, filters));
    const size = new TextEncoder().encode(body).byteLength;
    await env.BACKUPS.put(key, body, { httpMetadata: { contentType: 'text/csv; charset=utf-8' }, customMetadata: { type: 'analytics-report', created_at: createdAt } });
    record = { key, created_at: createdAt, status: 'completed', size };
  } catch (error) {
    record = { key, created_at: createdAt, status: 'failed', size: null, error: error instanceof Error ? error.message : String(error) };
  }
  await setSetting(env, RECORDS_KEY, JSON.stringify([record, ...state.records].slice(0, 30)), createdAt);
  return record;
}

function savedFilters(filters: Record<string, string | number>): AnalyticsFilters {
  const map: Record<string, string> = { link_id:'linkId', utm_source:'utmSource', utm_medium:'utmMedium', utm_campaign:'utmCampaign', utm_term:'utmTerm', utm_content:'utmContent' };
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filters)) output[map[key] ?? key] = value;
  return output as AnalyticsFilters;
}

import type { ConversionEvent, Link, Visit, VisitTarget } from '@linketry/shared';
import type { Env } from '../types';
import type { TrafficAnomalyMetrics } from '../analytics/trafficAnomalyPolicy';
import {
  calculateConversionEventRate,
  conversionAttributionAvailable,
} from '../analytics/conversionPolicy';
import {
  createAnalyticsRange,
  createPreviousAnalyticsRange,
  fillDailyAnalytics,
  localDateSql,
  parseTimezoneOffset,
  type AnalyticsRange,
  type DailyAnalyticsPoint,
} from '../analytics/timeRange';
import {
  getAnalyticsTrafficInsights,
  type AnalyticsPeriodSnapshot,
  type HourlyHeatmapPoint,
} from './analyticsTrafficInsights';
import {
  legacyTopCountries,
  normalizeGeography,
  type CountryTraffic,
  type GeographySummary,
} from '../analytics/geography';

export interface AnalyticsFilters {
  days?: number;
  timezoneOffsetMinutes?: number;
  linkId?: string;
  slug?: string;
  domain?: string;
  tag?: string;
  campaign?: string;
  project?: string;
  country?: string;
  device?: string;
  browser?: string;
  referer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
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
  daily: DailyAnalyticsPoint[];
  previousPeriod: AnalyticsPeriodSnapshot;
  hourlyHeatmap: HourlyHeatmapPoint[];
  topLinks: Array<{
    id?: string | null;
    slug: string;
    domain?: string | null;
    title?: string | null;
    clicks: number;
  }>;
  topCountries: Array<{ country: string; clicks: number }>;
  geography: GeographySummary;
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

const LINK_JOIN = `LEFT JOIN links l ON (
  l.id = v.link_id OR (v.link_id IS NULL AND l.slug = v.slug AND COALESCE(l.domain, '') = COALESCE(v.domain, ''))
)`;
const CONVERSION_LINK_JOIN = `LEFT JOIN links l ON (
  l.id = ce.link_id OR (ce.link_id IS NULL AND l.slug = ce.slug AND COALESCE(l.domain, '') = COALESCE(ce.domain, ''))
)`;

export function parseAnalyticsFilters(
  query: (key: string) => string | undefined
): AnalyticsFilters {
  const days = parseInt(query('days') ?? '30', 10);
  return {
    days: Number.isFinite(days) ? days : 30,
    timezoneOffsetMinutes: parseTimezoneOffset(query('timezone_offset')),
    linkId: clean(query('link_id')),
    slug: clean(query('slug')),
    domain: clean(query('domain'))?.toLowerCase(),
    tag: clean(query('tag')),
    campaign: clean(query('campaign')),
    project: clean(query('project')),
    country: clean(query('country'))?.toUpperCase(),
    device: clean(query('device'))?.toLowerCase(),
    browser: clean(query('browser'))?.toLowerCase(),
    referer: clean(query('referer')),
    utmSource: clean(query('utm_source')),
    utmMedium: clean(query('utm_medium')),
    utmCampaign: clean(query('utm_campaign')),
    utmTerm: clean(query('utm_term')),
    utmContent: clean(query('utm_content')),
  };
}

export async function getAnalyticsSummary(
  env: Env,
  options: AnalyticsFilters = {}
): Promise<AnalyticsSummary> {
  const range = createAnalyticsRange(options.days ?? 30, options.timezoneOffsetMinutes ?? 0);
  const days = range.days;
  const filter = buildVisitFilter(options, range);
  const fromVisits = `FROM visits v ${LINK_JOIN} WHERE ${filter.where}`;
  const previousRange = createPreviousAnalyticsRange(range);
  const previousFilter = buildVisitFilter(options, previousRange);
  const previousFromVisits = `FROM visits v ${LINK_JOIN} WHERE ${previousFilter.where}`;
  const dailyDate = localDateSql('v.created_at', range.timezoneOffsetMinutes);

  const [
    totalClicks,
    botClicks,
    uniqueVisitors,
    uniqueLinks,
    daily,
    topLinks,
    countryRows,
    topReferrers,
    topBrowsers,
    topDevices,
    topOperatingSystems,
    recentVisits,
    utmRows,
    topTargets,
    conversionStats,
    trafficInsights,
  ] = await Promise.all([
    firstCount(env, `SELECT COUNT(*) as count ${fromVisits}`, filter.params),
    firstCount(env, `SELECT COUNT(*) as count ${fromVisits} AND v.is_bot = 1`, filter.params),
    firstCount(
      env,
      `SELECT COUNT(DISTINCT v.ip_hash) as count ${fromVisits} AND v.ip_hash IS NOT NULL AND v.ip_hash != ''`,
      filter.params
    ),
    firstCount(
      env,
      `SELECT COUNT(DISTINCT COALESCE(v.link_id, v.slug)) as count ${fromVisits}`,
      filter.params
    ),
    allRows<DailyAnalyticsPoint>(
      env,
      `SELECT ${dailyDate} as date,
        COUNT(*) as clicks,
        COALESCE(SUM(CASE WHEN COALESCE(v.is_bot, 0) = 0 THEN 1 ELSE 0 END), 0) as humanClicks,
        COALESCE(SUM(CASE WHEN v.is_bot = 1 THEN 1 ELSE 0 END), 0) as botClicks,
        COUNT(DISTINCT CASE WHEN v.ip_hash IS NOT NULL AND v.ip_hash != '' THEN v.ip_hash END) as uniqueVisitors
       ${fromVisits} GROUP BY ${dailyDate} ORDER BY date ASC`,
      filter.params
    ),
    allRows<{
      id?: string | null;
      slug: string;
      domain?: string | null;
      title?: string | null;
      clicks: number;
    }>(
      env,
      `SELECT COALESCE(v.link_id, l.id) as id, v.slug, COALESCE(v.domain, l.domain) as domain, l.title, COUNT(*) as clicks ${fromVisits} GROUP BY COALESCE(v.link_id, l.id), v.slug, COALESCE(v.domain, l.domain), l.title ORDER BY clicks DESC LIMIT 10`,
      filter.params
    ),
    allRows<CountryTraffic>(
      env,
      `SELECT UPPER(TRIM(COALESCE(v.country, ''))) as country, COUNT(*) as clicks
       ${fromVisits}
       GROUP BY UPPER(TRIM(COALESCE(v.country, '')))
       ORDER BY clicks DESC LIMIT 250`,
      filter.params
    ),
    topDimension(env, "COALESCE(v.referer, 'Direct')", 'referer', fromVisits, filter.params),
    topDimension(env, "COALESCE(v.browser, 'Other')", 'browser', fromVisits, filter.params),
    topDimension(
      env,
      "COALESCE(v.device_type, 'unknown')",
      'device_type',
      fromVisits,
      filter.params
    ),
    topDimension(env, "COALESCE(v.os, 'Other')", 'os', fromVisits, filter.params),
    allRows<Visit>(
      env,
      `SELECT v.* ${fromVisits} ORDER BY v.created_at DESC LIMIT 20`,
      filter.params
    ),
    allRows<{ long_url: string; clicks: number }>(
      env,
      `SELECT l.long_url, COUNT(*) as clicks ${fromVisits} AND l.long_url IS NOT NULL GROUP BY l.long_url ORDER BY clicks DESC LIMIT 300`,
      filter.params
    ),
    getTopTargets(env, filter),
    getConversionStats(env, options, range),
    getAnalyticsTrafficInsights(env, {
      currentFrom: fromVisits,
      currentParams: filter.params,
      previousFrom: previousFromVisits,
      previousParams: previousFilter.params,
      currentRange: range,
      previousRange,
    }),
  ]);
  const eligibleClicks = Math.max(0, totalClicks - botClicks);
  const hasConversionAttribution = conversionAttributionAvailable(options);
  const geography = normalizeGeography(countryRows);

  return {
    days,
    timezoneOffsetMinutes: range.timezoneOffsetMinutes,
    rangeStart: range.start,
    rangeEnd: range.end,
    totalClicks,
    botClicks,
    uniqueVisitors,
    uniqueLinks,
    eligibleClicks,
    conversionsTotal: hasConversionAttribution ? conversionStats.total : null,
    conversionRate: calculateConversionEventRate(
      conversionStats.total,
      totalClicks,
      botClicks,
      hasConversionAttribution
    ),
    conversionAttributionAvailable: hasConversionAttribution,
    daily: fillDailyAnalytics(daily, range),
    previousPeriod: trafficInsights.previousPeriod,
    hourlyHeatmap: trafficInsights.hourlyHeatmap,
    topLinks,
    topCountries: legacyTopCountries(geography),
    geography,
    topReferrers: topReferrers as AnalyticsSummary['topReferrers'],
    topBrowsers: topBrowsers as AnalyticsSummary['topBrowsers'],
    topDevices: topDevices as AnalyticsSummary['topDevices'],
    topOperatingSystems: topOperatingSystems as AnalyticsSummary['topOperatingSystems'],
    topUtmSources: topUtmValues(utmRows, 'utm_source'),
    topUtmMediums: topUtmValues(utmRows, 'utm_medium'),
    topUtmCampaigns: topUtmValues(utmRows, 'utm_campaign'),
    topUtmTerms: topUtmValues(utmRows, 'utm_term'),
    topUtmContents: topUtmValues(utmRows, 'utm_content'),
    topTargets,
    topConversionEvents: conversionStats.events,
    conversionValues: conversionStats.values,
    recentVisits,
  };
}

export async function getLinkAnalytics(
  env: Env,
  id: string,
  options: AnalyticsFilters = {}
): Promise<{ link: Link | null; summary: AnalyticsSummary }> {
  const link = await env.DB.prepare('SELECT * FROM links WHERE id = ? LIMIT 1')
    .bind(id)
    .first<Link>();
  return {
    link: link ?? null,
    summary: await getAnalyticsSummary(env, { ...options, linkId: id }),
  };
}

export async function insertVisitTarget(env: Env, target: VisitTarget): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO visit_targets (visit_id, link_id, slug, domain, target_url, redirect_rule_id, redirect_rule_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      target.visit_id,
      target.link_id ?? null,
      target.slug,
      target.domain ?? null,
      target.target_url,
      target.redirect_rule_id ?? null,
      target.redirect_rule_type ?? null,
      target.created_at
    )
    .run();
}

export async function createConversionEvent(env: Env, event: ConversionEvent): Promise<boolean> {
  const result = await env.DB.prepare(
    `INSERT OR IGNORE INTO conversion_events (id, link_id, slug, domain, event_name, value, currency, metadata, ip_hash, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      event.id,
      event.link_id ?? null,
      event.slug,
      event.domain ?? null,
      event.event_name,
      event.value ?? null,
      event.currency ?? null,
      event.metadata ?? null,
      event.ip_hash ?? null,
      event.user_agent ?? null,
      event.created_at
    )
    .run();
  return Number(result.meta.changes ?? 0) > 0;
}

export async function cleanupAnalyticsRetention(
  env: Env
): Promise<{ retentionDays: number; cutoff?: string }> {
  const setting = await env.DB.prepare('SELECT value FROM settings WHERE key = ? LIMIT 1')
    .bind('analytics_retention_days')
    .first<{ value?: string | null }>();
  const retentionDays = parseInt(setting?.value ?? '0', 10);
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return { retentionDays: 0 };

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare('DELETE FROM visits WHERE created_at < ?').bind(cutoff).run();
  await env.DB.prepare('DELETE FROM daily_stats WHERE date < ?').bind(cutoff.slice(0, 10)).run();
  await safeRun(env, 'DELETE FROM visit_targets WHERE created_at < ?', [cutoff]);
  await safeRun(env, 'DELETE FROM conversion_events WHERE created_at < ?', [cutoff]);
  return { retentionDays, cutoff };
}

export async function getTrafficAnomalyMetrics(
  env: Env,
  evaluatedAt: string
): Promise<TrafficAnomalyMetrics> {
  const evaluatedAtMs = Date.parse(evaluatedAt);
  if (!Number.isFinite(evaluatedAtMs))
    throw new Error('Traffic anomaly evaluation time is invalid');

  const currentStart = new Date(evaluatedAtMs - 24 * 60 * 60 * 1000).toISOString();
  const baselineStart = new Date(evaluatedAtMs - 8 * 24 * 60 * 60 * 1000).toISOString();
  const row = await env.DB.prepare(
    `SELECT
       COALESCE(SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END), 0) AS current_visits,
       COALESCE(SUM(CASE WHEN created_at >= ? AND is_bot = 1 THEN 1 ELSE 0 END), 0) AS current_bot_visits,
       COALESCE(SUM(CASE WHEN created_at < ? THEN 1 ELSE 0 END), 0) AS baseline_visits,
       COALESCE(SUM(CASE WHEN created_at < ? AND is_bot = 1 THEN 1 ELSE 0 END), 0) AS baseline_bot_visits
     FROM visits
     WHERE created_at >= ? AND created_at < ?`
  )
    .bind(currentStart, currentStart, currentStart, currentStart, baselineStart, evaluatedAt)
    .first<{
      current_visits: number;
      current_bot_visits: number;
      baseline_visits: number;
      baseline_bot_visits: number;
    }>();

  return {
    evaluatedAt,
    currentStart,
    baselineStart,
    currentVisits: Number(row?.current_visits ?? 0),
    currentBotVisits: Number(row?.current_bot_visits ?? 0),
    baselineVisits: Number(row?.baseline_visits ?? 0),
    baselineBotVisits: Number(row?.baseline_bot_visits ?? 0),
  };
}

function buildVisitFilter(
  options: AnalyticsFilters,
  range: AnalyticsRange
): { where: string; params: unknown[] } {
  const conditions = ['v.created_at >= ?', 'v.created_at < ?'];
  const params: unknown[] = [range.start, range.end];
  addCommonFilters(conditions, params, options, 'v');
  return { where: conditions.join(' AND '), params };
}

function buildConversionFilter(
  options: AnalyticsFilters,
  range: AnalyticsRange
): { where: string; params: unknown[] } {
  const conditions = ['ce.created_at >= ?', 'ce.created_at < ?'];
  const params: unknown[] = [range.start, range.end];
  addCommonFilters(conditions, params, options, 'ce');
  return { where: conditions.join(' AND '), params };
}

function addCommonFilters(
  conditions: string[],
  params: unknown[],
  options: AnalyticsFilters,
  alias: 'v' | 'ce'
): void {
  if (options.linkId) {
    conditions.push(`${alias}.link_id = ?`);
    params.push(options.linkId);
  }
  if (options.slug) {
    conditions.push(`${alias}.slug = ?`);
    params.push(options.slug);
  }
  if (options.domain) {
    conditions.push(`COALESCE(${alias}.domain, l.domain, '') = ?`);
    params.push(options.domain);
  }
  if (options.tag) addTagFilter(conditions, params, options.tag);
  if (options.campaign) addTagFilter(conditions, params, groupTag('campaign', options.campaign));
  if (options.project) addTagFilter(conditions, params, groupTag('project', options.project));
  if (options.country && alias === 'v') {
    conditions.push('v.country = ?');
    params.push(options.country);
  }
  if (options.device && alias === 'v') {
    conditions.push("LOWER(COALESCE(v.device_type, '')) = ?");
    params.push(options.device);
  }
  if (options.browser && alias === 'v') {
    conditions.push("LOWER(COALESCE(v.browser, '')) = ?");
    params.push(options.browser);
  }
  if (options.referer && alias === 'v') {
    conditions.push('v.referer LIKE ?');
    params.push(`%${options.referer}%`);
  }
  addUtmFilter(conditions, params, 'utm_source', options.utmSource);
  addUtmFilter(conditions, params, 'utm_medium', options.utmMedium);
  addUtmFilter(conditions, params, 'utm_campaign', options.utmCampaign);
  addUtmFilter(conditions, params, 'utm_term', options.utmTerm);
  addUtmFilter(conditions, params, 'utm_content', options.utmContent);
}

function addTagFilter(conditions: string[], params: unknown[], tag: string): void {
  conditions.push('l.tags LIKE ?');
  params.push(`%"${tag}"%`);
}

function addUtmFilter(conditions: string[], params: unknown[], key: string, value?: string): void {
  if (!value) return;
  const encoded = encodeURIComponent(value);
  conditions.push('(l.long_url LIKE ? OR l.long_url LIKE ?)');
  params.push(`%${key}=${value}%`, `%${key}=${encoded}%`);
}

async function getTopTargets(
  env: Env,
  filter: { where: string; params: unknown[] }
): Promise<AnalyticsSummary['topTargets']> {
  return safeAll(
    env,
    `SELECT vt.target_url, vt.redirect_rule_id, vt.redirect_rule_type, COUNT(*) as clicks FROM visits v JOIN visit_targets vt ON vt.visit_id = v.id ${LINK_JOIN} WHERE ${filter.where} GROUP BY vt.target_url, vt.redirect_rule_id, vt.redirect_rule_type ORDER BY clicks DESC LIMIT 10`,
    filter.params
  );
}

async function getConversionStats(
  env: Env,
  options: AnalyticsFilters,
  range: AnalyticsRange
): Promise<{
  total: number;
  events: AnalyticsSummary['topConversionEvents'];
  values: AnalyticsSummary['conversionValues'];
}> {
  if (!conversionAttributionAvailable(options)) return { total: 0, events: [], values: [] };
  const filter = buildConversionFilter(options, range);
  const from = `FROM conversion_events ce ${CONVERSION_LINK_JOIN} WHERE ${filter.where}`;
  const [total, events, values] = await Promise.all([
    safeFirstCount(env, `SELECT COUNT(*) as count ${from}`, filter.params),
    safeAll<AnalyticsSummary['topConversionEvents'][number]>(
      env,
      `SELECT ce.event_name, ce.currency, COUNT(*) as conversions, COALESCE(SUM(ce.value), 0) as value_total ${from} GROUP BY ce.event_name, ce.currency ORDER BY conversions DESC LIMIT 10`,
      filter.params
    ),
    safeAll<AnalyticsSummary['conversionValues'][number]>(
      env,
      `SELECT ce.currency, COUNT(*) as conversions, COALESCE(SUM(ce.value), 0) as value_total ${from} AND ce.value IS NOT NULL GROUP BY ce.currency ORDER BY ABS(COALESCE(SUM(ce.value), 0)) DESC LIMIT 20`,
      filter.params
    ),
  ]);
  return { total, events, values };
}

async function firstCount(env: Env, sql: string, params: unknown[]): Promise<number> {
  const row = await env.DB.prepare(sql)
    .bind(...params)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

async function safeFirstCount(env: Env, sql: string, params: unknown[]): Promise<number> {
  try {
    return await firstCount(env, sql, params);
  } catch {
    return 0;
  }
}

async function allRows<T>(env: Env, sql: string, params: unknown[]): Promise<T[]> {
  const rows = await env.DB.prepare(sql)
    .bind(...params)
    .all<T>();
  return rows.results ?? [];
}

async function safeAll<T>(env: Env, sql: string, params: unknown[]): Promise<T[]> {
  try {
    return await allRows<T>(env, sql, params);
  } catch {
    return [];
  }
}

async function safeRun(env: Env, sql: string, params: unknown[]): Promise<void> {
  try {
    await env.DB.prepare(sql)
      .bind(...params)
      .run();
  } catch {
    /* New analytics tables may not exist yet. */
  }
}

function topDimension(
  env: Env,
  expression: string,
  alias: string,
  fromVisits: string,
  params: unknown[]
): Promise<Array<Record<string, string | number>>> {
  return allRows(
    env,
    `SELECT ${expression} as ${alias}, COUNT(*) as clicks ${fromVisits} GROUP BY ${expression} ORDER BY clicks DESC LIMIT 10`,
    params
  );
}

function topUtmValues(
  rows: Array<{ long_url: string; clicks: number }>,
  key: string
): Array<{ value: string; clicks: number }> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const value = readUtm(row.long_url, key);
    if (value) totals.set(value, (totals.get(value) ?? 0) + row.clicks);
  }
  return [...totals.entries()]
    .map(([value, clicks]) => ({ value, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);
}

function readUtm(url: string, key: string): string | null {
  try {
    return new URL(url).searchParams.get(key);
  } catch {
    return null;
  }
}

function groupTag(type: 'campaign' | 'project', value: string): string {
  return value.toLowerCase().startsWith(`${type}:`) ? value : `${type}:${value}`;
}

function clean(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

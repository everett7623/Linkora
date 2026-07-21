import type { Env } from '../types';
import {
  fillDailyAnalytics,
  localDateSql,
  localHourSql,
  localWeekdaySql,
  type AnalyticsRange,
  type DailyAnalyticsPoint,
} from '../analytics/timeRange';

export interface AnalyticsPeriodSnapshot {
  rangeStart: string;
  rangeEnd: string;
  totalClicks: number;
  humanClicks: number;
  botClicks: number;
  uniqueVisitors: number;
  daily: DailyAnalyticsPoint[];
}

export interface HourlyHeatmapPoint {
  weekday: number;
  hour: number;
  clicks: number;
  humanClicks: number;
  botClicks: number;
}

interface TrafficInsightsQuery {
  currentFrom: string;
  currentParams: unknown[];
  previousFrom: string;
  previousParams: unknown[];
  currentRange: AnalyticsRange;
  previousRange: AnalyticsRange;
}

export async function getAnalyticsTrafficInsights(
  env: Env,
  query: TrafficInsightsQuery
): Promise<{ previousPeriod: AnalyticsPeriodSnapshot; hourlyHeatmap: HourlyHeatmapPoint[] }> {
  const previousDate = localDateSql('v.created_at', query.previousRange.timezoneOffsetMinutes);
  const localHour = localHourSql('v.created_at', query.currentRange.timezoneOffsetMinutes);
  const localWeekday = localWeekdaySql('v.created_at', query.currentRange.timezoneOffsetMinutes);
  const [previousTotals, previousDaily, heatmapRows] = await Promise.all([
    firstRow<PeriodTotals>(
      env,
      `SELECT COUNT(*) as totalClicks,
        COALESCE(SUM(CASE WHEN COALESCE(v.is_bot, 0) = 0 THEN 1 ELSE 0 END), 0) as humanClicks,
        COALESCE(SUM(CASE WHEN v.is_bot = 1 THEN 1 ELSE 0 END), 0) as botClicks,
        COUNT(DISTINCT CASE WHEN v.ip_hash IS NOT NULL AND v.ip_hash != '' THEN v.ip_hash END) as uniqueVisitors
       ${query.previousFrom}`,
      query.previousParams
    ),
    allRows<DailyAnalyticsPoint>(
      env,
      `SELECT ${previousDate} as date,
        COUNT(*) as clicks,
        COALESCE(SUM(CASE WHEN COALESCE(v.is_bot, 0) = 0 THEN 1 ELSE 0 END), 0) as humanClicks,
        COALESCE(SUM(CASE WHEN v.is_bot = 1 THEN 1 ELSE 0 END), 0) as botClicks,
        COUNT(DISTINCT CASE WHEN v.ip_hash IS NOT NULL AND v.ip_hash != '' THEN v.ip_hash END) as uniqueVisitors
       ${query.previousFrom} GROUP BY ${previousDate} ORDER BY date ASC`,
      query.previousParams
    ),
    allRows<HourlyHeatmapPoint>(
      env,
      `SELECT ${localWeekday} as weekday, ${localHour} as hour,
        COUNT(*) as clicks,
        COALESCE(SUM(CASE WHEN COALESCE(v.is_bot, 0) = 0 THEN 1 ELSE 0 END), 0) as humanClicks,
        COALESCE(SUM(CASE WHEN v.is_bot = 1 THEN 1 ELSE 0 END), 0) as botClicks
       ${query.currentFrom}
       GROUP BY ${localWeekday}, ${localHour} ORDER BY weekday ASC, hour ASC`,
      query.currentParams
    ),
  ]);

  return {
    previousPeriod: {
      rangeStart: query.previousRange.start,
      rangeEnd: query.previousRange.end,
      totalClicks: Number(previousTotals?.totalClicks ?? 0),
      humanClicks: Number(previousTotals?.humanClicks ?? 0),
      botClicks: Number(previousTotals?.botClicks ?? 0),
      uniqueVisitors: Number(previousTotals?.uniqueVisitors ?? 0),
      daily: fillDailyAnalytics(previousDaily, query.previousRange),
    },
    hourlyHeatmap: fillHourlyHeatmap(heatmapRows),
  };
}

interface PeriodTotals {
  totalClicks: number;
  humanClicks: number;
  botClicks: number;
  uniqueVisitors: number;
}

function fillHourlyHeatmap(rows: HourlyHeatmapPoint[]): HourlyHeatmapPoint[] {
  const byBucket = new Map(
    rows
      .filter((row) => row.weekday >= 0 && row.weekday <= 6 && row.hour >= 0 && row.hour <= 23)
      .map((row) => [`${row.weekday}:${row.hour}`, row])
  );
  return Array.from({ length: 7 * 24 }, (_, index) => {
    const weekday = Math.floor(index / 24);
    const hour = index % 24;
    const row = byBucket.get(`${weekday}:${hour}`);
    return {
      weekday,
      hour,
      clicks: Number(row?.clicks ?? 0),
      humanClicks: Number(row?.humanClicks ?? 0),
      botClicks: Number(row?.botClicks ?? 0),
    };
  });
}

async function firstRow<T>(env: Env, sql: string, params: unknown[]): Promise<T | null> {
  return env.DB.prepare(sql)
    .bind(...params)
    .first<T>();
}

async function allRows<T>(env: Env, sql: string, params: unknown[]): Promise<T[]> {
  const rows = await env.DB.prepare(sql)
    .bind(...params)
    .all<T>();
  return rows.results ?? [];
}

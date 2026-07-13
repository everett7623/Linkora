import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { getAllLinks, getAllVisits } from '../db/index';
import { getAnalyticsSummary, parseAnalyticsFilters, type AnalyticsSummary } from '../db/analytics';
import { buildBackupPayload } from '../backups/index';
import type { Link, Visit } from '@linkora/shared';

const exportRoutes = new Hono<{ Bindings: Env }>();

exportRoutes.use('*', async (c, next) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  await next();
});

exportRoutes.get('/links.csv', async (c) => {
  const links = await getAllLinks(c.env);
  const header = 'id,slug,long_url,short_url,title,tags,status,clicks,redirect_type,source,created_at,updated_at,last_clicked_at,expires_at,max_clicks\r\n';
  const rows = links.map((l: Link) => [
    csv(l.id),
    csv(l.slug),
    csv(l.long_url),
    csv(l.short_url ?? ''),
    csv(l.title ?? ''),
    csv(l.tags ?? ''),
    csv(l.status),
    l.clicks,
    l.redirect_type,
    csv(l.source ?? ''),
    csv(l.created_at),
    csv(l.updated_at),
    csv(l.last_clicked_at ?? ''),
    csv(l.expires_at ?? ''),
    l.max_clicks ?? '',
  ].join(','));

  const today = new Date().toISOString().slice(0, 10);
  return new Response(header + rows.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="linkora-links-${today}.csv"`,
    },
  });
});

exportRoutes.get('/links.json', async (c) => {
  const links = await getAllLinks(c.env);
  const today = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(links, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="linkora-links-${today}.json"`,
    },
  });
});

exportRoutes.get('/visits.csv', async (c) => {
  const visits = await getAllVisits(c.env);
  const header = 'id,link_id,slug,domain,referer,country,user_agent,browser,os,device_type,ip_hash,is_bot,created_at\r\n';
  const rows = visits.map((v: Visit) => [
    csv(v.id),
    csv(v.link_id),
    csv(v.slug),
    csv(v.domain),
    csv(v.referer),
    csv(v.country),
    csv(v.user_agent),
    csv(v.browser),
    csv(v.os),
    csv(v.device_type),
    csv(v.ip_hash),
    csv(v.is_bot),
    csv(v.created_at),
  ].join(','));

  const today = new Date().toISOString().slice(0, 10);
  return new Response(header + rows.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="linkora-visits-${today}.csv"`,
    },
  });
});

exportRoutes.get('/analytics.csv', async (c) => {
  const summary = await getAnalyticsSummary(c.env, parseAnalyticsFilters((key) => c.req.query(key)));
  const today = new Date().toISOString().slice(0, 10);
  return new Response(analyticsCsv(summary), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="linkora-analytics-${today}.csv"`,
    },
  });
});

exportRoutes.get('/backup.json', async (c) => {
  const backup = await buildBackupPayload(c.env);
  const today = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="linkora-backup-${today}.json"`,
    },
  });
});

function csv(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function analyticsCsv(summary: AnalyticsSummary): string {
  const rows: Array<Array<string | number | null | undefined>> = [
    ['section', 'label', 'value', 'extra'],
    ['summary', 'days', summary.days, ''],
    ['summary', 'total_clicks', summary.totalClicks, ''],
    ['summary', 'unique_visitors', summary.uniqueVisitors, ''],
    ['summary', 'unique_links', summary.uniqueLinks, ''],
    ['summary', 'bot_clicks', summary.botClicks, ''],
    ['summary', 'conversions_total', summary.conversionsTotal, ''],
    ['summary', 'conversion_rate_percent', summary.conversionRate, ''],
  ];

  for (const item of summary.daily) rows.push(['daily', item.date, item.clicks, 'clicks']);
  for (const item of summary.topLinks) rows.push(['top_links', item.slug, item.clicks, item.title ?? item.domain ?? '']);
  for (const item of summary.topCountries) rows.push(['top_countries', item.country, item.clicks, 'clicks']);
  for (const item of summary.topReferrers) rows.push(['top_referrers', item.referer, item.clicks, 'clicks']);
  for (const item of summary.topBrowsers) rows.push(['top_browsers', item.browser, item.clicks, 'clicks']);
  for (const item of summary.topDevices) rows.push(['top_devices', item.device_type, item.clicks, 'clicks']);
  for (const item of summary.topOperatingSystems) rows.push(['top_operating_systems', item.os, item.clicks, 'clicks']);
  for (const item of summary.topUtmSources) rows.push(['utm_source', item.value, item.clicks, 'clicks']);
  for (const item of summary.topUtmMediums) rows.push(['utm_medium', item.value, item.clicks, 'clicks']);
  for (const item of summary.topUtmCampaigns) rows.push(['utm_campaign', item.value, item.clicks, 'clicks']);
  for (const item of summary.topUtmTerms) rows.push(['utm_term', item.value, item.clicks, 'clicks']);
  for (const item of summary.topUtmContents) rows.push(['utm_content', item.value, item.clicks, 'clicks']);
  for (const item of summary.topTargets) rows.push(['redirect_targets', item.target_url, item.clicks, item.redirect_rule_type ?? 'default']);
  for (const item of summary.topConversionEvents) rows.push(['conversion_events', item.event_name, item.conversions, item.value_total]);

  return rows.map((row) => row.map(csv).join(',')).join('\r\n');
}

export default exportRoutes;

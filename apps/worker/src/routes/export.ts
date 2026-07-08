import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { getAllLinks, getAllVisits } from '../db/index';
import { buildBackupPayload } from '../backups/index';
import type { Link, Visit } from '@linkora/shared';

const exportRoutes = new Hono<{ Bindings: Env }>();

exportRoutes.use('*', async (c, next) => {
  const authError = requireAuth(c);
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

export default exportRoutes;

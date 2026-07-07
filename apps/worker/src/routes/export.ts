import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { getAllLinks, getAllTags, getSettings } from '../db/index';
import type { Link } from '@linkora/shared';

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

exportRoutes.get('/backup.json', async (c) => {
  const [links, tags, settings] = await Promise.all([
    getAllLinks(c.env),
    getAllTags(c.env),
    getSettings(c.env),
  ]);

  const backup = {
    name: 'Linkora Backup',
    version: '0.1.0',
    exportedAt: new Date().toISOString(),
    links,
    tags,
    settings,
  };

  const today = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="linkora-backup-${today}.json"`,
    },
  });
});

function csv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default exportRoutes;

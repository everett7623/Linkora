import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { getLinkById } from '../db/index';
import { getAnalyticsSummary } from '../db/analytics';
import { jsonError, jsonOk } from '../utils/response';
import { createPublicStatsShare, deletePublicStatsShare, findPublicStatsShare, listPublicStatsShares } from '../publicStats/index';

const routes = new Hono<{ Bindings: Env }>();

routes.get('/api/public-stats/links/:id', async (c) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  const share = (await listPublicStatsShares(c.env)).find((item) => item.link_id === c.req.param('id'));
  return jsonOk(share ? publicConfig(share) : { enabled: false });
});

routes.post('/api/public-stats/links/:id', async (c) => {
  const authError = await requireAuth(c, 'admin');
  if (authError) return authError;
  const link = await getLinkById(c.env, c.req.param('id'));
  if (!link) return jsonError('Link not found', 404);
  let body: { days?: unknown; show_countries?: unknown; show_referrers?: unknown };
  try { body = await c.req.json(); } catch { return jsonError('Invalid JSON body', 400); }
  const created = await createPublicStatsShare(c.env, link.id, {
    days: Number(body.days),
    show_countries: body.show_countries === true,
    show_referrers: body.show_referrers === true,
  });
  return jsonOk({ ...publicConfig(created.share), token: created.token });
});

routes.delete('/api/public-stats/links/:id', async (c) => {
  const authError = await requireAuth(c, 'admin');
  if (authError) return authError;
  await deletePublicStatsShare(c.env, c.req.param('id'));
  return jsonOk({ enabled: false });
});

routes.get('/stats/:token', async (c) => {
  const share = await findPublicStatsShare(c.env, c.req.param('token'));
  if (!share) return new Response('Not found', { status: 404 });
  const link = await getLinkById(c.env, share.link_id);
  if (!link) return new Response('Not found', { status: 404 });
  const summary = await getAnalyticsSummary(c.env, { linkId: link.id, days: share.days });
  return new Response(renderPublicStats(link.slug, link.title, summary, share), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });
});

function publicConfig(share: { days: number; show_countries: boolean; show_referrers: boolean; created_at: string }) {
  return { enabled: true, days: share.days, show_countries: share.show_countries, show_referrers: share.show_referrers, created_at: share.created_at };
}

function escape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderPublicStats(slug: string, title: string | null | undefined, summary: Awaited<ReturnType<typeof getAnalyticsSummary>>, share: { show_countries: boolean; show_referrers: boolean }): string {
  const bars = summary.daily.map((item) => `<tr><td>${escape(item.date)}</td><td>${item.clicks}</td></tr>`).join('');
  const list = (items: Array<{ label: string; clicks: number }>) => `<ul>${items.map((item) => `<li><span>${escape(item.label)}</span><strong>${item.clicks}</strong></li>`).join('')}</ul>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escape(title || `/${slug}`)} statistics</title><style>*{box-sizing:border-box}body{margin:0;background:#0f172a;color:#e2e8f0;font:15px system-ui,sans-serif}.wrap{width:min(860px,calc(100% - 32px));margin:48px auto}h1{font-size:24px}p{color:#94a3b8}.metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:24px 0}.metric,section{border:1px solid #334155;background:#111827;padding:18px}.metric strong{display:block;font-size:28px;margin-top:6px}section{margin-top:16px}table{width:100%;border-collapse:collapse}td{padding:8px;border-top:1px solid #1e293b}td:last-child{text-align:right}ul{list-style:none;padding:0;margin:0}li{display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid #1e293b}@media(max-width:560px){.metrics{grid-template-columns:1fr}}</style></head><body><main class="wrap"><h1>${escape(title || `/${slug}`)}</h1><p>Privacy-safe statistics for the last ${summary.days} days.</p><div class="metrics"><div class="metric">Clicks<strong>${summary.totalClicks}</strong></div><div class="metric">Active days<strong>${summary.daily.filter((item) => item.clicks > 0).length}</strong></div></div><section><h2>Daily clicks</h2><table>${bars || '<tr><td>No clicks yet</td><td>0</td></tr>'}</table></section>${share.show_countries ? `<section><h2>Countries</h2>${list(summary.topCountries.map((item) => ({ label: item.country, clicks: item.clicks })))}</section>` : ''}${share.show_referrers ? `<section><h2>Referrers</h2>${list(summary.topReferrers.map((item) => ({ label: item.referer, clicks: item.clicks })))}</section>` : ''}</main></body></html>`;
}

export default routes;


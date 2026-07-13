import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { createScheduledAnalyticsReport, getAnalyticsReportState, saveAnalyticsReportConfig } from '../analytics/scheduledReports';
import { jsonError, jsonOk } from '../utils/response';

const routes = new Hono<{ Bindings: Env }>();
routes.use('*', async (c, next) => { const error = await requireAuth(c); if (error) return error; await next(); });
routes.get('/', async (c) => jsonOk(await getAnalyticsReportState(c.env)));
routes.put('/config', async (c) => {
  let body: { enabled?: unknown; days?: unknown; saved_view_id?: unknown };
  try { body = await c.req.json(); } catch { return jsonError('Invalid JSON body', 400); }
  try { return jsonOk(await saveAnalyticsReportConfig(c.env, { enabled: body.enabled === true, days: Number(body.days), saved_view_id: typeof body.saved_view_id === 'string' ? body.saved_view_id : null })); }
  catch (error) { return jsonError(error instanceof Error ? error.message : 'Invalid report config', 400); }
});
routes.post('/run', async (c) => { const record = await createScheduledAnalyticsReport(c.env, true); return record?.status === 'completed' ? jsonOk(record) : jsonError(record?.error ?? 'Report failed', 503); });
routes.get('/download', async (c) => {
  const key = c.req.query('key');
  if (!key?.startsWith('reports/') || !c.env.BACKUPS) return jsonError('Report not available', 404);
  const object = await c.env.BACKUPS.get(key); if (!object) return jsonError('Report not found', 404);
  return new Response(object.body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${key.split('/').pop()}"` } });
});
export default routes;

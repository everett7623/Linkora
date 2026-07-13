import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { createSavedAnalyticsView, deleteSavedAnalyticsView, listSavedAnalyticsViews } from '../analytics/savedViews';
import { jsonError, jsonOk } from '../utils/response';

const routes = new Hono<{ Bindings: Env }>();
routes.use('*', async (c, next) => { const error = await requireAuth(c); if (error) return error; await next(); });

routes.get('/', async (c) => jsonOk({ items: await listSavedAnalyticsViews(c.env) }));
routes.post('/', async (c) => {
  let body: { name?: unknown; filters?: unknown };
  try { body = await c.req.json(); } catch { return jsonError('Invalid JSON body', 400); }
  try { return jsonOk(await createSavedAnalyticsView(c.env, typeof body.name === 'string' ? body.name : '', body.filters)); }
  catch (error) { return jsonError(error instanceof Error ? error.message : 'Unable to save view', 400); }
});
routes.delete('/:id', async (c) => (await deleteSavedAnalyticsView(c.env, c.req.param('id'))) ? jsonOk({ deleted: true }) : jsonError('Saved view not found', 404));

export default routes;


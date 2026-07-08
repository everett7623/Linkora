import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { getAnalyticsSummary } from '../db/index';
import { jsonOk } from '../utils/response';

const analyticsRoutes = new Hono<{ Bindings: Env }>();

analyticsRoutes.use('*', async (c, next) => {
  const authError = requireAuth(c);
  if (authError) return authError;
  await next();
});

analyticsRoutes.get('/', async (c) => {
  const days = parseInt(c.req.query('days') ?? '30', 10);
  const summary = await getAnalyticsSummary(c.env, {
    days: Number.isFinite(days) ? days : 30,
  });
  return jsonOk(summary);
});

export default analyticsRoutes;

import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { listAuditLogs } from '../db/index';
import { jsonOk } from '../utils/response';

const audit = new Hono<{ Bindings: Env }>();

audit.use('*', async (c, next) => {
  const authError = requireAuth(c);
  if (authError) return authError;
  await next();
});

// GET /api/audit-logs
audit.get('/', async (c) => {
  const action = c.req.query('action');
  const targetType = c.req.query('target_type');
  const page = parseInt(c.req.query('page') ?? '1', 10);
  const pageSize = Math.min(parseInt(c.req.query('pageSize') ?? '50', 10), 200);

  const { items, total } = await listAuditLogs(c.env, {
    action: action ?? undefined,
    target_type: targetType ?? undefined,
    page,
    pageSize,
  });

  return jsonOk({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

export default audit;

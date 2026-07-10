import { Hono } from 'hono';
import type { DeploymentCapabilities } from '@linkora/shared';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { listDomains } from '../db/index';
import { jsonOk } from '../utils/response';

const systemRoutes = new Hono<{ Bindings: Env }>();

systemRoutes.use('*', async (c, next) => {
  const authError = await requireAuth(c, 'read');
  if (authError) return authError;
  await next();
});

systemRoutes.get('/capabilities', async (c) => {
  const domains = await listDomains(c.env);
  const r2Backups = Boolean(c.env.BACKUPS);
  const visitQueue = Boolean(c.env.VISITS_QUEUE);
  const multipleDomains = domains.length > 1;
  const capabilities: DeploymentCapabilities = {
    profile: r2Backups || visitQueue || multipleDomains ? 'advanced' : 'basic',
    core: { d1: true, kv: true },
    advanced: {
      r2Backups,
      visitQueue,
      configuredDomains: domains.length,
      multipleDomains,
    },
  };
  return jsonOk(capabilities);
});

export default systemRoutes;

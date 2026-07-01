import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { getSettings, setSetting } from '../db/index';
import { jsonOk, jsonError } from '../utils/response';
import { now } from '../utils/id';

const settings = new Hono<{ Bindings: Env }>();

settings.use('*', async (c, next) => {
  const authError = requireAuth(c);
  if (authError) return authError;
  await next();
});

settings.get('/', async (c) => {
  const allSettings = await getSettings(c.env);
  return jsonOk(allSettings);
});

settings.put('/', async (c) => {
  let body: Record<string, string>;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const ts = now();
  const updates: Promise<void>[] = [];
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      updates.push(setSetting(c.env, key, value, ts));
    }
  }
  await Promise.all(updates);

  return jsonOk({ message: 'Settings updated' });
});

export default settings;

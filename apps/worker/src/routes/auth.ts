import { Hono } from 'hono';
import type { Env } from '../types';
import { jsonOk, jsonError } from '../utils/response';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/login', async (c) => {
  try {
    const body = await c.req.json<{ token?: string }>();
    const token = body?.token;

    if (!token) {
      return jsonError('Token is required', 400);
    }

    if (!c.env.ADMIN_TOKEN || token !== c.env.ADMIN_TOKEN) {
      return jsonError('Invalid token', 401);
    }

    return jsonOk({ authenticated: true, message: 'Login successful' });
  } catch {
    return jsonError('Invalid request body', 400);
  }
});

auth.get('/me', (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonError('Unauthorized', 401);
  }
  const token = authHeader.slice(7);
  if (!c.env.ADMIN_TOKEN || token !== c.env.ADMIN_TOKEN) {
    return jsonError('Unauthorized', 401);
  }
  return jsonOk({ authenticated: true, role: 'admin' });
});

auth.post('/logout', (c) => {
  return jsonOk({ message: 'Logged out' });
});

export default auth;

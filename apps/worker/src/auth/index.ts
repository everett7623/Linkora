import type { Context } from 'hono';
import type { Env } from '../types';

export function requireAuth(c: Context<{ Bindings: Env }>): Response | null {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.slice(7);
  const adminToken = c.env.ADMIN_TOKEN;

  if (!adminToken || token !== adminToken) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null;
}

export function isAuthenticated(c: Context<{ Bindings: Env }>): boolean {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  return !!c.env.ADMIN_TOKEN && token === c.env.ADMIN_TOKEN;
}

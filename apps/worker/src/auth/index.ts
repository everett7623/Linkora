import type { Context } from 'hono';
import type { Env } from '../types';

/**
 * Constant-time string comparison to avoid leaking the admin token
 * through response-timing side channels.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  // Compare against a fixed length so the loop count does not reveal the
  // length of the expected token.
  const len = Math.max(bufA.length, bufB.length);
  let mismatch = bufA.length ^ bufB.length;
  for (let i = 0; i < len; i++) {
    mismatch |= (bufA[i] ?? 0) ^ (bufB[i] ?? 0);
  }
  return mismatch === 0;
}

function extractBearerToken(c: Context<{ Bindings: Env }>): string | null {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

export function requireAuth(c: Context<{ Bindings: Env }>): Response | null {
  if (isAuthenticated(c)) return null;
  return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function isAuthenticated(c: Context<{ Bindings: Env }>): boolean {
  const token = extractBearerToken(c);
  const adminToken = c.env.ADMIN_TOKEN;
  if (!token || !adminToken) return false;
  return timingSafeEqual(token, adminToken);
}

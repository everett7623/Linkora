import type { Context } from 'hono';
import type { Env } from '../types';
import type { ApiTokenScope } from '@linketry/shared';
import { getActiveApiTokenByHash, parseApiTokenScopes, touchApiTokenLastUsed } from '../db/index';
import { now, sha256 } from '../utils/id';
import { getAdminToken } from '../config/runtime';
import { isPublicReadOnlyDemo, isReadOnlyMethod } from '../demo/policy';

export async function requireAuth(
  c: Context<{ Bindings: Env }>,
  requiredScope = scopeForMethod(c.req.raw.method)
): Promise<Response | null> {
  if (isPublicReadOnlyDemo(c.env) && isReadOnlyMethod(c.req.raw.method)) {
    return null;
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return authError('Unauthorized', 401);
  }

  const token = authHeader.slice(7);
  const adminToken = getAdminToken(c.env);

  if (adminToken && token === adminToken) {
    return null;
  }

  const tokenHash = await sha256(token);
  const apiToken = await getActiveApiTokenByHash(c.env, tokenHash);
  if (!apiToken) return authError('Unauthorized', 401);

  const scopes = parseApiTokenScopes(apiToken.scopes);
  if (!hasScope(scopes, requiredScope)) {
    return authError('Forbidden', 403);
  }

  c.executionCtx.waitUntil(touchApiTokenLastUsed(c.env, apiToken.id, now()));
  return null;
}

export async function isAuthenticated(c: Context<{ Bindings: Env }>): Promise<boolean> {
  return (await requireAuth(c)) === null;
}

function scopeForMethod(method: string): ApiTokenScope {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS' ? 'read' : 'write';
}

function hasScope(scopes: ApiTokenScope[], requiredScope: ApiTokenScope): boolean {
  if (scopes.includes('admin')) return true;
  if (requiredScope === 'read') return scopes.includes('read') || scopes.includes('write');
  if (requiredScope === 'write') return scopes.includes('write');
  return false;
}

function authError(error: string, status: 401 | 403): Response {
  return new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function isAdminToken(c: Context<{ Bindings: Env }>): boolean {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  const adminToken = getAdminToken(c.env);
  return !!adminToken && token === adminToken;
}

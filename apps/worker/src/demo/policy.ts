import type { Env } from '../types';

const DEFAULT_RATE_LIMIT_PER_MINUTE = 120;
const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export interface DemoRateLimitResult {
  allowed: boolean;
  limit: number;
  retryAfterSeconds: number;
}

export function isPublicReadOnlyDemo(env: Pick<Env, 'LINKETRY_DEMO_MODE'>): boolean {
  return env.LINKETRY_DEMO_MODE?.trim().toLowerCase() === 'read-only';
}

export function isReadOnlyMethod(method: string): boolean {
  return READ_ONLY_METHODS.has(method.toUpperCase());
}

export async function checkDemoRateLimit(
  env: Pick<Env, 'DEMO_RATE_LIMITER'>,
  request: Request
): Promise<DemoRateLimitResult> {
  if (!env.DEMO_RATE_LIMITER) {
    throw new Error('Demo rate-limit binding is unavailable.');
  }

  const clientAddress =
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
    'unknown';
  const clientHash = await sha256(`linketry-demo:${clientAddress}`);
  const outcome = await env.DEMO_RATE_LIMITER.limit({ key: clientHash });
  return {
    allowed: outcome.success,
    limit: DEFAULT_RATE_LIMIT_PER_MINUTE,
    retryAfterSeconds: 60,
  };
}

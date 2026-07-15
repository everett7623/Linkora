import type { KVCacheEntry } from '@linketry/shared';
import type { Env } from '../types';

const KV_TTL = 60 * 60 * 24; // 24 hours

function kvKey(domain: string, slug: string): string {
  return `linketry:slug:${domain}:${slug}`;
}

export async function getCachedLink(
  env: Env,
  domain: string,
  slug: string
): Promise<KVCacheEntry | null> {
  try {
    const key = kvKey(domain, slug);
    return (await env.KV.get(key, 'json')) as KVCacheEntry | null;
  } catch {
    return null;
  }
}

export async function setCachedLink(env: Env, domain: string, entry: KVCacheEntry): Promise<void> {
  try {
    const key = kvKey(domain, entry.slug);
    await env.KV.put(key, JSON.stringify(entry), { expirationTtl: KV_TTL });
  } catch {
    // Cache errors must not affect redirects
  }
}

export async function deleteCachedLink(env: Env, domain: string, slug: string): Promise<void> {
  try {
    await env.KV.delete(kvKey(domain, slug));
  } catch {
    // Ignore cache errors
  }
}

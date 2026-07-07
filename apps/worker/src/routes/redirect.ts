import type { Context } from 'hono';
import type { Env } from '../types';
import { getCachedLink, setCachedLink } from '../cache/index';
import { getLinkBySlug } from '../db/index';
import { recordVisit } from '../analytics/index';
import { notFound, disabledPage, expiredPage } from '../utils/response';
import type { KVCacheEntry, Link } from '@linkora/shared';

function toCacheEntry(link: Link): KVCacheEntry {
  return {
    id: link.id,
    slug: link.slug,
    domain: link.domain ?? undefined,
    longUrl: link.long_url,
    redirectType: link.redirect_type as 301 | 302,
    status: link.status,
    expiresAt: link.expires_at ?? undefined,
    maxClicks: link.max_clicks ?? undefined,
    warningEnabled: link.warning_enabled === 1,
  };
}

function redirectForLink(link: Link): Response | null {
  if (link.status === 'disabled') return disabledPage();
  if (link.status === 'expired') {
    return expiredPage();
  }
  if (link.status === 'archived') {
    return notFound('The short link you are looking for does not exist.');
  }
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return expiredPage();
  }
  if (link.max_clicks !== null && link.max_clicks !== undefined && link.clicks >= link.max_clicks) {
    return expiredPage();
  }
  return null;
}

function cachedLinkExpired(cached: KVCacheEntry): boolean {
  return !!cached.expiresAt && new Date(cached.expiresAt) < new Date();
}

function cacheNeedsRefresh(cached: KVCacheEntry, fresh: KVCacheEntry): boolean {
  return (
    fresh.longUrl !== cached.longUrl ||
    fresh.redirectType !== cached.redirectType ||
    fresh.status !== cached.status ||
    (fresh.expiresAt ?? null) !== (cached.expiresAt ?? null) ||
    (fresh.maxClicks ?? null) !== (cached.maxClicks ?? null) ||
    fresh.warningEnabled !== cached.warningEnabled
  );
}

export async function handleRedirect(c: Context<{ Bindings: Env }>): Promise<Response> {
  const slug = c.req.param('slug');
  if (!slug) {
    return notFound('The short link you are looking for does not exist.');
  }

  const domain = new URL(c.req.url).hostname;

  // Try KV cache first
  let cached = await getCachedLink(c.env, domain, slug);

  if (!cached) {
    // Fallback to D1
    const link = await getLinkBySlug(c.env, slug);
    if (!link) {
      return notFound('The short link you are looking for does not exist.');
    }

    const inactiveResponse = redirectForLink(link);
    if (inactiveResponse) return inactiveResponse;

    cached = toCacheEntry(link);

    // Populate cache for future active requests.
    await setCachedLink(c.env, domain, cached);

    // Async: record visit (stats failure must NOT block redirect)
    c.executionCtx.waitUntil(recordVisit(c.env, link, c.req.raw, domain));

    return new Response(null, {
      status: link.redirect_type,
      headers: { Location: link.long_url },
    });
  }

  // Re-check D1 on cache hits. This keeps admin changes authoritative even if
  // Cloudflare KV has a briefly stale active entry after disable/delete.
  try {
    const link = await getLinkBySlug(c.env, slug);
    if (!link) {
      return notFound('The short link you are looking for does not exist.');
    }

    const inactiveResponse = redirectForLink(link);
    if (inactiveResponse) return inactiveResponse;

    const freshCache = toCacheEntry(link);
    if (cacheNeedsRefresh(cached, freshCache)) {
      c.executionCtx.waitUntil(setCachedLink(c.env, domain, freshCache));
    }

    c.executionCtx.waitUntil(recordVisit(c.env, link, c.req.raw, domain));

    return new Response(null, {
      status: link.redirect_type,
      headers: { Location: link.long_url },
    });
  } catch {
    // If D1 is temporarily unavailable but KV has an active entry, preserve the redirect.
    if (
      cached.status === 'active' &&
      !cachedLinkExpired(cached) &&
      (cached.maxClicks === undefined || cached.maxClicks === null)
    ) {
      return new Response(null, {
        status: cached.redirectType,
        headers: { Location: cached.longUrl },
      });
    }
  }

  return notFound('The short link you are looking for does not exist.');
}

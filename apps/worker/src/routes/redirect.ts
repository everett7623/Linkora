import type { Context } from 'hono';
import type { Env } from '../types';
import { getCachedLink, setCachedLink, deleteCachedLink } from '../cache/index';
import { getLinkBySlug, updateLink } from '../db/index';
import { recordVisit } from '../analytics/index';
import { notFound, disabledPage, expiredPage } from '../utils/response';
import type { KVCacheEntry } from '@linkora/shared';

function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function isMaxClicksReached(clicks: number | undefined, maxClicks: number | null | undefined): boolean {
  if (!maxClicks) return false;
  return (clicks ?? 0) >= maxClicks;
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

    if (link.status === 'disabled') return disabledPage();

    // Check expiration
    if (link.status === 'expired' || isExpired(link.expires_at)) {
      if (link.status !== 'expired') {
        c.executionCtx.waitUntil(
          updateLink(c.env, link.id, { status: 'expired', updated_at: new Date().toISOString() })
        );
      }
      return expiredPage();
    }

    // Check max clicks
    if (isMaxClicksReached(link.clicks, link.max_clicks)) {
      return expiredPage();
    }

    cached = {
      id: link.id,
      slug: link.slug,
      domain: link.domain ?? undefined,
      longUrl: link.long_url,
      redirectType: link.redirect_type as 301 | 302,
      status: link.status,
      expiresAt: link.expires_at ?? undefined,
      maxClicks: link.max_clicks ?? undefined,
      warningEnabled: link.warning_enabled === 1,
    } satisfies KVCacheEntry;

    // Populate cache for future requests
    await setCachedLink(c.env, domain, cached);

    // Async: record visit (stats failure must NOT block redirect)
    c.executionCtx.waitUntil(recordVisit(c.env, link, c.req.raw, domain));

    return new Response(null, {
      status: link.redirect_type,
      headers: { Location: link.long_url },
    });
  }

  // Served from KV
  if (cached.status === 'disabled') return disabledPage();
  if (cached.status === 'expired') return expiredPage();

  // Check expiry
  if (isExpired(cached.expiresAt)) {
    c.executionCtx.waitUntil(
      (async () => {
        await updateLink(c.env, cached!.id, { status: 'expired', updated_at: new Date().toISOString() });
        await deleteCachedLink(c.env, domain, slug);
      })()
    );
    return expiredPage();
  }

  // Check max clicks (need D1 for current click count)
  if (cached.maxClicks) {
    const link = await getLinkBySlug(c.env, slug);
    if (link && isMaxClicksReached(link.clicks, cached.maxClicks)) {
      return expiredPage();
    }
    if (link) {
      c.executionCtx.waitUntil(recordVisit(c.env, link, c.req.raw, domain));
    }
  } else {
    // Async stats from KV hit (no max_clicks check needed)
    const link = await getLinkBySlug(c.env, slug);
    if (link) {
      c.executionCtx.waitUntil(recordVisit(c.env, link, c.req.raw, domain));
    }
  }

  return new Response(null, {
    status: cached.redirectType,
    headers: { Location: cached.longUrl },
  });
}

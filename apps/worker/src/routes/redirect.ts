import type { Context } from 'hono';
import type { Env } from '../types';
import { getCachedLink, setCachedLink } from '../cache/index';
import { getLinkBySlug } from '../db/index';
import { recordVisit } from '../analytics/index';
import { notFound, disabledPage } from '../utils/response';
import type { KVCacheEntry } from '@linkora/shared';

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

    if (link.status === 'disabled') return disabledPage();
    if (link.status === 'expired') {
      return new Response(null, { status: 302, headers: { Location: '/' } });
    }

    return new Response(null, {
      status: link.redirect_type,
      headers: { Location: link.long_url },
    });
  }

  // Served from KV
  if (cached.status === 'disabled') return disabledPage();
  if (cached.status === 'expired') {
    return new Response(null, { status: 302, headers: { Location: '/' } });
  }

  // Check expiry
  if (cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
    return new Response(null, { status: 302, headers: { Location: '/' } });
  }

  // Async stats from KV hit
  const link = await getLinkBySlug(c.env, slug);
  if (link) {
    c.executionCtx.waitUntil(recordVisit(c.env, link, c.req.raw, domain));
  }

  return new Response(null, {
    status: cached.redirectType,
    headers: { Location: cached.longUrl },
  });
}

import type { Context } from 'hono';
import type { Env } from '../types';
import { getCachedLink, setCachedLink, deleteCachedLink } from '../cache/index';
import { getLinkBySlug, updateLink } from '../db/index';
import { recordVisit } from '../analytics/index';
import { notFound, disabledPage, expiredPage, passwordGatePage, warningPage } from '../utils/response';
import { sha256 } from '../utils/id';
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
  const confirmWarning = c.req.query('confirm') === '1';

  // Handle POST for password submission
  if (c.req.method === 'POST') {
    return handlePasswordSubmit(c, slug, domain);
  }

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

    // Password gate
    if (link.password_hash) {
      return passwordGatePage(slug);
    }

    // Warning interstitial
    if (link.warning_enabled === 1 && !confirmWarning) {
      return warningPage(slug, link.long_url);
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
      passwordProtected: !!link.password_hash,
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

  // Password gate (KV hit)
  if (cached.passwordProtected) {
    return passwordGatePage(slug);
  }

  // Warning interstitial (KV hit)
  if (cached.warningEnabled && !confirmWarning) {
    return warningPage(slug, cached.longUrl);
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

async function handlePasswordSubmit(c: Context<{ Bindings: Env }>, slug: string, domain: string): Promise<Response> {
  const link = await getLinkBySlug(c.env, slug);
  if (!link) {
    return notFound('The short link you are looking for does not exist.');
  }

  if (!link.password_hash) {
    // No password set, just redirect
    c.executionCtx.waitUntil(recordVisit(c.env, link, c.req.raw, domain));
    return new Response(null, {
      status: link.redirect_type,
      headers: { Location: link.long_url },
    });
  }

  let password = '';
  try {
    const formData = await c.req.formData();
    password = formData.get('password')?.toString() ?? '';
  } catch {
    return passwordGatePage(slug, 'Invalid request');
  }

  const inputHash = await sha256(password);
  if (inputHash !== link.password_hash) {
    return passwordGatePage(slug, 'Incorrect password. Please try again.');
  }

  // Password correct - check warning
  if (link.warning_enabled === 1) {
    return warningPage(slug, link.long_url);
  }

  // Record visit and redirect
  c.executionCtx.waitUntil(recordVisit(c.env, link, c.req.raw, domain));
  return new Response(null, {
    status: link.redirect_type,
    headers: { Location: link.long_url },
  });
}

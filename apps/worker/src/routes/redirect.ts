import type { Context } from 'hono';
import type { Env } from '../types';
import { getCachedLink, setCachedLink } from '../cache/index';
import { getDomainlessLinkBySlug, getLinkByDomainAndSlug, getRedirectRulesForLink } from '../db/index';
import { queueOrRecordVisit } from '../analytics/index';
import { resolveRedirectTarget } from '../redirectRules/index';
import { notFound, disabledPage, expiredPage, passwordPage, warningPage } from '../utils/response';
import { sha256 } from '../utils/id';
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

function shouldCacheRedirect(link: Link): boolean {
  return !link.password_hash;
}

async function getRedirectLink(env: Env, domain: string, slug: string): Promise<Link | null> {
  return (await getLinkByDomainAndSlug(env, domain, slug)) ?? getDomainlessLinkBySlug(env, slug);
}

async function getSmartRedirectTarget(env: Env, link: Link, request: Request): Promise<string> {
  try {
    const rules = await getRedirectRulesForLink(env, link.id);
    return resolveRedirectTarget(link, rules, request);
  } catch {
    return link.long_url;
  }
}

function warningConfirmed(c: Context<{ Bindings: Env }>): boolean {
  return c.req.query('linkora_confirm') === '1';
}

async function readSubmittedPassword(c: Context<{ Bindings: Env }>): Promise<string | undefined> {
  if (c.req.method !== 'POST') return undefined;

  try {
    const form = await c.req.raw.clone().formData();
    const value = form.get('password');
    return typeof value === 'string' ? value : undefined;
  } catch {
    return undefined;
  }
}

async function passwordMatches(storedHash: string, password: string): Promise<boolean> {
  const hash = await sha256(password);
  return storedHash === `sha256:${hash}` || storedHash === hash;
}

async function accessGate(
  c: Context<{ Bindings: Env }>,
  link: Link
): Promise<Response | null> {
  const inactiveResponse = redirectForLink(link);
  if (inactiveResponse) return inactiveResponse;

  if (link.password_hash) {
    const submittedPassword = await readSubmittedPassword(c);
    if (!submittedPassword || !(await passwordMatches(link.password_hash, submittedPassword))) {
      return passwordPage(link.slug, c.req.method === 'POST');
    }
  }

  if (link.warning_enabled === 1 && !warningConfirmed(c)) {
    return warningPage(link.slug, link.long_url, !!link.password_hash);
  }

  return null;
}

export async function handleRedirect(c: Context<{ Bindings: Env }>): Promise<Response> {
  const slug = c.req.param('slug');
  if (!slug) {
    return notFound('The short link you are looking for does not exist.');
  }

  const domain = new URL(c.req.url).hostname.toLowerCase();

  // Try KV cache first
  let cached = await getCachedLink(c.env, domain, slug);

  if (!cached) {
    // Fallback to D1
    const link = await getRedirectLink(c.env, domain, slug);
    if (!link) {
      return notFound('The short link you are looking for does not exist.');
    }

    const gatedResponse = await accessGate(c, link);
    if (gatedResponse) return gatedResponse;

    cached = toCacheEntry(link);

    // Populate cache for future active requests.
    if (shouldCacheRedirect(link)) {
      await setCachedLink(c.env, domain, cached);
    }

    const targetUrl = await getSmartRedirectTarget(c.env, link, c.req.raw);

    // Async: record visit (stats failure must NOT block redirect)
    c.executionCtx.waitUntil(queueOrRecordVisit(c.env, link, c.req.raw, domain));

    return new Response(null, {
      status: link.redirect_type,
      headers: { Location: targetUrl },
    });
  }

  // Re-check D1 on cache hits. This keeps admin changes authoritative even if
  // Cloudflare KV has a briefly stale active entry after disable/delete.
  try {
    const link = await getRedirectLink(c.env, domain, slug);
    if (!link) {
      return notFound('The short link you are looking for does not exist.');
    }

    const gatedResponse = await accessGate(c, link);
    if (gatedResponse) return gatedResponse;

    const freshCache = toCacheEntry(link);
    if (shouldCacheRedirect(link) && cacheNeedsRefresh(cached, freshCache)) {
      c.executionCtx.waitUntil(setCachedLink(c.env, domain, freshCache));
    }

    const targetUrl = await getSmartRedirectTarget(c.env, link, c.req.raw);

    c.executionCtx.waitUntil(queueOrRecordVisit(c.env, link, c.req.raw, domain));

    return new Response(null, {
      status: link.redirect_type,
      headers: { Location: targetUrl },
    });
  } catch {
    // If D1 is temporarily unavailable but KV has an active entry, preserve the redirect.
    if (
      cached.status === 'active' &&
      !cachedLinkExpired(cached) &&
      (cached.maxClicks === undefined || cached.maxClicks === null)
    ) {
      if (cached.warningEnabled && !warningConfirmed(c)) {
        return warningPage(cached.slug, cached.longUrl);
      }

      return new Response(null, {
        status: cached.redirectType,
        headers: { Location: cached.longUrl },
      });
    }
  }

  return notFound('The short link you are looking for does not exist.');
}

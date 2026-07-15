import type { Context } from 'hono';
import type { Env } from '../types';
import { getCachedLink, setCachedLink } from '../cache/index';
import {
  getDomainlessLinkBySlug,
  getLinkByDomainAndSlug,
  getRedirectRulesForLink,
} from '../db/index';
import { queueOrRecordVisit } from '../analytics/index';
import { resolveRedirectDecision, type RedirectDecision } from '../redirectRules/index';
import { notFound, disabledPage, expiredPage, passwordPage, warningPage } from '../utils/response';
import { resolvePublicLocale, type PublicLocale } from '../utils/publicPages';
import { redirectResponse } from '../utils/redirectResponse';
import { sha256 } from '../utils/id';
import type { KVCacheEntry, Link } from '@linketry/shared';
import { getPublicPageMessage } from '../utils/pageTemplates';

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

async function redirectForLink(env: Env, link: Link, locale: PublicLocale): Promise<Response | null> {
  if (link.status === 'disabled') return disabledPage(locale, { message: await getPublicPageMessage(env, 'disabled', { slug: link.slug }) });
  if (link.status === 'expired') {
    return expiredPage(locale, { message: await getPublicPageMessage(env, 'expired', { slug: link.slug }) });
  }
  if (link.status === 'archived') {
    return notFoundFor(env, link.slug, locale);
  }
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return expiredPage(locale, { message: await getPublicPageMessage(env, 'expired', { slug: link.slug }) });
  }
  if (link.max_clicks !== null && link.max_clicks !== undefined && link.clicks >= link.max_clicks) {
    return expiredPage(locale, { message: await getPublicPageMessage(env, 'expired', { slug: link.slug }) });
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

function buildRedirectUrl(targetUrl: string, requestUrl: URL): string {
  try {
    const target = new URL(targetUrl);
    for (const [key, value] of requestUrl.searchParams) {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey.startsWith('linketry_')) continue;
      target.searchParams.set(key, value);
    }
    return target.toString();
  } catch {
    return targetUrl;
  }
}

async function getRedirectLink(env: Env, domain: string, slug: string): Promise<Link | null> {
  return (await getLinkByDomainAndSlug(env, domain, slug)) ?? getDomainlessLinkBySlug(env, slug);
}

async function notFoundFor(env: Env, slug: string, locale: PublicLocale): Promise<Response> {
  return notFound(await getPublicPageMessage(env, '404', { slug }), locale);
}

async function getSmartRedirectDecision(
  env: Env,
  link: Link,
  request: Request
): Promise<RedirectDecision> {
  try {
    const rules = await getRedirectRulesForLink(env, link.id);
    return resolveRedirectDecision(link, rules, request);
  } catch {
    return {
      targetUrl: link.long_url,
      redirectRuleId: null,
      redirectRuleType: null,
      matched: false,
    };
  }
}

function warningConfirmed(c: Context<{ Bindings: Env }>): boolean {
  return c.req.query('linketry_confirm') === '1';
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
  link: Link,
  locale: PublicLocale
): Promise<Response | null> {
  const inactiveResponse = await redirectForLink(c.env, link, locale);
  if (inactiveResponse) return inactiveResponse;

  if (link.password_hash) {
    const submittedPassword = await readSubmittedPassword(c);
    if (!submittedPassword || !(await passwordMatches(link.password_hash, submittedPassword))) {
      return passwordPage(link.slug, c.req.method === 'POST', locale);
    }
  }

  if (link.warning_enabled === 1 && !warningConfirmed(c)) {
    return warningPage(link.slug, link.long_url, !!link.password_hash, locale, {
      message: await getPublicPageMessage(c.env, 'warning', { slug: link.slug, url: link.long_url }),
    });
  }

  return null;
}

export async function handleRedirect(c: Context<{ Bindings: Env }>): Promise<Response> {
  const slug = c.req.param('slug');
  const locale = resolvePublicLocale(c.req.header('Accept-Language'));
  if (!slug) {
    return notFoundFor(c.env, slug ?? '', locale);
  }

  const domain = new URL(c.req.url).hostname.toLowerCase();

  // Try KV cache first
  let cached = await getCachedLink(c.env, domain, slug);

  if (!cached) {
    // Fallback to D1
    const link = await getRedirectLink(c.env, domain, slug);
    if (!link) {
      return notFoundFor(c.env, slug, locale);
    }

    const gatedResponse = await accessGate(c, link, locale);
    if (gatedResponse) return gatedResponse;

    cached = toCacheEntry(link);

    // Populate cache for future active requests.
    if (shouldCacheRedirect(link)) {
      await setCachedLink(c.env, domain, cached);
    }

    const decision = await getSmartRedirectDecision(c.env, link, c.req.raw);

    // Async: record visit (stats failure must NOT block redirect)
    c.executionCtx.waitUntil(
      queueOrRecordVisit(c.env, link, c.req.raw, domain, {
        url: decision.targetUrl,
        redirect_rule_id: decision.redirectRuleId,
        redirect_rule_type: decision.redirectRuleType,
      })
    );

    return redirectResponse(buildRedirectUrl(decision.targetUrl, new URL(c.req.url)), link.redirect_type);
  }

  // Re-check D1 on cache hits. This keeps admin changes authoritative even if
  // Cloudflare KV has a briefly stale active entry after disable/delete.
  try {
    const link = await getRedirectLink(c.env, domain, slug);
    if (!link) {
      return notFoundFor(c.env, slug, locale);
    }

    const gatedResponse = await accessGate(c, link, locale);
    if (gatedResponse) return gatedResponse;

    const freshCache = toCacheEntry(link);
    if (shouldCacheRedirect(link) && cacheNeedsRefresh(cached, freshCache)) {
      c.executionCtx.waitUntil(setCachedLink(c.env, domain, freshCache));
    }

    const decision = await getSmartRedirectDecision(c.env, link, c.req.raw);

    c.executionCtx.waitUntil(
      queueOrRecordVisit(c.env, link, c.req.raw, domain, {
        url: decision.targetUrl,
        redirect_rule_id: decision.redirectRuleId,
        redirect_rule_type: decision.redirectRuleType,
      })
    );

    return redirectResponse(buildRedirectUrl(decision.targetUrl, new URL(c.req.url)), link.redirect_type);
  } catch {
    // If D1 is temporarily unavailable but KV has an active entry, preserve the redirect.
    if (
      cached.status === 'active' &&
      !cachedLinkExpired(cached) &&
      (cached.maxClicks === undefined || cached.maxClicks === null)
    ) {
      if (cached.warningEnabled && !warningConfirmed(c)) {
        return warningPage(cached.slug, cached.longUrl, false, locale);
      }

      return redirectResponse(cached.longUrl, cached.redirectType);
    }
  }

  return notFoundFor(c.env, slug, locale);
}

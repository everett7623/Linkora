import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import {
  listLinks,
  getLinkBySlug,
  getLinkById,
  getLinksByIds,
  createLink,
  updateLink,
  deleteLink,
  deleteRedirectRulesForLink,
  createTagsIfMissing,
} from '../db/index';
import { recordAudit } from '../audit/index';
import { emitWebhook } from '../webhooks/index';
import { setCachedLink, deleteCachedLink } from '../cache/index';
import { jsonOk, jsonError, jsonCreated } from '../utils/response';
import { generateId, now, sha256 } from '../utils/id';
import { validateSlug, validateLongUrl, validateDomain } from '@linkora/shared';
import type { Link, KVCacheEntry } from '@linkora/shared';
import { normalizeFallbackUrl } from '../links/fallbackUrl';

const links = new Hono<{ Bindings: Env }>();

type BulkAction = 'disable' | 'enable' | 'archive' | 'restore' | 'delete';
type BulkTagMode = 'add' | 'replace' | 'remove' | 'clear';
type LinkBody = Partial<Link> & { tags?: string | string[]; password?: unknown };

const LINK_STATUSES: Link['status'][] = ['active', 'disabled', 'expired', 'archived'];

function requestDomain(requestUrl: string): string {
  return new URL(requestUrl).hostname.toLowerCase();
}

function cacheDomainForLink(link: Pick<Link, 'domain'>, fallbackDomain: string): string {
  return link.domain?.trim() || fallbackDomain;
}

function parseLinkStatus(value: unknown): Link['status'] {
  return LINK_STATUSES.includes(value as Link['status']) ? value as Link['status'] : 'active';
}

function parseRequiredLinkStatus(value: unknown): { value?: Link['status']; error?: string } {
  if (LINK_STATUSES.includes(value as Link['status'])) return { value: value as Link['status'] };
  return { error: 'status must be active, disabled, expired, or archived' };
}

function parseRedirectType(value: unknown): { value?: Link['redirect_type']; error?: string } {
  if (value === 301 || value === '301') return { value: 301 };
  if (value === 302 || value === '302') return { value: 302 };
  return { error: 'redirect_type must be 301 or 302' };
}

function parsePaginationNumber(value: string | undefined, fallback: number, max?: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return max === undefined ? parsed : Math.min(parsed, max);
}

async function ensureTagRecords(env: Env, tags: string[], ts = now()): Promise<void> {
  if (tags.length === 0) return;
  await createTagsIfMissing(env, tags.map((tag) => ({
    id: generateId(),
    name: tag,
    color: null,
    description: null,
    created_at: ts,
    updated_at: ts,
  })));
}

function parseOptionalDate(value: unknown, fieldName: string): { value: string | null; error?: string } {
  if (value === undefined || value === null || value === '') return { value: null };
  if (typeof value !== 'string') return { value: null, error: `${fieldName} must be an ISO date string` };

  const trimmed = value.trim();
  if (!trimmed) return { value: null };

  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) return { value: null, error: `${fieldName} is not a valid date` };

  return { value: new Date(timestamp).toISOString() };
}

function parseOptionalPositiveInteger(value: unknown, fieldName: string): { value: number | null; error?: string } {
  if (value === undefined || value === null || value === '') return { value: null };

  if (typeof value === 'string' && !value.trim()) return { value: null };

  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 1) {
    return { value: null, error: `${fieldName} must be a positive integer` };
  }

  return { value: numberValue };
}

function parseOptionalBoolean(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (value === true || value === 1 || value === '1' || value === 'true') return 1;
  if (value === false || value === 0 || value === '0' || value === 'false' || value === null || value === '') return 0;
  return undefined;
}

function parseOptionalDomain(value: unknown): { value?: string; error?: string } {
  if (value === undefined || value === null || value === '') return {};
  if (typeof value !== 'string') return { error: 'domain must be a string' };

  const validation = validateDomain(value);
  if (!validation.valid) return { error: validation.error };
  return { value: validation.domain };
}

async function parsePasswordHash(value: unknown): Promise<{ value: string | null; error?: string }> {
  if (value === undefined) return { value: null };
  if (value === null || value === '') return { value: null };
  if (typeof value !== 'string') return { value: null, error: 'password must be a string' };

  const password = value.trim();
  if (!password) return { value: null };
  if (password.length < 4) return { value: null, error: 'password must be at least 4 characters' };
  if (password.length > 200) return { value: null, error: 'password must be 200 characters or less' };

  return { value: `sha256:${await sha256(password)}` };
}

function parseTagsInput(value: unknown): { tags: string[]; error?: string } {
  const rawTags = Array.isArray(value)
    ? value.map((tag) => String(tag))
    : typeof value === 'string'
    ? value.split(',')
    : [];

  const tags: string[] = [];
  const seen = new Set<string>();

  for (const rawTag of rawTags) {
    const tag = rawTag.trim();
    if (!tag) continue;
    if (tag.length > 50) return { tags: [], error: 'Each tag must be 50 characters or less' };
    if (seen.has(tag)) continue;
    seen.add(tag);
    tags.push(tag);
  }

  if (tags.length > 50) return { tags: [], error: 'A link can have at most 50 tags' };
  return { tags };
}

function sanitizeLink(link: Link): Link {
  return {
    ...link,
    password_hash: null,
    password_protected: !!link.password_hash,
  };
}

function sanitizeLinks(items: Link[]): Link[] {
  return items.map(sanitizeLink);
}

async function generateUniqueSlug(env: Env, reservedSlugs: Set<string>): Promise<string> {
  const { generateSlug } = await import('../utils/id');
  for (let i = 0; i < 20; i++) {
    const slug = generateSlug(6);
    if (reservedSlugs.has(slug)) continue;
    const existing = await getLinkBySlug(env, slug);
    if (!existing) return slug;
  }
  throw new Error('Could not generate a unique slug');
}

async function prepareNewLink(
  env: Env,
  requestUrl: string,
  body: LinkBody,
  reservedSlugs: Set<string>
): Promise<{ link?: Link; tags?: string[]; error?: string; status?: number }> {
  const { long_url, slug: rawSlug, title, description, redirect_type, status, source } = body;

  if (!long_url) return { error: 'long_url is required', status: 400 };

  const urlValidation = validateLongUrl(long_url);
  if (!urlValidation.valid) return { error: urlValidation.error!, status: 400 };

  let slug = rawSlug?.trim() ?? '';
  if (!slug) {
    slug = await generateUniqueSlug(env, reservedSlugs);
  } else {
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) return { error: slugValidation.error!, status: 400 };
    const existing = await getLinkBySlug(env, slug);
    if (existing || reservedSlugs.has(slug)) return { error: `Slug "${slug}" is already in use`, status: 409 };
  }

  const redirectType = redirect_type === 301 ? 301 : 302;
  const linkStatus = parseLinkStatus(status);
  const expiresAt = parseOptionalDate(body.expires_at, 'expires_at');
  if (expiresAt.error) return { error: expiresAt.error, status: 400 };

  const maxClicks = parseOptionalPositiveInteger(body.max_clicks, 'max_clicks');
  if (maxClicks.error) return { error: maxClicks.error, status: 400 };

  const passwordHash = await parsePasswordHash(body.password);
  if (passwordHash.error) return { error: passwordHash.error, status: 400 };

  const fallbackUrl = normalizeFallbackUrl(body.fallback_url);
  if (fallbackUrl.error) return { error: fallbackUrl.error, status: 400 };

  const warningEnabled = parseOptionalBoolean(body.warning_enabled);
  if (body.warning_enabled !== undefined && warningEnabled === undefined) {
    return { error: 'warning_enabled must be a boolean', status: 400 };
  }

  const parsedTags = parseTagsInput(body.tags);
  if (parsedTags.error) return { error: parsedTags.error, status: 400 };

  const parsedDomain = parseOptionalDomain(body.domain);
  if (parsedDomain.error) return { error: parsedDomain.error, status: 400 };

  const domain = parsedDomain.value ?? requestDomain(requestUrl);
  const id = generateId();
  const ts = now();
  const link: Link = {
    id,
    slug,
    domain,
    long_url,
    short_url: `https://${domain}/${slug}`,
    title: title ?? null,
    description: description ?? null,
    tags: parsedTags.tags.length > 0 ? JSON.stringify(parsedTags.tags) : null,
    status: linkStatus,
    redirect_type: redirectType,
    clicks: 0,
    source: source ?? null,
    source_id: null,
    created_at: ts,
    updated_at: ts,
    last_clicked_at: null,
    expires_at: expiresAt.value,
    max_clicks: maxClicks.value,
    password_hash: passwordHash.value,
    warning_enabled: warningEnabled ?? 0,
    fallback_url: fallbackUrl.value,
    archived: 0,
  };

  reservedSlugs.add(slug);
  return { link, tags: parsedTags.tags };
}

function parseStoredTags(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.map((tag) => String(tag).trim()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function applyTagMode(existingTags: string[], incomingTags: string[], mode: BulkTagMode): string[] {
  if (mode === 'clear') return [];
  if (mode === 'replace') return incomingTags;

  if (mode === 'remove') {
    const removeSet = new Set(incomingTags);
    return existingTags.filter((tag) => !removeSet.has(tag));
  }

  const merged = [...existingTags];
  const seen = new Set(merged);
  for (const tag of incomingTags) {
    if (!seen.has(tag)) {
      seen.add(tag);
      merged.push(tag);
    }
  }
  return merged;
}

function toCacheEntry(link: Link, status: Link['status'] = link.status): KVCacheEntry {
  return {
    id: link.id,
    slug: link.slug,
    domain: link.domain ?? undefined,
    longUrl: link.long_url,
    redirectType: link.redirect_type,
    status,
    expiresAt: link.expires_at ?? undefined,
    maxClicks: link.max_clicks ?? undefined,
    warningEnabled: link.warning_enabled === 1,
  };
}

function isPastDate(value?: string | null): boolean {
  if (!value) return false;
  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp) && timestamp < Date.now();
}

function hasReachedMaxClicks(link: Link): boolean {
  return link.max_clicks !== null && link.max_clicks !== undefined && link.clicks >= link.max_clicks;
}

function shouldCacheLink(link: Link): boolean {
  return (
    link.status === 'active' &&
    link.archived === 0 &&
    !link.password_hash &&
    !isPastDate(link.expires_at) &&
    !hasReachedMaxClicks(link)
  );
}

async function refreshLinkCache(env: Env, domain: string, link: Link): Promise<void> {
  if (shouldCacheLink(link)) {
    await setCachedLink(env, domain, toCacheEntry(link));
  } else {
    await deleteCachedLink(env, domain, link.slug);
  }
}

// Auth middleware
links.use('*', async (c, next) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  await next();
});

// GET /api/links
links.get('/', async (c) => {
  const keyword = c.req.query('keyword');
  const tag = c.req.query('tag');
  const status = c.req.query('status');
  const source = c.req.query('source');
  const domain = c.req.query('domain');
  const createdFrom = c.req.query('createdFrom');
  const createdTo = c.req.query('createdTo');
  const hasPassword = c.req.query('hasPassword');
  const warning = c.req.query('warning');
  const limits = c.req.query('limits');
  const sort = c.req.query('sort');
  const page = parsePaginationNumber(c.req.query('page'), 1);
  const pageSize = parsePaginationNumber(c.req.query('pageSize'), 20, 100);

  const { items, total } = await listLinks(c.env, {
    keyword,
    tag,
    status,
    source,
    domain,
    createdFrom,
    createdTo,
    hasPassword,
    warning,
    limits,
    sort,
    page,
    pageSize,
  });

  return jsonOk({
    items: sanitizeLinks(items),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

// POST /api/links
links.post('/', async (c) => {
  let body: LinkBody;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const prepared = await prepareNewLink(c.env, c.req.url, body, new Set<string>());
  if (prepared.error || !prepared.link) return jsonError(prepared.error ?? 'Invalid link', prepared.status ?? 400);
  const fallbackDomain = requestDomain(c.req.url);
  const link = prepared.link;

  await createLink(c.env, link);
  await ensureTagRecords(c.env, prepared.tags ?? [], link.created_at);

  await refreshLinkCache(c.env, cacheDomainForLink(link, fallbackDomain), link);
  await recordAudit(c.env, c.req.raw, 'link.create', 'link', link.id, { slug: link.slug });
  c.executionCtx.waitUntil(emitWebhook(c.env, 'link.created', { link: sanitizeLink(link) }));

  return jsonCreated(sanitizeLink(link));
});

// POST /api/links/bulk-create
links.post('/bulk-create', async (c) => {
  let body: { items?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const items = Array.isArray(body.items) ? body.items as LinkBody[] : [];
  if (items.length === 0) return jsonError('items must be a non-empty array', 400);
  if (items.length > 100) return jsonError('Bulk create supports up to 100 links at a time', 400);

  const reservedSlugs = new Set<string>();
  const fallbackDomain = requestDomain(c.req.url);
  const results: Array<{ index: number; status: 'created' | 'failed'; slug?: string; id?: string; error?: string }> = [];
  const createdLinks: Link[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < items.length; i++) {
    try {
      const prepared = await prepareNewLink(c.env, c.req.url, items[i], reservedSlugs);
      if (prepared.error || !prepared.link) {
        failedCount++;
        results.push({ index: i, status: 'failed', error: prepared.error ?? 'Invalid link' });
        continue;
      }

      await createLink(c.env, prepared.link);
      await ensureTagRecords(c.env, prepared.tags ?? [], prepared.link.created_at);
      await refreshLinkCache(c.env, cacheDomainForLink(prepared.link, fallbackDomain), prepared.link);
      createdLinks.push(prepared.link);
      successCount++;
      results.push({
        index: i,
        status: 'created',
        slug: prepared.link.slug,
        id: prepared.link.id,
      });
    } catch (err) {
      failedCount++;
      results.push({ index: i, status: 'failed', error: String(err) });
    }
  }

  await recordAudit(c.env, c.req.raw, 'link.bulk_create', 'link', undefined, {
    total: items.length,
    success: successCount,
    failed: failedCount,
    slugs: createdLinks.map((link) => link.slug),
  });
  c.executionCtx.waitUntil(emitWebhook(c.env, 'link.bulk', {
    action: 'bulk_create',
    total: items.length,
    success: successCount,
    failed: failedCount,
    links: sanitizeLinks(createdLinks),
  }));

  return jsonOk({
    total: items.length,
    success: successCount,
    failed: failedCount,
    items: sanitizeLinks(createdLinks),
    results,
  }, successCount > 0 ? 201 : 400);
});

// POST /api/links/bulk
links.post('/bulk', async (c) => {
  let body: { ids?: unknown; action?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const ids = Array.isArray(body.ids)
    ? [...new Set(body.ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))]
    : [];
  const action = body.action as BulkAction;

  if (ids.length === 0) return jsonError('ids must be a non-empty array', 400);
  if (ids.length > 100) return jsonError('Bulk actions support up to 100 links at a time', 400);
  if (!['disable', 'enable', 'archive', 'restore', 'delete'].includes(action)) {
    return jsonError('Invalid bulk action', 400);
  }

  const fallbackDomain = requestDomain(c.req.url);
  const existing = await getLinksByIds(c.env, ids);
  const ts = now();
  let successCount = 0;

  for (const link of existing) {
    const domain = cacheDomainForLink(link, fallbackDomain);

    if (action === 'delete') {
      await deleteRedirectRulesForLink(c.env, link.id);
      await deleteLink(c.env, link.id);
      await deleteCachedLink(c.env, domain, link.slug);
      successCount++;
      continue;
    }

    if (action === 'disable') {
      await updateLink(c.env, link.id, { status: 'disabled', updated_at: ts });
      await deleteCachedLink(c.env, domain, link.slug);
      successCount++;
      continue;
    }

    if (action === 'archive') {
      await updateLink(c.env, link.id, { archived: 1, status: 'archived', updated_at: ts });
      await deleteCachedLink(c.env, domain, link.slug);
      successCount++;
      continue;
    }

    if (action === 'enable') {
      await updateLink(c.env, link.id, { status: 'active', updated_at: ts });
      await refreshLinkCache(c.env, domain, { ...link, status: 'active', updated_at: ts });
      successCount++;
      continue;
    }

    if (action === 'restore') {
      await updateLink(c.env, link.id, { archived: 0, status: 'active', updated_at: ts });
      await refreshLinkCache(c.env, domain, { ...link, archived: 0, status: 'active', updated_at: ts });
      successCount++;
    }
  }

  await recordAudit(c.env, c.req.raw, `link.bulk.${action}`, 'link', undefined, {
    ids,
    success: successCount,
    notFound: ids.length - existing.length,
  });
  c.executionCtx.waitUntil(emitWebhook(c.env, 'link.bulk', {
    action,
    ids,
    success: successCount,
    notFound: ids.length - existing.length,
  }));

  return jsonOk({
    action,
    total: ids.length,
    success: successCount,
    notFound: ids.length - existing.length,
  });
});

// POST /api/links/bulk-tag
links.post('/bulk-tag', async (c) => {
  let body: { ids?: unknown; tags?: unknown; mode?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const ids = Array.isArray(body.ids)
    ? [...new Set(body.ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))]
    : [];
  const mode = (body.mode ?? 'add') as BulkTagMode;
  const parsedTags = parseTagsInput(body.tags);

  if (ids.length === 0) return jsonError('ids must be a non-empty array', 400);
  if (ids.length > 100) return jsonError('Bulk tag assignment supports up to 100 links at a time', 400);
  if (!['add', 'replace', 'remove', 'clear'].includes(mode)) return jsonError('Invalid bulk tag mode', 400);
  if (parsedTags.error) return jsonError(parsedTags.error, 400);
  if (mode !== 'clear' && parsedTags.tags.length === 0) return jsonError('tags must be a non-empty list', 400);

  const existing = await getLinksByIds(c.env, ids);
  const ts = now();
  let successCount = 0;

  if ((mode === 'add' || mode === 'replace') && parsedTags.tags.length > 0) {
    await ensureTagRecords(c.env, parsedTags.tags, ts);
  }

  for (const link of existing) {
    const currentTags = parseStoredTags(link.tags);
    const nextTags = applyTagMode(currentTags, parsedTags.tags, mode);
    await updateLink(c.env, link.id, {
      tags: nextTags.length > 0 ? JSON.stringify(nextTags) : null,
      updated_at: ts,
    });
    successCount++;
  }

  await recordAudit(c.env, c.req.raw, `link.bulk_tag.${mode}`, 'link', undefined, {
    ids,
    tags: parsedTags.tags,
    success: successCount,
    notFound: ids.length - existing.length,
  });

  return jsonOk({
    mode,
    tags: parsedTags.tags,
    total: ids.length,
    success: successCount,
    notFound: ids.length - existing.length,
  });
});

links.post('/bulk-replace-url/preview', async (c) => {
  let body: { ids?: unknown; find?: unknown; replace?: unknown };
  try { body = await c.req.json(); } catch { return jsonError('Invalid JSON body', 400); }
  const ids = Array.isArray(body.ids) ? [...new Set(body.ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))] : [];
  const find = typeof body.find === 'string' ? body.find : '';
  const replace = typeof body.replace === 'string' ? body.replace : '';
  if (!ids.length || ids.length > 100) return jsonError('Select between 1 and 100 links', 400);
  if (!find) return jsonError('find must not be empty', 400);
  const existing = await getLinksByIds(c.env, ids);
  const items = existing.map((link) => {
    const next = link.long_url.includes(find) ? link.long_url.split(find).join(replace) : link.long_url;
    const validation = validateLongUrl(next);
    return { id: link.id, slug: link.slug, current_url: link.long_url, next_url: next, status: next === link.long_url ? 'unchanged' : validation.valid ? 'ready' : 'invalid', error: validation.valid ? null : validation.error ?? 'Invalid URL' };
  });
  return jsonOk({ items, ready: items.filter((item) => item.status === 'ready').length, unchanged: items.filter((item) => item.status === 'unchanged').length, invalid: items.filter((item) => item.status === 'invalid').length, notFound: ids.length - existing.length });
});

links.post('/bulk-replace-url/confirm', async (c) => {
  let body: { items?: unknown };
  try { body = await c.req.json(); } catch { return jsonError('Invalid JSON body', 400); }
  const requested = Array.isArray(body.items) ? body.items.slice(0, 100) as Array<{ id?: unknown; current_url?: unknown; next_url?: unknown }> : [];
  if (!requested.length) return jsonError('items must be a non-empty array', 400);
  const existing = await getLinksByIds(c.env, requested.flatMap((item) => typeof item.id === 'string' ? [item.id] : []));
  const byId = new Map(existing.map((link) => [link.id, link])); const ts = now(); const fallbackDomain = requestDomain(c.req.url); const changed: Array<{id:string;slug:string;old_url:string;new_url:string}>=[]; let skipped=0;
  for (const item of requested) {
    const link = typeof item.id === 'string' ? byId.get(item.id) : undefined; const oldUrl = typeof item.current_url === 'string' ? item.current_url : ''; const nextUrl = typeof item.next_url === 'string' ? item.next_url : '';
    if (!link || link.long_url !== oldUrl || !validateLongUrl(nextUrl).valid || nextUrl === oldUrl) { skipped++; continue; }
    await updateLink(c.env, link.id, { long_url: nextUrl, updated_at: ts });
    await refreshLinkCache(c.env, cacheDomainForLink(link, fallbackDomain), { ...link, long_url: nextUrl, updated_at: ts });
    changed.push({ id: link.id, slug: link.slug, old_url: oldUrl, new_url: nextUrl });
  }
  await recordAudit(c.env, c.req.raw, 'link.bulk_replace_url', 'link', undefined, { changed: changed.length, skipped, ids: changed.map((item) => item.id) });
  const csv = ['id,slug,old_url,new_url', ...changed.map((item) => [item.id,item.slug,item.old_url,item.new_url].map((value) => `"${value.replace(/"/g,'""')}"`).join(','))].join('\r\n');
  return jsonOk({ changed: changed.length, skipped, rollback_csv: csv });
});

// GET /api/links/:id
links.get('/:id', async (c) => {
  const link = await getLinkById(c.env, c.req.param('id'));
  if (!link) return jsonError('Link not found', 404);
  return jsonOk(sanitizeLink(link));
});

// PUT /api/links/:id
links.put('/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await getLinkById(c.env, id);
  if (!existing) return jsonError('Link not found', 404);

  let body: LinkBody;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const fields: Partial<Link> = {};
  const fallbackDomain = requestDomain(c.req.url);

  if (body.long_url !== undefined) {
    const urlValidation = validateLongUrl(body.long_url);
    if (!urlValidation.valid) return jsonError(urlValidation.error!, 400);
    fields.long_url = body.long_url;
  }

  if (body.slug !== undefined && body.slug !== existing.slug) {
    const slugValidation = validateSlug(body.slug);
    if (!slugValidation.valid) return jsonError(slugValidation.error!, 400);
    const conflict = await getLinkBySlug(c.env, body.slug);
    if (conflict && conflict.id !== id) return jsonError(`Slug "${body.slug}" is already in use`, 409);
    fields.slug = body.slug;
  }

  if (body.domain !== undefined) {
    const parsedDomain = parseOptionalDomain(body.domain);
    if (parsedDomain.error) return jsonError(parsedDomain.error, 400);
    fields.domain = parsedDomain.value ?? fallbackDomain;
  }

  if (body.title !== undefined) fields.title = body.title;
  if (body.description !== undefined) fields.description = body.description;
  if (body.status !== undefined) {
    const parsedStatus = parseRequiredLinkStatus(body.status);
    if (parsedStatus.error) return jsonError(parsedStatus.error, 400);
    fields.status = parsedStatus.value;
  }
  if (body.redirect_type !== undefined) {
    const parsedRedirectType = parseRedirectType(body.redirect_type);
    if (parsedRedirectType.error) return jsonError(parsedRedirectType.error, 400);
    fields.redirect_type = parsedRedirectType.value;
  }
  if (body.expires_at !== undefined) {
    const expiresAt = parseOptionalDate(body.expires_at, 'expires_at');
    if (expiresAt.error) return jsonError(expiresAt.error, 400);
    fields.expires_at = expiresAt.value;
  }
  if (body.max_clicks !== undefined) {
    const maxClicks = parseOptionalPositiveInteger(body.max_clicks, 'max_clicks');
    if (maxClicks.error) return jsonError(maxClicks.error, 400);
    fields.max_clicks = maxClicks.value;
  }

  if (body.password !== undefined) {
    const passwordHash = await parsePasswordHash(body.password);
    if (passwordHash.error) return jsonError(passwordHash.error, 400);
    fields.password_hash = passwordHash.value;
  }

  if (body.warning_enabled !== undefined) {
    const warningEnabled = parseOptionalBoolean(body.warning_enabled);
    if (warningEnabled === undefined) return jsonError('warning_enabled must be a boolean', 400);
    fields.warning_enabled = warningEnabled;
  }

  if (body.fallback_url !== undefined) {
    const fallbackUrl = normalizeFallbackUrl(body.fallback_url);
    if (fallbackUrl.error) return jsonError(fallbackUrl.error, 400);
    fields.fallback_url = fallbackUrl.value;
  }

  if (body.tags !== undefined) {
    const parsedTags = parseTagsInput(body.tags);
    if (parsedTags.error) return jsonError(parsedTags.error, 400);
    fields.tags = parsedTags.tags.length > 0 ? JSON.stringify(parsedTags.tags) : null;
    await ensureTagRecords(c.env, parsedTags.tags);
  }

  fields.updated_at = now();
  const domainChanged = fields.domain !== undefined && fields.domain !== existing.domain;
  const slugChanged = fields.slug !== undefined && fields.slug !== existing.slug;
  if (domainChanged || slugChanged) {
    await deleteCachedLink(c.env, cacheDomainForLink(existing, fallbackDomain), existing.slug);
    const nextDomain = fields.domain ?? existing.domain ?? fallbackDomain;
    const nextSlug = fields.slug ?? existing.slug;
    fields.short_url = `https://${nextDomain}/${nextSlug}`;
  }

  await updateLink(c.env, id, fields);

  const updated = await getLinkById(c.env, id);
  if (updated) {
    await refreshLinkCache(c.env, cacheDomainForLink(updated, fallbackDomain), updated);
  }
  await recordAudit(c.env, c.req.raw, 'link.update', 'link', id, {
    slug: fields.slug ?? existing.slug,
    changed: Object.keys(fields).filter((field) => field !== 'password_hash'),
    password_changed: 'password_hash' in fields,
  });
  if (updated) {
    c.executionCtx.waitUntil(emitWebhook(c.env, 'link.updated', {
      link: sanitizeLink(updated),
      changed: Object.keys(fields).filter((field) => field !== 'password_hash'),
      password_changed: 'password_hash' in fields,
    }));
  }

  return jsonOk(updated ? sanitizeLink(updated) : null);
});

// DELETE /api/links/:id
links.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await getLinkById(c.env, id);
  if (!existing) return jsonError('Link not found', 404);

  const domain = cacheDomainForLink(existing, requestDomain(c.req.url));

  await deleteRedirectRulesForLink(c.env, id);
  await deleteLink(c.env, id);
  await deleteCachedLink(c.env, domain, existing.slug);
  await recordAudit(c.env, c.req.raw, 'link.delete', 'link', id, { slug: existing.slug });
  c.executionCtx.waitUntil(emitWebhook(c.env, 'link.deleted', { link: sanitizeLink(existing) }));

  return jsonOk({ message: 'Link deleted' });
});

// POST /api/links/:id/disable
links.post('/:id/disable', async (c) => {
  const id = c.req.param('id');
  const existing = await getLinkById(c.env, id);
  if (!existing) return jsonError('Link not found', 404);

  const domain = cacheDomainForLink(existing, requestDomain(c.req.url));
  await updateLink(c.env, id, { status: 'disabled', updated_at: now() });
  await deleteCachedLink(c.env, domain, existing.slug);
  await recordAudit(c.env, c.req.raw, 'link.disable', 'link', id, { slug: existing.slug });
  c.executionCtx.waitUntil(emitWebhook(c.env, 'link.disabled', {
    link: sanitizeLink({ ...existing, status: 'disabled' }),
  }));

  return jsonOk({ message: 'Link disabled' });
});

// POST /api/links/:id/enable
links.post('/:id/enable', async (c) => {
  const id = c.req.param('id');
  const existing = await getLinkById(c.env, id);
  if (!existing) return jsonError('Link not found', 404);

  const domain = cacheDomainForLink(existing, requestDomain(c.req.url));
  await updateLink(c.env, id, { status: 'active', updated_at: now() });

  await refreshLinkCache(c.env, domain, { ...existing, status: 'active' });
  await recordAudit(c.env, c.req.raw, 'link.enable', 'link', id, { slug: existing.slug });
  c.executionCtx.waitUntil(emitWebhook(c.env, 'link.enabled', {
    link: sanitizeLink({ ...existing, status: 'active' }),
  }));

  return jsonOk({ message: 'Link enabled' });
});

// POST /api/links/:id/archive
links.post('/:id/archive', async (c) => {
  const id = c.req.param('id');
  const existing = await getLinkById(c.env, id);
  if (!existing) return jsonError('Link not found', 404);

  const domain = cacheDomainForLink(existing, requestDomain(c.req.url));
  await updateLink(c.env, id, { archived: 1, status: 'archived', updated_at: now() });
  await deleteCachedLink(c.env, domain, existing.slug);
  await recordAudit(c.env, c.req.raw, 'link.archive', 'link', id, { slug: existing.slug });
  c.executionCtx.waitUntil(emitWebhook(c.env, 'link.archived', {
    link: sanitizeLink({ ...existing, archived: 1, status: 'archived' }),
  }));

  return jsonOk({ message: 'Link archived' });
});

// POST /api/links/:id/restore
links.post('/:id/restore', async (c) => {
  const id = c.req.param('id');
  const existing = await getLinkById(c.env, id);
  if (!existing) return jsonError('Link not found', 404);

  const domain = cacheDomainForLink(existing, requestDomain(c.req.url));
  await updateLink(c.env, id, { archived: 0, status: 'active', updated_at: now() });

  await refreshLinkCache(c.env, domain, { ...existing, archived: 0, status: 'active' });
  await recordAudit(c.env, c.req.raw, 'link.restore', 'link', id, { slug: existing.slug });
  c.executionCtx.waitUntil(emitWebhook(c.env, 'link.restored', {
    link: sanitizeLink({ ...existing, archived: 0, status: 'active' }),
  }));

  return jsonOk({ message: 'Link restored' });
});

export default links;

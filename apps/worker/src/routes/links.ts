import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import {
  listLinks,
  getLinkById,
  getLinksByIds,
  createLink,
  updateLink,
  deleteLink,
  createTagsIfMissing,
} from '../db/index';
import { setCachedLink, deleteCachedLink } from '../cache/index';
import { jsonOk, jsonError, jsonCreated } from '../utils/response';
import { generateId, now } from '../utils/id';
import { validateSlug, validateLongUrl } from '@linkora/shared';
import type { Link, KVCacheEntry } from '@linkora/shared';

const links = new Hono<{ Bindings: Env }>();

type BulkAction = 'disable' | 'enable' | 'archive' | 'restore' | 'delete';
type BulkTagMode = 'add' | 'replace' | 'remove' | 'clear';

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
  const authError = requireAuth(c);
  if (authError) return authError;
  await next();
});

// GET /api/links
links.get('/', async (c) => {
  const keyword = c.req.query('keyword');
  const tag = c.req.query('tag');
  const status = c.req.query('status');
  const source = c.req.query('source');
  const sort = c.req.query('sort');
  const page = parseInt(c.req.query('page') ?? '1', 10);
  const pageSize = Math.min(parseInt(c.req.query('pageSize') ?? '20', 10), 100);

  const { items, total } = await listLinks(c.env, {
    keyword,
    tag,
    status,
    source,
    sort,
    page,
    pageSize,
  });

  return jsonOk({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

// POST /api/links
links.post('/', async (c) => {
  let body: Partial<Link> & { tags?: string | string[] };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const { long_url, slug: rawSlug, title, description, redirect_type, status, source } = body;

  if (!long_url) return jsonError('long_url is required', 400);

  const urlValidation = validateLongUrl(long_url);
  if (!urlValidation.valid) return jsonError(urlValidation.error!, 400);

  let slug = rawSlug ?? '';
  if (!slug) {
    // Auto-generate slug
    const { generateSlug } = await import('../utils/id');
    slug = generateSlug(6);
    // Ensure uniqueness (simple retry)
    for (let i = 0; i < 5; i++) {
      const existing = await getLinkById(c.env, slug);
      if (!existing) break;
      slug = generateSlug(6);
    }
  } else {
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) return jsonError(slugValidation.error!, 400);

    // Check uniqueness
    const { getLinkBySlug } = await import('../db/index');
    const existing = await getLinkBySlug(c.env, slug);
    if (existing) return jsonError(`Slug "${slug}" is already in use`, 409);
  }

  const domain = new URL(c.req.url).hostname;
  const id = generateId();
  const ts = now();
  const redirectType = redirect_type === 301 ? 301 : 302;
  const linkStatus = (status as Link['status']) ?? 'active';

  const expiresAt = parseOptionalDate(body.expires_at, 'expires_at');
  if (expiresAt.error) return jsonError(expiresAt.error, 400);

  const maxClicks = parseOptionalPositiveInteger(body.max_clicks, 'max_clicks');
  if (maxClicks.error) return jsonError(maxClicks.error, 400);

  let tagsStr: string | null = null;
  if (body.tags) {
    const tagsArr = Array.isArray(body.tags)
      ? body.tags
      : String(body.tags).split(',').map((t) => t.trim()).filter(Boolean);
    tagsStr = JSON.stringify(tagsArr);
  }

  const link: Link = {
    id,
    slug,
    domain,
    long_url,
    short_url: `https://${domain}/${slug}`,
    title: title ?? null,
    description: description ?? null,
    tags: tagsStr,
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
    password_hash: null,
    warning_enabled: 0,
    fallback_url: null,
    archived: 0,
  };

  await createLink(c.env, link);

  await refreshLinkCache(c.env, domain, link);

  return jsonCreated(link);
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

  const domain = new URL(c.req.url).hostname;
  const existing = await getLinksByIds(c.env, ids);
  const ts = now();
  let successCount = 0;

  for (const link of existing) {
    if (action === 'delete') {
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
    await createTagsIfMissing(c.env, parsedTags.tags.map((tag) => ({
      id: generateId(),
      name: tag,
      color: null,
      description: null,
      created_at: ts,
      updated_at: ts,
    })));
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

  return jsonOk({
    mode,
    tags: parsedTags.tags,
    total: ids.length,
    success: successCount,
    notFound: ids.length - existing.length,
  });
});

// GET /api/links/:id
links.get('/:id', async (c) => {
  const link = await getLinkById(c.env, c.req.param('id'));
  if (!link) return jsonError('Link not found', 404);
  return jsonOk(link);
});

// PUT /api/links/:id
links.put('/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await getLinkById(c.env, id);
  if (!existing) return jsonError('Link not found', 404);

  let body: Partial<Link> & { tags?: string | string[] };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const fields: Partial<Link> = {};
  const domain = new URL(c.req.url).hostname;

  if (body.long_url !== undefined) {
    const urlValidation = validateLongUrl(body.long_url);
    if (!urlValidation.valid) return jsonError(urlValidation.error!, 400);
    fields.long_url = body.long_url;
  }

  if (body.slug !== undefined && body.slug !== existing.slug) {
    const slugValidation = validateSlug(body.slug);
    if (!slugValidation.valid) return jsonError(slugValidation.error!, 400);
    const { getLinkBySlug } = await import('../db/index');
    const conflict = await getLinkBySlug(c.env, body.slug);
    if (conflict && conflict.id !== id) return jsonError(`Slug "${body.slug}" is already in use`, 409);
    fields.slug = body.slug;
    // Delete old KV entry
    await deleteCachedLink(c.env, domain, existing.slug);
  }

  if (body.title !== undefined) fields.title = body.title;
  if (body.description !== undefined) fields.description = body.description;
  if (body.status !== undefined) fields.status = body.status;
  if (body.redirect_type !== undefined) fields.redirect_type = body.redirect_type;
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

  if (body.tags !== undefined) {
    const tagsArr = Array.isArray(body.tags)
      ? body.tags
      : String(body.tags).split(',').map((t) => t.trim()).filter(Boolean);
    fields.tags = JSON.stringify(tagsArr);
  }

  fields.updated_at = now();

  await updateLink(c.env, id, fields);

  const updated = await getLinkById(c.env, id);
  if (updated) {
    await refreshLinkCache(c.env, domain, updated);
  }

  return jsonOk(updated);
});

// DELETE /api/links/:id
links.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await getLinkById(c.env, id);
  if (!existing) return jsonError('Link not found', 404);

  const domain = new URL(c.req.url).hostname;

  await deleteLink(c.env, id);
  await deleteCachedLink(c.env, domain, existing.slug);

  return jsonOk({ message: 'Link deleted' });
});

// POST /api/links/:id/disable
links.post('/:id/disable', async (c) => {
  const id = c.req.param('id');
  const existing = await getLinkById(c.env, id);
  if (!existing) return jsonError('Link not found', 404);

  const domain = new URL(c.req.url).hostname;
  await updateLink(c.env, id, { status: 'disabled', updated_at: now() });
  await deleteCachedLink(c.env, domain, existing.slug);

  return jsonOk({ message: 'Link disabled' });
});

// POST /api/links/:id/enable
links.post('/:id/enable', async (c) => {
  const id = c.req.param('id');
  const existing = await getLinkById(c.env, id);
  if (!existing) return jsonError('Link not found', 404);

  const domain = new URL(c.req.url).hostname;
  await updateLink(c.env, id, { status: 'active', updated_at: now() });

  await refreshLinkCache(c.env, domain, { ...existing, status: 'active' });

  return jsonOk({ message: 'Link enabled' });
});

// POST /api/links/:id/archive
links.post('/:id/archive', async (c) => {
  const id = c.req.param('id');
  const existing = await getLinkById(c.env, id);
  if (!existing) return jsonError('Link not found', 404);

  const domain = new URL(c.req.url).hostname;
  await updateLink(c.env, id, { archived: 1, status: 'archived', updated_at: now() });
  await deleteCachedLink(c.env, domain, existing.slug);

  return jsonOk({ message: 'Link archived' });
});

// POST /api/links/:id/restore
links.post('/:id/restore', async (c) => {
  const id = c.req.param('id');
  const existing = await getLinkById(c.env, id);
  if (!existing) return jsonError('Link not found', 404);

  const domain = new URL(c.req.url).hostname;
  await updateLink(c.env, id, { archived: 0, status: 'active', updated_at: now() });

  await refreshLinkCache(c.env, domain, { ...existing, archived: 0, status: 'active' });

  return jsonOk({ message: 'Link restored' });
});

export default links;

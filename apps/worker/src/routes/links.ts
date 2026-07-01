import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import {
  listLinks,
  getLinkById,
  createLink,
  updateLink,
  deleteLink,
} from '../db/index';
import { setCachedLink, deleteCachedLink } from '../cache/index';
import { jsonOk, jsonError, jsonCreated } from '../utils/response';
import { generateId, now } from '../utils/id';
import { validateSlug, validateLongUrl } from '@linkora/shared';
import type { Link, KVCacheEntry } from '@linkora/shared';

const links = new Hono<{ Bindings: Env }>();

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
    expires_at: null,
    max_clicks: null,
    password_hash: null,
    warning_enabled: 0,
    fallback_url: null,
    archived: 0,
  };

  await createLink(c.env, link);

  // Write to KV
  const cacheEntry: KVCacheEntry = {
    id: link.id,
    slug: link.slug,
    domain: link.domain,
    longUrl: link.long_url,
    redirectType: link.redirect_type,
    status: link.status,
    expiresAt: link.expires_at ?? undefined,
    maxClicks: link.max_clicks ?? undefined,
    warningEnabled: false,
  };
  await setCachedLink(c.env, domain, cacheEntry);

  return jsonCreated(link);
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

  if (body.tags !== undefined) {
    const tagsArr = Array.isArray(body.tags)
      ? body.tags
      : String(body.tags).split(',').map((t) => t.trim()).filter(Boolean);
    fields.tags = JSON.stringify(tagsArr);
  }

  fields.updated_at = now();

  await updateLink(c.env, id, fields);

  // Refresh KV
  const updated = await getLinkById(c.env, id);
  if (updated) {
    const cacheEntry: KVCacheEntry = {
      id: updated.id,
      slug: updated.slug,
      domain: updated.domain ?? undefined,
      longUrl: updated.long_url,
      redirectType: updated.redirect_type,
      status: updated.status,
      expiresAt: updated.expires_at ?? undefined,
      maxClicks: updated.max_clicks ?? undefined,
      warningEnabled: updated.warning_enabled === 1,
    };
    await setCachedLink(c.env, domain, cacheEntry);
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

  const cacheEntry: KVCacheEntry = {
    id: existing.id,
    slug: existing.slug,
    domain: existing.domain ?? undefined,
    longUrl: existing.long_url,
    redirectType: existing.redirect_type,
    status: 'active',
    expiresAt: existing.expires_at ?? undefined,
    maxClicks: existing.max_clicks ?? undefined,
    warningEnabled: existing.warning_enabled === 1,
  };
  await setCachedLink(c.env, domain, cacheEntry);

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

  const cacheEntry: KVCacheEntry = {
    id: existing.id,
    slug: existing.slug,
    domain: existing.domain ?? undefined,
    longUrl: existing.long_url,
    redirectType: existing.redirect_type,
    status: 'active',
    expiresAt: existing.expires_at ?? undefined,
    maxClicks: existing.max_clicks ?? undefined,
    warningEnabled: existing.warning_enabled === 1,
  };
  await setCachedLink(c.env, domain, cacheEntry);

  return jsonOk({ message: 'Link restored' });
});

export default links;

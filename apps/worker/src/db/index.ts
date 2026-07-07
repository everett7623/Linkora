import type { Link, Tag, ImportJob, Setting, Visit } from '@linkora/shared';
import type { Env } from '../types';

export async function getLinkBySlug(env: Env, slug: string): Promise<Link | null> {
  const result = await env.DB.prepare('SELECT * FROM links WHERE slug = ? LIMIT 1')
    .bind(slug)
    .first<Link>();
  return result ?? null;
}

export async function getExistingSlugs(env: Env, slugs: string[]): Promise<Set<string>> {
  const uniqueSlugs = [...new Set(slugs)].filter(Boolean);
  const existing = new Set<string>();

  for (let i = 0; i < uniqueSlugs.length; i += 100) {
    const chunk = uniqueSlugs.slice(i, i + 100);
    if (chunk.length === 0) continue;

    const placeholders = chunk.map(() => '?').join(', ');
    const result = await env.DB.prepare(`SELECT slug FROM links WHERE slug IN (${placeholders})`)
      .bind(...chunk)
      .all<{ slug: string }>();

    for (const row of result.results ?? []) {
      existing.add(row.slug);
    }
  }

  return existing;
}

export async function getLinkById(env: Env, id: string): Promise<Link | null> {
  const result = await env.DB.prepare('SELECT * FROM links WHERE id = ? LIMIT 1')
    .bind(id)
    .first<Link>();
  return result ?? null;
}

export async function getLinksByIds(env: Env, ids: string[]): Promise<Link[]> {
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  const links: Link[] = [];

  for (let i = 0; i < uniqueIds.length; i += 100) {
    const chunk = uniqueIds.slice(i, i + 100);
    if (chunk.length === 0) continue;

    const placeholders = chunk.map(() => '?').join(', ');
    const result = await env.DB.prepare(`SELECT * FROM links WHERE id IN (${placeholders})`)
      .bind(...chunk)
      .all<Link>();

    links.push(...(result.results ?? []));
  }

  return links;
}

export interface ListLinksOptions {
  keyword?: string;
  tag?: string;
  status?: string;
  source?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export async function listLinks(
  env: Env,
  options: ListLinksOptions = {}
): Promise<{ items: Link[]; total: number }> {
  const { keyword, tag, status, source, sort = 'created_at_desc', page = 1, pageSize = 20 } = options;

  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (keyword) {
    conditions.push('(slug LIKE ? OR long_url LIKE ? OR title LIKE ? OR tags LIKE ?)');
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw, kw);
  }

  if (tag) {
    conditions.push('tags LIKE ?');
    params.push(`%"${tag}"%`);
  }

  if (status === 'expired') {
    conditions.push('archived = 0 AND (status = ? OR (expires_at IS NOT NULL AND expires_at < ?) OR (max_clicks IS NOT NULL AND clicks >= max_clicks))');
    params.push(status, new Date().toISOString());
  } else if (status === 'active') {
    conditions.push('status = ? AND archived = 0 AND (expires_at IS NULL OR expires_at >= ?) AND (max_clicks IS NULL OR clicks < max_clicks)');
    params.push(status, new Date().toISOString());
  } else if (status) {
    conditions.push('status = ?');
    params.push(status);
  } else {
    conditions.push('archived = 0');
  }

  if (source) {
    conditions.push('source = ?');
    params.push(source);
  }

  const where = conditions.join(' AND ');

  const sortMap: Record<string, string> = {
    created_at_desc: 'created_at DESC',
    created_at_asc: 'created_at ASC',
    clicks_desc: 'clicks DESC',
    clicks_asc: 'clicks ASC',
    last_clicked_at_desc: 'last_clicked_at DESC NULLS LAST',
  };
  const orderBy = sortMap[sort] ?? 'created_at DESC';

  const offset = (page - 1) * pageSize;

  const countResult = await env.DB.prepare(`SELECT COUNT(*) as count FROM links WHERE ${where}`)
    .bind(...params)
    .first<{ count: number }>();

  const total = countResult?.count ?? 0;

  const rows = await env.DB.prepare(
    `SELECT * FROM links WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  )
    .bind(...params, pageSize, offset)
    .all<Link>();

  return { items: rows.results ?? [], total };
}

export async function createLink(env: Env, link: Link): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO links (id, slug, domain, long_url, short_url, title, description, tags, status, redirect_type, clicks, source, source_id, created_at, updated_at, last_clicked_at, expires_at, max_clicks, password_hash, warning_enabled, fallback_url, archived)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      link.id,
      link.slug,
      link.domain ?? null,
      link.long_url,
      link.short_url ?? null,
      link.title ?? null,
      link.description ?? null,
      link.tags ?? null,
      link.status,
      link.redirect_type,
      link.clicks,
      link.source ?? null,
      link.source_id ?? null,
      link.created_at,
      link.updated_at,
      link.last_clicked_at ?? null,
      link.expires_at ?? null,
      link.max_clicks ?? null,
      link.password_hash ?? null,
      link.warning_enabled,
      link.fallback_url ?? null,
      link.archived
    )
    .run();
}

export async function updateLink(
  env: Env,
  id: string,
  fields: Partial<Link>
): Promise<void> {
  const allowedFields = [
    'slug', 'domain', 'long_url', 'short_url', 'title', 'description',
    'tags', 'status', 'redirect_type', 'clicks', 'source', 'source_id',
    'updated_at', 'last_clicked_at', 'expires_at', 'max_clicks', 'warning_enabled',
    'fallback_url', 'archived',
  ] as const;

  const setClauses: string[] = [];
  const params: unknown[] = [];

  for (const field of allowedFields) {
    if (field in fields) {
      setClauses.push(`${field} = ?`);
      params.push((fields as Record<string, unknown>)[field] ?? null);
    }
  }

  if (setClauses.length === 0) return;

  params.push(id);
  await env.DB.prepare(`UPDATE links SET ${setClauses.join(', ')} WHERE id = ?`)
    .bind(...params)
    .run();
}

export async function deleteLink(env: Env, id: string): Promise<void> {
  await env.DB.prepare('DELETE FROM links WHERE id = ?').bind(id).run();
}

export async function incrementClicks(
  env: Env,
  id: string,
  lastClickedAt: string
): Promise<void> {
  await env.DB.prepare(
    'UPDATE links SET clicks = clicks + 1, last_clicked_at = ? WHERE id = ?'
  )
    .bind(lastClickedAt, id)
    .run();
}

export async function insertVisit(
  env: Env,
  visit: {
    id: string;
    link_id?: string;
    slug: string;
    domain?: string;
    referer?: string;
    country?: string;
    user_agent?: string;
    browser?: string;
    os?: string;
    device_type?: string;
    ip_hash?: string;
    is_bot: number;
    created_at: string;
  }
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO visits (id, link_id, slug, domain, referer, country, user_agent, browser, os, device_type, ip_hash, is_bot, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      visit.id,
      visit.link_id ?? null,
      visit.slug,
      visit.domain ?? null,
      visit.referer ?? null,
      visit.country ?? null,
      visit.user_agent ?? null,
      visit.browser ?? null,
      visit.os ?? null,
      visit.device_type ?? null,
      visit.ip_hash ?? null,
      visit.is_bot,
      visit.created_at
    )
    .run();
}

export async function getOverviewStats(env: Env): Promise<{
  totalLinks: number;
  totalClicks: number;
  todayClicks: number;
  recentLinks: Link[];
  topLinks: Link[];
}> {
  const today = new Date().toISOString().slice(0, 10);

  const [totalLinksResult, totalClicksResult, todayClicksResult, recentLinksResult, topLinksResult] =
    await Promise.all([
      env.DB.prepare("SELECT COUNT(*) as count FROM links WHERE archived = 0").first<{ count: number }>(),
      env.DB.prepare("SELECT SUM(clicks) as total FROM links WHERE archived = 0").first<{ total: number }>(),
      env.DB.prepare("SELECT COUNT(*) as count FROM visits WHERE created_at >= ?").bind(today).first<{ count: number }>(),
      env.DB.prepare("SELECT * FROM links WHERE archived = 0 ORDER BY created_at DESC LIMIT 5").all<Link>(),
      env.DB.prepare("SELECT * FROM links WHERE archived = 0 ORDER BY clicks DESC LIMIT 5").all<Link>(),
    ]);

  return {
    totalLinks: totalLinksResult?.count ?? 0,
    totalClicks: totalClicksResult?.total ?? 0,
    todayClicks: todayClicksResult?.count ?? 0,
    recentLinks: recentLinksResult.results ?? [],
    topLinks: topLinksResult.results ?? [],
  };
}

export async function getAllLinks(env: Env): Promise<Link[]> {
  const result = await env.DB.prepare('SELECT * FROM links ORDER BY created_at DESC').all<Link>();
  return result.results ?? [];
}

export async function getAllVisits(env: Env): Promise<Visit[]> {
  const result = await env.DB.prepare('SELECT * FROM visits ORDER BY created_at DESC').all<Visit>();
  return result.results ?? [];
}

export async function getAllTags(env: Env): Promise<Tag[]> {
  const result = await env.DB.prepare('SELECT * FROM tags ORDER BY name ASC').all<Tag>();
  return result.results ?? [];
}

export async function getAllLinkTagNames(env: Env): Promise<string[]> {
  const result = await env.DB.prepare('SELECT tags FROM links WHERE tags IS NOT NULL AND tags != ""').all<{ tags: string }>();
  const tags = new Set<string>();

  for (const row of result.results ?? []) {
    try {
      const parsed = JSON.parse(row.tags) as unknown;
      if (Array.isArray(parsed)) {
        for (const tag of parsed) {
          const name = String(tag).trim();
          if (name) tags.add(name);
        }
      }
    } catch {
      // Ignore malformed historical tag payloads.
    }
  }

  return [...tags].sort((a, b) => a.localeCompare(b));
}

export async function getTagById(env: Env, id: string): Promise<Tag | null> {
  const result = await env.DB.prepare('SELECT * FROM tags WHERE id = ? LIMIT 1').bind(id).first<Tag>();
  return result ?? null;
}

export async function getTagByName(env: Env, name: string): Promise<Tag | null> {
  const result = await env.DB.prepare('SELECT * FROM tags WHERE name = ? LIMIT 1').bind(name).first<Tag>();
  return result ?? null;
}

export async function createTag(env: Env, tag: Tag): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO tags (id, name, color, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(tag.id, tag.name, tag.color ?? null, tag.description ?? null, tag.created_at, tag.updated_at)
    .run();
}

export async function updateTag(env: Env, id: string, fields: Pick<Tag, 'name' | 'color' | 'description' | 'updated_at'>): Promise<void> {
  await env.DB.prepare(
    'UPDATE tags SET name = ?, color = ?, description = ?, updated_at = ? WHERE id = ?'
  )
    .bind(fields.name, fields.color ?? null, fields.description ?? null, fields.updated_at, id)
    .run();
}

export async function renameTagInLinks(env: Env, oldName: string, newName: string, updatedAt: string): Promise<void> {
  if (oldName === newName) return;

  const result = await env.DB.prepare('SELECT id, tags FROM links WHERE tags LIKE ?')
    .bind(`%"${oldName}"%`)
    .all<{ id: string; tags: string }>();

  for (const row of result.results ?? []) {
    try {
      const parsed = JSON.parse(row.tags) as unknown;
      if (!Array.isArray(parsed)) continue;

      let changed = false;
      const nextTags: string[] = [];
      const seen = new Set<string>();

      for (const rawTag of parsed) {
        const tag = String(rawTag).trim();
        if (!tag) continue;
        const nextTag = tag === oldName ? newName : tag;
        changed = changed || nextTag !== tag;
        if (!seen.has(nextTag)) {
          seen.add(nextTag);
          nextTags.push(nextTag);
        }
      }

      if (changed) {
        await env.DB.prepare('UPDATE links SET tags = ?, updated_at = ? WHERE id = ?')
          .bind(nextTags.length > 0 ? JSON.stringify(nextTags) : null, updatedAt, row.id)
          .run();
      }
    } catch {
      // Ignore malformed historical tag payloads.
    }
  }
}

export async function createTagsIfMissing(env: Env, tags: Tag[]): Promise<void> {
  for (const tag of tags) {
    await env.DB.prepare(
      'INSERT OR IGNORE INTO tags (id, name, color, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(tag.id, tag.name, tag.color ?? null, tag.description ?? null, tag.created_at, tag.updated_at)
      .run();
  }
}

export async function removeTagFromLinks(env: Env, name: string, updatedAt: string): Promise<void> {
  const result = await env.DB.prepare('SELECT id, tags FROM links WHERE tags LIKE ?')
    .bind(`%"${name}"%`)
    .all<{ id: string; tags: string }>();

  for (const row of result.results ?? []) {
    try {
      const parsed = JSON.parse(row.tags) as unknown;
      if (!Array.isArray(parsed)) continue;

      const nextTags = parsed
        .map((tag) => String(tag).trim())
        .filter((tag) => tag && tag !== name);

      await env.DB.prepare('UPDATE links SET tags = ?, updated_at = ? WHERE id = ?')
        .bind(nextTags.length > 0 ? JSON.stringify(nextTags) : null, updatedAt, row.id)
        .run();
    } catch {
      // Ignore malformed historical tag payloads.
    }
  }
}

export async function deleteTag(env: Env, id: string): Promise<void> {
  await env.DB.prepare('DELETE FROM tags WHERE id = ?').bind(id).run();
}

export async function getSettings(env: Env): Promise<Record<string, string>> {
  const result = await env.DB.prepare('SELECT * FROM settings').all<Setting>();
  const map: Record<string, string> = {};
  for (const row of result.results ?? []) {
    map[row.key] = row.value ?? '';
  }
  return map;
}

export async function setSetting(env: Env, key: string, value: string, updatedAt: string): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
  )
    .bind(key, value, updatedAt)
    .run();
}

export async function createImportJob(env: Env, job: ImportJob): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO import_jobs (id, source, filename, total_count, success_count, skipped_count, conflict_count, failed_count, status, report, created_at, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      job.id, job.source, job.filename ?? null,
      job.total_count, job.success_count, job.skipped_count,
      job.conflict_count, job.failed_count, job.status,
      job.report ?? null, job.created_at, job.completed_at ?? null
    )
    .run();
}

export async function updateImportJob(env: Env, id: string, fields: Partial<ImportJob>): Promise<void> {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  const allowed = ['success_count', 'skipped_count', 'conflict_count', 'failed_count', 'status', 'report', 'completed_at', 'total_count'] as const;
  for (const f of allowed) {
    if (f in fields) {
      setClauses.push(`${f} = ?`);
      params.push((fields as Record<string, unknown>)[f] ?? null);
    }
  }
  if (setClauses.length === 0) return;
  params.push(id);
  await env.DB.prepare(`UPDATE import_jobs SET ${setClauses.join(', ')} WHERE id = ?`).bind(...params).run();
}

export async function getImportJobs(env: Env): Promise<ImportJob[]> {
  const result = await env.DB.prepare('SELECT * FROM import_jobs ORDER BY created_at DESC LIMIT 50').all<ImportJob>();
  return result.results ?? [];
}

export async function getImportJobById(env: Env, id: string): Promise<ImportJob | null> {
  const result = await env.DB.prepare('SELECT * FROM import_jobs WHERE id = ? LIMIT 1').bind(id).first<ImportJob>();
  return result ?? null;
}

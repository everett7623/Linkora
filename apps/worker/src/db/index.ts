import type { AuditLog, Backup, Link, Tag, ImportJob, Setting, Visit } from '@linkora/shared';
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
  domain?: string;
  createdFrom?: string;
  createdTo?: string;
  hasPassword?: string;
  warning?: string;
  limits?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export async function listLinks(
  env: Env,
  options: ListLinksOptions = {}
): Promise<{ items: Link[]; total: number }> {
  const {
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
    sort = 'created_at_desc',
    page = 1,
    pageSize = 20,
  } = options;

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

  if (domain) {
    conditions.push('domain = ?');
    params.push(domain);
  }

  if (createdFrom) {
    conditions.push('created_at >= ?');
    params.push(createdFrom);
  }

  if (createdTo) {
    conditions.push('created_at <= ?');
    params.push(createdTo);
  }

  if (hasPassword === 'yes') {
    conditions.push('password_hash IS NOT NULL AND password_hash != ""');
  } else if (hasPassword === 'no') {
    conditions.push('(password_hash IS NULL OR password_hash = "")');
  }

  if (warning === 'yes') {
    conditions.push('warning_enabled = 1');
  } else if (warning === 'no') {
    conditions.push('warning_enabled = 0');
  }

  if (limits === 'yes') {
    conditions.push('(expires_at IS NOT NULL OR max_clicks IS NOT NULL)');
  } else if (limits === 'no') {
    conditions.push('expires_at IS NULL AND max_clicks IS NULL');
  }

  const where = conditions.join(' AND ');

  const sortMap: Record<string, string> = {
    created_at_desc: 'created_at DESC',
    created_at_asc: 'created_at ASC',
    clicks_desc: 'clicks DESC',
    clicks_asc: 'clicks ASC',
    last_clicked_at_desc: 'last_clicked_at DESC NULLS LAST',
    last_clicked_at_asc: 'last_clicked_at ASC NULLS LAST',
    updated_at_desc: 'updated_at DESC',
    updated_at_asc: 'updated_at ASC',
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
    'updated_at', 'last_clicked_at', 'expires_at', 'max_clicks', 'password_hash',
    'warning_enabled', 'fallback_url', 'archived',
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

export async function upsertDailyStats(
  env: Env,
  link: Link,
  date: string,
  country: string | undefined,
  referer: string | undefined,
  updatedAt: string
): Promise<void> {
  const dailyStatsId = `daily:${link.id}:${date}`;

  await env.DB.prepare(
    `INSERT OR IGNORE INTO daily_stats
       (id, link_id, slug, date, clicks, unique_clicks, top_country, top_referer, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?)`
  )
    .bind(
      dailyStatsId,
      link.id,
      link.slug,
      date,
      country ?? null,
      referer ?? null,
      updatedAt,
      updatedAt
    )
    .run();

  await env.DB.prepare(
    `UPDATE daily_stats
     SET clicks = clicks + 1,
         unique_clicks = unique_clicks + 1,
         slug = ?,
         top_country = COALESCE(?, top_country),
         top_referer = COALESCE(?, top_referer),
         updated_at = ?
     WHERE id = ?`
  )
    .bind(link.slug, country ?? null, referer ?? null, updatedAt, dailyStatsId)
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

export interface AnalyticsRangeOptions {
  days?: number;
}

export async function getAnalyticsSummary(
  env: Env,
  options: AnalyticsRangeOptions = {}
): Promise<{
  days: number;
  totalClicks: number;
  botClicks: number;
  uniqueLinks: number;
  daily: Array<{ date: string; clicks: number }>;
  topLinks: Array<{ slug: string; title?: string | null; clicks: number }>;
  topCountries: Array<{ country: string; clicks: number }>;
  topReferrers: Array<{ referer: string; clicks: number }>;
  topBrowsers: Array<{ browser: string; clicks: number }>;
  topDevices: Array<{ device_type: string; clicks: number }>;
  recentVisits: Visit[];
}> {
  const days = Math.max(1, Math.min(options.days ?? 30, 365));
  const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [
    totalClicksResult,
    botClicksResult,
    uniqueLinksResult,
    dailyResult,
    topLinksResult,
    topCountriesResult,
    topReferrersResult,
    topBrowsersResult,
    topDevicesResult,
    recentVisitsResult,
  ] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as count FROM visits WHERE created_at >= ?').bind(since).first<{ count: number }>(),
    env.DB.prepare('SELECT COUNT(*) as count FROM visits WHERE created_at >= ? AND is_bot = 1').bind(since).first<{ count: number }>(),
    env.DB.prepare('SELECT COUNT(DISTINCT slug) as count FROM visits WHERE created_at >= ?').bind(since).first<{ count: number }>(),
    env.DB.prepare(
      `SELECT substr(created_at, 1, 10) as date, COUNT(*) as clicks
       FROM visits
       WHERE created_at >= ?
       GROUP BY substr(created_at, 1, 10)
       ORDER BY date ASC`
    ).bind(since).all<{ date: string; clicks: number }>(),
    env.DB.prepare(
      `SELECT v.slug, l.title, COUNT(*) as clicks
       FROM visits v
       LEFT JOIN links l ON l.slug = v.slug
       WHERE v.created_at >= ?
       GROUP BY v.slug, l.title
       ORDER BY clicks DESC
       LIMIT 10`
    ).bind(since).all<{ slug: string; title?: string | null; clicks: number }>(),
    env.DB.prepare(
      `SELECT COALESCE(country, 'Unknown') as country, COUNT(*) as clicks
       FROM visits
       WHERE created_at >= ?
       GROUP BY COALESCE(country, 'Unknown')
       ORDER BY clicks DESC
       LIMIT 10`
    ).bind(since).all<{ country: string; clicks: number }>(),
    env.DB.prepare(
      `SELECT COALESCE(referer, 'Direct') as referer, COUNT(*) as clicks
       FROM visits
       WHERE created_at >= ?
       GROUP BY COALESCE(referer, 'Direct')
       ORDER BY clicks DESC
       LIMIT 10`
    ).bind(since).all<{ referer: string; clicks: number }>(),
    env.DB.prepare(
      `SELECT COALESCE(browser, 'Other') as browser, COUNT(*) as clicks
       FROM visits
       WHERE created_at >= ?
       GROUP BY COALESCE(browser, 'Other')
       ORDER BY clicks DESC
       LIMIT 10`
    ).bind(since).all<{ browser: string; clicks: number }>(),
    env.DB.prepare(
      `SELECT COALESCE(device_type, 'unknown') as device_type, COUNT(*) as clicks
       FROM visits
       WHERE created_at >= ?
       GROUP BY COALESCE(device_type, 'unknown')
       ORDER BY clicks DESC
       LIMIT 10`
    ).bind(since).all<{ device_type: string; clicks: number }>(),
    env.DB.prepare(
      'SELECT * FROM visits WHERE created_at >= ? ORDER BY created_at DESC LIMIT 20'
    ).bind(since).all<Visit>(),
  ]);

  return {
    days,
    totalClicks: totalClicksResult?.count ?? 0,
    botClicks: botClicksResult?.count ?? 0,
    uniqueLinks: uniqueLinksResult?.count ?? 0,
    daily: dailyResult.results ?? [],
    topLinks: topLinksResult.results ?? [],
    topCountries: topCountriesResult.results ?? [],
    topReferrers: topReferrersResult.results ?? [],
    topBrowsers: topBrowsersResult.results ?? [],
    topDevices: topDevicesResult.results ?? [],
    recentVisits: recentVisitsResult.results ?? [],
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

export interface ListAuditLogsOptions {
  action?: string;
  targetType?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export async function insertAuditLog(env: Env, log: AuditLog): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO audit_logs (id, action, target_type, target_id, detail, ip_hash, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      log.id,
      log.action,
      log.target_type ?? null,
      log.target_id ?? null,
      log.detail ?? null,
      log.ip_hash ?? null,
      log.user_agent ?? null,
      log.created_at
    )
    .run();
}

export async function listAuditLogs(
  env: Env,
  options: ListAuditLogsOptions = {}
): Promise<{ items: AuditLog[]; total: number }> {
  const { action, targetType, keyword, page = 1, pageSize = 50 } = options;
  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (action) {
    conditions.push('action = ?');
    params.push(action);
  }

  if (targetType) {
    conditions.push('target_type = ?');
    params.push(targetType);
  }

  if (keyword) {
    conditions.push('(action LIKE ? OR target_type LIKE ? OR target_id LIKE ? OR detail LIKE ?)');
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw, kw);
  }

  const where = conditions.join(' AND ');
  const offset = (page - 1) * pageSize;

  const countResult = await env.DB.prepare(`SELECT COUNT(*) as count FROM audit_logs WHERE ${where}`)
    .bind(...params)
    .first<{ count: number }>();
  const total = countResult?.count ?? 0;

  const result = await env.DB.prepare(
    `SELECT * FROM audit_logs WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  )
    .bind(...params, pageSize, offset)
    .all<AuditLog>();

  return { items: result.results ?? [], total };
}

export async function createBackupRecord(env: Env, backup: Backup): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO backups (id, filename, storage, size, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(
      backup.id,
      backup.filename,
      backup.storage,
      backup.size ?? null,
      backup.status,
      backup.created_at
    )
    .run();
}

export async function listBackups(env: Env): Promise<Backup[]> {
  const result = await env.DB.prepare('SELECT * FROM backups ORDER BY created_at DESC LIMIT 100').all<Backup>();
  return result.results ?? [];
}

export async function getBackupById(env: Env, id: string): Promise<Backup | null> {
  const result = await env.DB.prepare('SELECT * FROM backups WHERE id = ? LIMIT 1').bind(id).first<Backup>();
  return result ?? null;
}

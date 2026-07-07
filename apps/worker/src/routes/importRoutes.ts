import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import {
  getExistingSlugs,
  getLinkBySlug,
  createLink,
  updateLink,
  createTagsIfMissing,
  createImportJob,
  updateImportJob,
  getImportJobs,
  getImportJobById,
} from '../db/index';
import { deleteCachedLink, setCachedLink } from '../cache/index';
import { jsonOk, jsonError } from '../utils/response';
import { generateId, now } from '../utils/id';
import { ShlinkAdapter } from '../importers/shlink';
import { GenericCsvAdapter, GenericJsonAdapter } from '../importers/generic';
import {
  DubAdapter,
  extractLinkoraBackupTags,
  LinkoraBackupAdapter,
  SinkAdapter,
  YourlsAdapter,
} from '../importers/platforms';
import type { Link, NormalizedImportItem, ImportAdapter, KVCacheEntry } from '@linkora/shared';

const importRoutes = new Hono<{ Bindings: Env }>();

importRoutes.use('*', async (c, next) => {
  const authError = requireAuth(c);
  if (authError) return authError;
  await next();
});

const ADAPTERS: ImportAdapter[] = [
  ShlinkAdapter,
  SinkAdapter,
  YourlsAdapter,
  DubAdapter,
  LinkoraBackupAdapter,
  GenericCsvAdapter,
  GenericJsonAdapter,
];
type ConflictStrategy = 'skip' | 'rename' | 'overwrite';

function detectAdapter(input: unknown, hint?: string): ImportAdapter | null {
  if (hint) {
    const found = ADAPTERS.find((a) => a.source === hint);
    if (found) return found;
  }
  return ADAPTERS.find((a) => a.detect(input)) ?? null;
}

function parseConflictStrategy(value: unknown): ConflictStrategy {
  return value === 'rename' || value === 'overwrite' ? value : 'skip';
}

function makeUniqueSlug(slug: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(slug)) return slug;
  const base = slug.slice(0, 94);
  for (let i = 2; i < 10000; i++) {
    const candidate = `${base}-${i}`;
    if (!existingSlugs.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

function itemTags(item: NormalizedImportItem): string[] {
  return [...new Set((item.tags ?? []).map((tag) => String(tag).trim()).filter(Boolean))];
}

async function ensureImportedTags(env: Env, item: NormalizedImportItem, ts: string): Promise<void> {
  const tags = itemTags(item);
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

function cacheEntryFromLink(link: Link): KVCacheEntry {
  return {
    id: link.id,
    slug: link.slug,
    domain: link.domain ?? undefined,
    longUrl: link.long_url,
    redirectType: link.redirect_type,
    status: link.status,
    expiresAt: link.expires_at ?? undefined,
    maxClicks: link.max_clicks ?? undefined,
    warningEnabled: link.warning_enabled === 1,
  };
}

async function syncImportCache(env: Env, domain: string, link: Link): Promise<void> {
  const isExpired = !!link.expires_at && Date.parse(link.expires_at) < Date.now();
  const reachedMaxClicks = link.max_clicks !== null && link.max_clicks !== undefined && link.clicks >= link.max_clicks;
  if (link.status === 'active' && link.archived === 0 && !isExpired && !reachedMaxClicks) {
    await setCachedLink(env, domain, cacheEntryFromLink(link));
  } else {
    await deleteCachedLink(env, domain, link.slug);
  }
}

function linkFromImportItem(item: NormalizedImportItem, id: string, slug: string, domain: string, ts: string): Link {
  const createdAt = item.createdAt ?? ts;
  const updatedAt = item.updatedAt ?? createdAt;
  return {
    id,
    slug,
    domain,
    long_url: item.longUrl,
    short_url: item.shortUrl ?? `https://${domain}/${slug}`,
    title: item.title ?? null,
    description: item.description ?? null,
    tags: itemTags(item).length > 0 ? JSON.stringify(itemTags(item)) : null,
    status: item.status ?? 'active',
    redirect_type: item.redirectType ?? 302,
    clicks: item.clicks ?? 0,
    source: item.source ?? null,
    source_id: item.sourceId ?? null,
    created_at: createdAt,
    updated_at: updatedAt,
    last_clicked_at: item.lastClickedAt ?? null,
    expires_at: item.expiresAt ?? null,
    max_clicks: item.maxClicks ?? null,
    password_hash: null,
    warning_enabled: item.warningEnabled ? 1 : 0,
    fallback_url: item.fallbackUrl ?? null,
    archived: item.archived ?? 0,
  };
}

function overwriteFieldsFromImportItem(item: NormalizedImportItem, existing: Link, ts: string): Partial<Link> {
  return {
    long_url: item.longUrl,
    short_url: item.shortUrl ?? existing.short_url,
    title: item.title ?? null,
    description: item.description ?? null,
    tags: itemTags(item).length > 0 ? JSON.stringify(itemTags(item)) : null,
    status: item.status ?? existing.status,
    redirect_type: item.redirectType ?? existing.redirect_type,
    clicks: item.clicks ?? existing.clicks,
    source: item.source ?? existing.source,
    source_id: item.sourceId ?? existing.source_id,
    updated_at: item.updatedAt ?? ts,
    last_clicked_at: item.lastClickedAt ?? existing.last_clicked_at,
    expires_at: item.expiresAt ?? existing.expires_at,
    max_clicks: item.maxClicks ?? existing.max_clicks,
    warning_enabled: item.warningEnabled === undefined ? existing.warning_enabled : item.warningEnabled ? 1 : 0,
    fallback_url: item.fallbackUrl ?? existing.fallback_url,
    archived: item.archived ?? existing.archived,
  };
}

async function previewItems(
  env: Env,
  items: NormalizedImportItem[],
  adapter: ImportAdapter
): Promise<{
  total: number;
  valid: number;
  invalid: number;
  conflicts: number;
  preview: Array<NormalizedImportItem & { _valid: boolean; _errors: string[]; _conflict: boolean }>;
}> {
  const validationResults = items.map((item) => ({
    item,
    validation: adapter.validate(item),
  }));
  const validItems = validationResults
    .filter(({ validation }) => validation.valid)
    .map(({ item }) => item);
  const existingSlugs = await getExistingSlugs(env, validItems.map((item) => item.slug));

  let invalid = 0;
  let conflicts = 0;
  const preview: Array<NormalizedImportItem & { _valid: boolean; _errors: string[]; _conflict: boolean }> = [];

  for (let i = 0; i < validationResults.length; i++) {
    const { item, validation } = validationResults[i];
    const conflict = validation.valid && existingSlugs.has(item.slug);

    if (!validation.valid) invalid++;
    if (conflict) conflicts++;

    if (i < 200) {
      preview.push({
        ...item,
        _valid: validation.valid,
        _errors: validation.errors,
        _conflict: conflict,
      });
    }
  }

  const valid = validItems.length - conflicts;

  return { total: items.length, valid, invalid, conflicts, preview };
}

// POST /api/import/preview
importRoutes.post('/preview', async (c) => {
  let body: { content?: string; source?: string };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const { content, source } = body;
  if (!content) return jsonError('content is required', 400);

  let parsedInput: unknown = content;
  try {
    parsedInput = JSON.parse(content);
  } catch {
    parsedInput = content;
  }

  const adapter = detectAdapter(parsedInput, source);
  if (!adapter) return jsonError('Could not detect import format. Please specify source type.', 400);

  const items = await adapter.parse(parsedInput);
  const result = await previewItems(c.env, items, adapter);

  return jsonOk({ source: adapter.source, ...result });
});

// POST /api/import/confirm
importRoutes.post('/confirm', async (c) => {
  let body: { content?: string; source?: string; filename?: string; conflictStrategy?: string };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const { content, source, filename } = body;
  const conflictStrategy = parseConflictStrategy(body.conflictStrategy);
  if (!content) return jsonError('content is required', 400);

  let parsedInput: unknown = content;
  try {
    parsedInput = JSON.parse(content);
  } catch {
    parsedInput = content;
  }

  const adapter = detectAdapter(parsedInput, source);
  if (!adapter) return jsonError('Could not detect import format.', 400);

  const items = await adapter.parse(parsedInput);
  const domain = new URL(c.req.url).hostname;

  const jobId = generateId();
  const ts = now();

  await createImportJob(c.env, {
    id: jobId,
    source: adapter.source,
    filename: filename ?? null,
    total_count: items.length,
    success_count: 0,
    skipped_count: 0,
    conflict_count: 0,
    failed_count: 0,
    status: 'processing',
    report: null,
    created_at: ts,
    completed_at: null,
  });

  if (adapter.source === 'linkora-backup') {
    const backupTags = extractLinkoraBackupTags(parsedInput);
    if (backupTags.length > 0) await createTagsIfMissing(c.env, backupTags);
  }

  let successCount = 0;
  let skippedCount = 0;
  let conflictCount = 0;
  let failedCount = 0;
  const reportRows: string[] = ['slug,status,reason'];
  const validSlugs = items
    .filter((item) => adapter.validate(item).valid)
    .map((item) => item.slug);
  const existingSlugs = await getExistingSlugs(c.env, validSlugs);

  for (const item of items) {
    const validation = adapter.validate(item);
    if (!validation.valid) {
      failedCount++;
      reportRows.push(`${item.slug},failed,"${validation.errors.join('; ')}"`);
      continue;
    }

    let slug = item.slug;
    const hasConflict = existingSlugs.has(slug);

    if (hasConflict && conflictStrategy === 'skip') {
      conflictCount++;
      skippedCount++;
      reportRows.push(`${item.slug},skipped,slug already exists`);
      continue;
    }

    if (hasConflict && conflictStrategy === 'rename') {
      conflictCount++;
      slug = makeUniqueSlug(slug, existingSlugs);
    }

    try {
      if (hasConflict && conflictStrategy === 'overwrite') {
        conflictCount++;
        const existing = await getLinkBySlug(c.env, slug);
        if (!existing) {
          failedCount++;
          reportRows.push(`${item.slug},failed,conflicting link disappeared before overwrite`);
          continue;
        }

        await updateLink(c.env, existing.id, overwriteFieldsFromImportItem(item, existing, ts));
        const overwritten = { ...existing, ...overwriteFieldsFromImportItem(item, existing, ts) } as Link;
        await ensureImportedTags(c.env, item, ts);
        await syncImportCache(c.env, domain, overwritten);
        successCount++;
        reportRows.push(`${item.slug},overwritten,slug already existed`);
        continue;
      }

      const id = generateId();
      const link = linkFromImportItem(item, id, slug, domain, ts);
      await createLink(c.env, link);
      await ensureImportedTags(c.env, item, link.updated_at);
      await syncImportCache(c.env, domain, link);

      successCount++;
      existingSlugs.add(slug);
      reportRows.push(slug === item.slug ? `${item.slug},success,` : `${item.slug},renamed,${slug}`);
    } catch (err) {
      failedCount++;
      reportRows.push(`${item.slug},failed,"${String(err)}"`);
    }
  }

  const completedAt = now();
  await updateImportJob(c.env, jobId, {
    success_count: successCount,
    skipped_count: skippedCount,
    conflict_count: conflictCount,
    failed_count: failedCount,
    status: 'completed',
    report: reportRows.join('\n'),
    completed_at: completedAt,
  });

  return jsonOk({
    jobId,
    total: items.length,
    success: successCount,
    skipped: skippedCount,
    conflicts: conflictCount,
    failed: failedCount,
    conflictStrategy,
    completedAt,
  });
});

// GET /api/import/jobs
importRoutes.get('/jobs', async (c) => {
  const jobs = await getImportJobs(c.env);
  return jsonOk(jobs);
});

// GET /api/import/jobs/:id
importRoutes.get('/jobs/:id', async (c) => {
  const job = await getImportJobById(c.env, c.req.param('id'));
  if (!job) return jsonError('Import job not found', 404);
  return jsonOk(job);
});

// GET /api/import/jobs/:id/report.csv
importRoutes.get('/jobs/:id/report.csv', async (c) => {
  const job = await getImportJobById(c.env, c.req.param('id'));
  if (!job) return jsonError('Import job not found', 404);

  const report = job.report ?? 'slug,status,reason\n';
  const date = job.created_at.slice(0, 10);
  return new Response(report, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="import-report-${date}.csv"`,
    },
  });
});

export default importRoutes;

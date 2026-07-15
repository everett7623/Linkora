import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import {
  getExistingSlugs,
  getLinkBySlug,
  createLinksBatch,
  createRedirectRule,
  updateLink,
  createTagsIfMissing,
  createImportJob,
  deleteRedirectRulesForLink,
  updateImportJob,
  getImportJobs,
  getImportJobById,
} from '../db/index';
import { recordAudit } from '../audit/index';
import { emitWebhook } from '../webhooks/index';
import { deleteCachedLink, setCachedLink } from '../cache/index';
import { jsonOk, jsonError } from '../utils/response';
import { generateId, now } from '../utils/id';
import { ShlinkAdapter } from '../importers/shlink';
import { GenericCsvAdapter, GenericJsonAdapter } from '../importers/generic';
import {
  DubAdapter,
  extractLinketryBackupRedirectRules,
  extractLinketryBackupTags,
  LinketryBackupAdapter,
  SinkAdapter,
  YourlsAdapter,
} from '../importers/platforms';
import { normalizeDomain } from '../importers/domain';
import { runAfterImportQueueBoundary } from '../importers/queue';
import { chunkImportItems } from '../importers/batching';
import type { ImportFieldMapping, Link, NormalizedImportItem, ImportAdapter, KVCacheEntry, RedirectRule } from '@linketry/shared';

const importRoutes = new Hono<{ Bindings: Env }>();

importRoutes.use('*', async (c, next) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  await next();
});

const ADAPTERS: ImportAdapter[] = [
  ShlinkAdapter,
  SinkAdapter,
  YourlsAdapter,
  DubAdapter,
  LinketryBackupAdapter,
  GenericCsvAdapter,
  GenericJsonAdapter,
];
type ConflictStrategy = 'skip' | 'rename' | 'overwrite';
type ShlinkApiPagination = {
  currentPage?: number;
  pagesTotal?: number;
  pagesCount?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
};

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

function parseFieldMapping(value: unknown): ImportFieldMapping | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const mapping: ImportFieldMapping = {};
  for (const [key, rawValue] of Object.entries(value)) {
    if (typeof rawValue === 'string') {
      mapping[key as keyof NormalizedImportItem] = rawValue;
    } else if (Array.isArray(rawValue)) {
      mapping[key as keyof NormalizedImportItem] = rawValue.map(String).filter(Boolean);
    }
  }
  return Object.keys(mapping).length > 0 ? mapping : undefined;
}

function inputForAdapter(input: unknown, adapter: ImportAdapter, fieldMapping?: ImportFieldMapping): unknown {
  if (!fieldMapping || !adapter.source.startsWith('generic-')) return input;
  return { input, fieldMapping };
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
  const cacheDomain = normalizeDomain(link.domain) ?? domain;
  const isExpired = !!link.expires_at && Date.parse(link.expires_at) < Date.now();
  const reachedMaxClicks = link.max_clicks !== null && link.max_clicks !== undefined && link.clicks >= link.max_clicks;
  if (link.status === 'active' && link.archived === 0 && !link.password_hash && !isExpired && !reachedMaxClicks) {
    await setCachedLink(env, cacheDomain, cacheEntryFromLink(link));
  } else {
    await deleteCachedLink(env, cacheDomain, link.slug);
  }
}

function linkFromImportItem(item: NormalizedImportItem, id: string, slug: string, domain: string, ts: string): Link {
  const createdAt = item.createdAt ?? ts;
  const updatedAt = item.updatedAt ?? createdAt;
  const importedDomain = normalizeDomain(item.domain) ?? domain;
  return {
    id,
    slug,
    domain: importedDomain,
    long_url: item.longUrl,
    short_url: item.shortUrl ?? `https://${importedDomain}/${slug}`,
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
    password_hash: item.passwordHash ?? null,
    warning_enabled: item.warningEnabled ? 1 : 0,
    fallback_url: item.fallbackUrl ?? null,
    archived: item.archived ?? 0,
  };
}

function overwriteFieldsFromImportItem(item: NormalizedImportItem, existing: Link, ts: string): Partial<Link> {
  return {
    domain: normalizeDomain(item.domain) ?? existing.domain,
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
    password_hash: item.passwordHash ?? existing.password_hash,
    warning_enabled: item.warningEnabled === undefined ? existing.warning_enabled : item.warningEnabled ? 1 : 0,
    fallback_url: item.fallbackUrl ?? existing.fallback_url,
    archived: item.archived ?? existing.archived,
  };
}

function backupLinkIdFromItem(item: NormalizedImportItem): string | undefined {
  if (typeof item.raw === 'object' && item.raw !== null && !Array.isArray(item.raw)) {
    const rawId = (item.raw as { id?: unknown }).id;
    if (typeof rawId === 'string' && rawId.trim()) return rawId.trim();
  }
  return item.sourceId;
}

async function restoreBackupRedirectRules(
  env: Env,
  rules: RedirectRule[],
  linkIdByBackupId: Map<string, string>,
  replaceRuleLinkIds: Set<string>,
  ts: string
): Promise<number> {
  if (rules.length === 0 || linkIdByBackupId.size === 0) return 0;

  for (const linkId of replaceRuleLinkIds) {
    await deleteRedirectRulesForLink(env, linkId);
  }

  let restored = 0;
  for (const rule of rules) {
    const linkId = linkIdByBackupId.get(rule.link_id);
    if (!linkId) continue;

    await createRedirectRule(env, {
      ...rule,
      id: generateId(),
      link_id: linkId,
      created_at: rule.created_at || ts,
      updated_at: rule.updated_at || ts,
    });
    restored++;
  }

  return restored;
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

function shlinkShortUrlsEndpoint(baseUrl: string): string {
  const url = new URL(baseUrl);
  const clean = url.toString().replace(/\/+$/, '');
  if (/\/short-urls$/i.test(clean)) return clean;
  if (/\/rest\/v\d+$/i.test(clean)) return `${clean}/short-urls`;
  return `${clean}/rest/v3/short-urls`;
}

function extractShlinkShortUrls(payload: unknown): { items: unknown[]; pagination?: ShlinkApiPagination } {
  const root = payload as Record<string, unknown>;
  const data = root?.data && typeof root.data === 'object' ? root.data as Record<string, unknown> : root;
  const shortUrls = data?.shortUrls as unknown;

  if (Array.isArray(shortUrls)) {
    return { items: shortUrls, pagination: data.pagination as ShlinkApiPagination | undefined };
  }

  if (shortUrls && typeof shortUrls === 'object') {
    const container = shortUrls as Record<string, unknown>;
    const items = Array.isArray(container.data) ? container.data : [];
    return { items, pagination: container.pagination as ShlinkApiPagination | undefined };
  }

  if (Array.isArray(root)) return { items: root };
  return { items: [] };
}

async function fetchShlinkApiItems(baseUrl: string, apiKey: string): Promise<unknown[]> {
  const endpoint = shlinkShortUrlsEndpoint(baseUrl);
  const items: unknown[] = [];
  const pageSize = 100;

  for (let page = 1; page <= 100; page++) {
    const url = new URL(endpoint);
    url.searchParams.set('page', String(page));
    url.searchParams.set('itemsPerPage', String(pageSize));

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'X-Api-Key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Shlink API returned ${response.status}`);
    }

    const payload = await response.json();
    const { items: pageItems, pagination } = extractShlinkShortUrls(payload);
    items.push(...pageItems);

    const pagesTotal = shlinkPagesTotal(pagination);
    if (pageItems.length === 0) break;
    if (pagesTotal && page >= pagesTotal) break;
    if (!pagesTotal && pageItems.length < pageSize) break;
    if (pagination?.totalItems && items.length >= pagination.totalItems) break;
    if (items.length >= 5000) break;
  }

  return items;
}

function shlinkPagesTotal(pagination?: ShlinkApiPagination): number | undefined {
  const value = pagination?.pagesTotal ?? pagination?.pagesCount ?? pagination?.totalPages;
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : undefined;
}

// POST /api/v1/import/shlink-api/fetch
importRoutes.post('/shlink-api/fetch', async (c) => {
  let body: { baseUrl?: string; apiKey?: string };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const baseUrl = body.baseUrl?.trim();
  const apiKey = body.apiKey?.trim();
  if (!baseUrl) return jsonError('baseUrl is required', 400);
  if (!apiKey) return jsonError('apiKey is required', 400);

  try {
    const items = await fetchShlinkApiItems(baseUrl, apiKey);
    const content = JSON.stringify({ data: { shortUrls: { data: items } } }, null, 2);
    await recordAudit(c.env, c.req.raw, 'import.shlink_api.fetch', 'import', undefined, {
      baseUrl,
      total: items.length,
    });
    return jsonOk({
      source: 'shlink',
      total: items.length,
      content,
      filename: `shlink-api-${new Date().toISOString().slice(0, 10)}.json`,
    });
  } catch (err) {
    return jsonError(String(err), 502);
  }
});

// POST /api/v1/import/preview
importRoutes.post('/preview', async (c) => {
  let body: { content?: string; source?: string; fieldMapping?: unknown };
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

  const fieldMapping = parseFieldMapping(body.fieldMapping);
  const items = await adapter.parse(inputForAdapter(parsedInput, adapter, fieldMapping));
  const result = await previewItems(c.env, items, adapter);

  return jsonOk({ source: adapter.source, ...result });
});

async function runImportJob(
  env: Env,
  jobId: string,
  adapter: ImportAdapter,
  items: NormalizedImportItem[],
  parsedInput: unknown,
  domain: string,
  conflictStrategy: ConflictStrategy,
  ts: string
): Promise<void> {
  let successCount = 0;
  let skippedCount = 0;
  let conflictCount = 0;
  let failedCount = 0;
  const reportRows: string[] = ['slug,status,reason'];

  try {
    if (adapter.source === 'linketry-backup') {
      const backupTags = extractLinketryBackupTags(parsedInput);
      if (backupTags.length > 0) await createTagsIfMissing(env, backupTags);
    }

    const backupRedirectRules = adapter.source === 'linketry-backup'
      ? extractLinketryBackupRedirectRules(parsedInput)
      : [];
    const linkIdByBackupId = new Map<string, string>();
    const replaceRuleLinkIds = new Set<string>();

    const validSlugs = items
      .filter((item) => adapter.validate(item).valid)
      .map((item) => item.slug);
    const existingSlugs = await getExistingSlugs(env, validSlugs);
    const plannedCreates: Array<{ item: NormalizedImportItem; link: Link }> = [];
    const plannedOverwrites: NormalizedImportItem[] = [];

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

      if (hasConflict && conflictStrategy === 'overwrite') {
        conflictCount++;
        plannedOverwrites.push(item);
        continue;
      }

      const link = linkFromImportItem(item, generateId(), slug, domain, ts);
      plannedCreates.push({ item, link });
      existingSlugs.add(slug);
    }

    const importTagNames = [...new Set(
      [...plannedCreates.map(({ item }) => item), ...plannedOverwrites]
        .flatMap((item) => itemTags(item))
    )];
    if (importTagNames.length > 0) {
      await createTagsIfMissing(env, importTagNames.map((name) => ({
        id: generateId(),
        name,
        color: null,
        description: null,
        created_at: ts,
        updated_at: ts,
      })));
    }

    const persistProgress = async (): Promise<void> => {
      await updateImportJob(env, jobId, {
        success_count: successCount,
        skipped_count: skippedCount,
        conflict_count: conflictCount,
        failed_count: failedCount,
      });
    };
    await persistProgress();

    for (const batch of chunkImportItems(plannedCreates)) {
      try {
        await createLinksBatch(env, batch.map(({ link }) => link));
        for (const { item, link } of batch) {
          const backupLinkId = backupLinkIdFromItem(item);
          if (adapter.source === 'linketry-backup' && backupLinkId) {
            linkIdByBackupId.set(backupLinkId, link.id);
          }
          successCount++;
          reportRows.push(link.slug === item.slug ? `${item.slug},success,` : `${item.slug},renamed,${link.slug}`);
        }
      } catch (batchError) {
        console.warn('[import] D1 batch failed; retrying links individually', {
          jobId,
          batchSize: batch.length,
          error: String(batchError),
        });
        for (const { item, link } of batch) {
          try {
            await createLinksBatch(env, [link]);
            const backupLinkId = backupLinkIdFromItem(item);
            if (adapter.source === 'linketry-backup' && backupLinkId) {
              linkIdByBackupId.set(backupLinkId, link.id);
            }
            successCount++;
            reportRows.push(link.slug === item.slug ? `${item.slug},success,` : `${item.slug},renamed,${link.slug}`);
          } catch (error) {
            failedCount++;
            reportRows.push(`${item.slug},failed,"${String(error)}"`);
          }
        }
      }
      await persistProgress();
      console.log('[import] create batch completed', {
        jobId,
        batchSize: batch.length,
        completed: successCount + skippedCount + failedCount,
        total: items.length,
      });
    }

    for (const [index, item] of plannedOverwrites.entries()) {
      try {
        const existing = await getLinkBySlug(env, item.slug);
        if (!existing) {
          failedCount++;
          reportRows.push(`${item.slug},failed,conflicting link disappeared before overwrite`);
          continue;
        }

        const fields = overwriteFieldsFromImportItem(item, existing, ts);
        await deleteCachedLink(env, normalizeDomain(existing.domain) ?? domain, existing.slug);
        await updateLink(env, existing.id, fields);
        const overwritten = { ...existing, ...fields } as Link;
        await syncImportCache(env, domain, overwritten);
        const backupLinkId = backupLinkIdFromItem(item);
        if (adapter.source === 'linketry-backup' && backupLinkId) {
          linkIdByBackupId.set(backupLinkId, existing.id);
          replaceRuleLinkIds.add(existing.id);
        }
        successCount++;
        reportRows.push(`${item.slug},overwritten,slug already existed`);
      } catch (error) {
        failedCount++;
        reportRows.push(`${item.slug},failed,"${String(error)}"`);
      }
      if ((index + 1) % 10 === 0 || index === plannedOverwrites.length - 1) {
        await persistProgress();
        console.log('[import] overwrite progress', {
          jobId,
          completed: successCount + skippedCount + failedCount,
          total: items.length,
        });
      }
    }

    const redirectRulesRestored = await restoreBackupRedirectRules(
      env,
      backupRedirectRules,
      linkIdByBackupId,
      replaceRuleLinkIds,
      ts
    );

    const completedAt = now();
    await updateImportJob(env, jobId, {
      success_count: successCount,
      skipped_count: skippedCount,
      conflict_count: conflictCount,
      failed_count: failedCount,
      status: 'completed',
      report: reportRows.join('\n'),
      completed_at: completedAt,
    });
    await emitWebhook(env, 'import.completed', {
      jobId,
      source: adapter.source,
      total: items.length,
      success: successCount,
      skipped: skippedCount,
      conflicts: conflictCount,
      failed: failedCount,
      conflictStrategy,
      redirectRulesRestored,
      completedAt,
    });
  } catch (err) {
    await updateImportJob(env, jobId, {
      success_count: successCount,
      skipped_count: skippedCount,
      conflict_count: conflictCount,
      failed_count: failedCount,
      status: 'failed',
      report: reportRows.join('\n'),
      completed_at: now(),
    });
    console.error('Import job failed', err);
  }
}

function importFailureReport(error: unknown): string {
  const reason = (error instanceof Error ? error.message : String(error)).replace(/"/g, '""');
  return `slug,status,reason\n,failed,"${reason}"`;
}

async function runQueuedImportJob(
  env: Env,
  request: Request,
  jobId: string,
  content: string,
  source: string | undefined,
  rawFieldMapping: unknown,
  domain: string,
  conflictStrategy: ConflictStrategy,
  ts: string
): Promise<void> {
  try {
    await runAfterImportQueueBoundary(
      // The first D1 await is intentional: it yields before any expensive parsing so
      // the confirm request can return the pending job to the Admin immediately.
      () => updateImportJob(env, jobId, { status: 'processing' }),
      async () => {
        console.log('[import] parsing queued job', { jobId, source: source ?? 'auto' });

        let parsedInput: unknown = content;
        try {
          parsedInput = JSON.parse(content);
        } catch {
          parsedInput = content;
        }

        const adapter = detectAdapter(parsedInput, source);
        if (!adapter) throw new Error('Could not detect import format.');

        const fieldMapping = parseFieldMapping(rawFieldMapping);
        const items = await adapter.parse(inputForAdapter(parsedInput, adapter, fieldMapping));
        await updateImportJob(env, jobId, {
          source: adapter.source,
          total_count: items.length,
        });
        await recordAudit(env, request, 'import.confirm', 'import', jobId, {
          source: adapter.source,
          total: items.length,
          conflictStrategy,
        }).catch(() => {});

        console.log('[import] queued job parsed', { jobId, source: adapter.source, total: items.length });
        await runImportJob(env, jobId, adapter, items, parsedInput, domain, conflictStrategy, ts);
      }
    );
  } catch (error) {
    const completedAt = now();
    await updateImportJob(env, jobId, {
      status: 'failed',
      report: importFailureReport(error),
      completed_at: completedAt,
    }).catch((updateError) => {
      console.error('[import] failed to persist queued job failure', { jobId, error: String(updateError) });
    });
    console.error('[import] queued job failed', { jobId, error: String(error) });
  }
}

// POST /api/v1/import/confirm
importRoutes.post('/confirm', async (c) => {
  let body: { content?: string; source?: string; filename?: string; conflictStrategy?: string; fieldMapping?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const { content, source, filename } = body;
  const conflictStrategy = parseConflictStrategy(body.conflictStrategy);
  if (!content) return jsonError('content is required', 400);

  const domain = new URL(c.req.url).hostname;

  const jobId = generateId();
  const ts = now();

  await createImportJob(c.env, {
    id: jobId,
    source: source?.trim() || 'auto',
    filename: filename ?? null,
    total_count: 0,
    success_count: 0,
    skipped_count: 0,
    conflict_count: 0,
    failed_count: 0,
    status: 'pending',
    report: null,
    created_at: ts,
    completed_at: null,
  });

  c.executionCtx.waitUntil(
    runQueuedImportJob(
      c.env,
      c.req.raw,
      jobId,
      content,
      source,
      body.fieldMapping,
      domain,
      conflictStrategy,
      ts
    )
  );

  return jsonOk({
    jobId,
    status: 'pending',
    total: 0,
    conflictStrategy,
  });
});

// GET /api/v1/import/jobs
importRoutes.get('/jobs', async (c) => {
  const jobs = await getImportJobs(c.env);
  const response = jsonOk(jobs);
  response.headers.set('Cache-Control', 'no-store');
  return response;
});

// GET /api/v1/import/jobs/:id
importRoutes.get('/jobs/:id', async (c) => {
  const job = await getImportJobById(c.env, c.req.param('id'));
  if (!job) return jsonError('Import job not found', 404);
  const response = jsonOk(job);
  response.headers.set('Cache-Control', 'no-store');
  return response;
});

// GET /api/v1/import/jobs/:id/report.csv
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

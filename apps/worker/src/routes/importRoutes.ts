import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { getLinkBySlug, createLink, createImportJob, updateImportJob, getImportJobs, getImportJobById } from '../db/index';
import { setCachedLink } from '../cache/index';
import { jsonOk, jsonError, jsonCreated } from '../utils/response';
import { generateId, now } from '../utils/id';
import { ShlinkAdapter } from '../importers/shlink';
import { GenericCsvAdapter, GenericJsonAdapter } from '../importers/generic';
import type { NormalizedImportItem, ImportAdapter, KVCacheEntry } from '@linkora/shared';

const importRoutes = new Hono<{ Bindings: Env }>();

importRoutes.use('*', async (c, next) => {
  const authError = requireAuth(c);
  if (authError) return authError;
  await next();
});

const ADAPTERS: ImportAdapter[] = [ShlinkAdapter, GenericCsvAdapter, GenericJsonAdapter];

function detectAdapter(input: unknown, hint?: string): ImportAdapter | null {
  if (hint) {
    const found = ADAPTERS.find((a) => a.source === hint);
    if (found) return found;
  }
  return ADAPTERS.find((a) => a.detect(input)) ?? null;
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
  const preview = await Promise.all(
    items.slice(0, 200).map(async (item) => {
      const validation = adapter.validate(item);
      let conflict = false;
      if (validation.valid) {
        const existing = await getLinkBySlug(env, item.slug);
        conflict = !!existing;
      }
      return { ...item, _valid: validation.valid, _errors: validation.errors, _conflict: conflict };
    })
  );

  // For large batches, count totals efficiently
  let valid = 0, invalid = 0, conflicts = 0;
  for (const item of items) {
    const v = adapter.validate(item);
    if (v.valid) {
      valid++;
      // We already checked conflicts for first 200 in preview
    } else {
      invalid++;
    }
  }

  // Count conflicts from full set
  const conflictSlugs = await Promise.all(
    items
      .filter((i) => adapter.validate(i).valid)
      .map(async (i) => {
        const ex = await getLinkBySlug(env, i.slug);
        return ex ? 1 : 0;
      })
  );
  conflicts = (conflictSlugs as number[]).reduce((a, b) => a + b, 0);
  valid = valid - conflicts;

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
  let body: { content?: string; source?: string; filename?: string };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const { content, source, filename } = body;
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

  let successCount = 0;
  let skippedCount = 0;
  let conflictCount = 0;
  let failedCount = 0;
  const reportRows: string[] = ['slug,status,reason'];

  for (const item of items) {
    const validation = adapter.validate(item);
    if (!validation.valid) {
      failedCount++;
      reportRows.push(`${item.slug},failed,"${validation.errors.join('; ')}"`);
      continue;
    }

    const existing = await getLinkBySlug(c.env, item.slug);
    if (existing) {
      conflictCount++;
      skippedCount++;
      reportRows.push(`${item.slug},skipped,slug already exists`);
      continue;
    }

    try {
      const tagsStr = item.tags && item.tags.length > 0 ? JSON.stringify(item.tags) : null;
      const id = generateId();
      const linkTs = item.createdAt ?? ts;

      await createLink(c.env, {
        id,
        slug: item.slug,
        domain,
        long_url: item.longUrl,
        short_url: item.shortUrl ?? `https://${domain}/${item.slug}`,
        title: item.title ?? null,
        description: item.description ?? null,
        tags: tagsStr,
        status: 'active',
        redirect_type: 302,
        clicks: item.clicks ?? 0,
        source: item.source ?? adapter.source,
        source_id: item.sourceId ?? null,
        created_at: linkTs,
        updated_at: linkTs,
        last_clicked_at: item.lastClickedAt ?? null,
        expires_at: null,
        max_clicks: null,
        password_hash: null,
        warning_enabled: 0,
        fallback_url: null,
        archived: 0,
      });

      // Write to KV cache
      const cacheEntry: KVCacheEntry = {
        id,
        slug: item.slug,
        domain,
        longUrl: item.longUrl,
        redirectType: 302,
        status: 'active',
        expiresAt: undefined,
        maxClicks: undefined,
        warningEnabled: false,
      };
      await setCachedLink(c.env, domain, cacheEntry);

      successCount++;
      reportRows.push(`${item.slug},success,`);
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

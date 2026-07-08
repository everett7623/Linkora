import { Hono } from 'hono';
import type {
  Link,
  LinkHealthBatchResult,
  LinkHealthCheckResult,
  LinkHealthMethod,
  LinkHealthStatus,
} from '@linkora/shared';
import { validateLongUrl } from '@linkora/shared';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { getLinkById, getLinksByIds, listLinks } from '../db/index';
import { recordAudit } from '../audit/index';
import { now } from '../utils/id';
import { jsonError, jsonOk } from '../utils/response';

const healthChecks = new Hono<{ Bindings: Env }>();

const FETCH_TIMEOUT_MS = 8000;
const MAX_BATCH_SIZE = 50;
const RETRY_WITH_GET_STATUSES = new Set([403, 405, 406, 501]);

healthChecks.use('*', async (c, next) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  await next();
});

healthChecks.post('/url', async (c) => {
  let body: { url?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const url = typeof body.url === 'string' ? body.url.trim() : '';
  const validation = validateLongUrl(url);
  if (!validation.valid) return jsonError(validation.error!, 400);

  const result = await checkUrl(url);
  return jsonOk(result);
});

healthChecks.post('/links/:id', async (c) => {
  const link = await getLinkById(c.env, c.req.param('id'));
  if (!link) return jsonError('Link not found', 404);

  const result = await checkLink(link);
  await recordAudit(c.env, c.req.raw, 'health_check.link', 'link', link.id, {
    slug: link.slug,
    status: result.status,
    http_status: result.http_status,
  });

  return jsonOk(result);
});

healthChecks.post('/batch', async (c) => {
  let body: { ids?: unknown; limit?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const links = await linksForBatch(c.env, body);
  if ('error' in links) return jsonError(links.error, links.status);

  const results: LinkHealthCheckResult[] = [];
  for (const link of links.value) {
    results.push(await checkLink(link));
  }

  const summary = summarizeResults(results);
  await recordAudit(c.env, c.req.raw, 'health_check.batch', 'health_check', undefined, summary);
  return jsonOk(summary);
});

async function linksForBatch(
  env: Env,
  body: { ids?: unknown; limit?: unknown }
): Promise<{ value: Link[] } | { error: string; status: number }> {
  if (Array.isArray(body.ids)) {
    const ids = [...new Set(body.ids.map((id) => String(id).trim()).filter(Boolean))];
    if (ids.length === 0) return { error: 'ids must include at least one link id', status: 400 };
    if (ids.length > MAX_BATCH_SIZE) return { error: `ids cannot include more than ${MAX_BATCH_SIZE} links`, status: 400 };
    return { value: await getLinksByIds(env, ids) };
  }

  const limit = parseLimit(body.limit);
  if (limit === null) return { error: `limit must be between 1 and ${MAX_BATCH_SIZE}`, status: 400 };

  const result = await listLinks(env, {
    status: 'active',
    page: 1,
    pageSize: limit,
    sort: 'updated_at_desc',
  });
  return { value: result.items };
}

function parseLimit(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return 20;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_BATCH_SIZE) return null;
  return parsed;
}

async function checkLink(link: Link): Promise<LinkHealthCheckResult> {
  const result = await checkUrl(link.long_url);
  return {
    ...result,
    link_id: link.id,
    slug: link.slug,
    domain: link.domain ?? null,
    fallback_url: link.fallback_url ?? null,
  };
}

async function checkUrl(url: string): Promise<LinkHealthCheckResult> {
  const startedAt = Date.now();
  const checkedAt = now();

  try {
    let response = await fetchForHealth(url, 'HEAD');
    let method: LinkHealthMethod = 'HEAD';

    if (RETRY_WITH_GET_STATUSES.has(response.status)) {
      response = await fetchForHealth(url, 'GET');
      method = 'GET';
    }

    const responseTimeMs = Date.now() - startedAt;
    return {
      url,
      final_url: response.url || url,
      status: statusFromHttp(response.status),
      http_status: response.status,
      method,
      response_time_ms: responseTimeMs,
      checked_at: checkedAt,
      error: null,
    };
  } catch (error) {
    return {
      url,
      final_url: null,
      status: 'broken',
      http_status: null,
      response_time_ms: Date.now() - startedAt,
      checked_at: checkedAt,
      error: error instanceof Error ? normalizeError(error.message) : 'Unable to fetch URL',
    };
  }
}

async function fetchForHealth(url: string, method: LinkHealthMethod): Promise<Response> {
  return fetch(url, {
    method,
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      Accept: method === 'HEAD' ? '*/*' : 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
      'User-Agent': 'Linkora/0.1 health-check (+https://github.com/EvenFrank/Linkora)',
      ...(method === 'GET' ? { Range: 'bytes=0-0' } : {}),
    },
  });
}

function statusFromHttp(status: number): LinkHealthStatus {
  if (status >= 200 && status < 400) return 'healthy';
  if (status >= 400 && status < 500) return 'warning';
  return 'broken';
}

function normalizeError(message: string): string {
  if (/timeout|timed out|aborted/i.test(message)) return 'Request timed out';
  return message || 'Unable to fetch URL';
}

function summarizeResults(items: LinkHealthCheckResult[]): LinkHealthBatchResult {
  return {
    items,
    total: items.length,
    healthy: items.filter((item) => item.status === 'healthy').length,
    warning: items.filter((item) => item.status === 'warning').length,
    broken: items.filter((item) => item.status === 'broken').length,
  };
}

export default healthChecks;

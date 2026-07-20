import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { handleRedirect } from './routes/redirect';
import { runScheduledHealthChecks } from './routes/healthChecks';
import publicStatsRoutes from './routes/publicStats';
import { createScheduledAnalyticsReport } from './analytics/scheduledReports';
import { runScheduledTrafficAnomalyCheck } from './analytics/trafficAnomalies';
import { processVisitQueueBatch } from './analytics/index';
import { createR2Backup } from './backups/index';
import { cleanupBackupRetention } from './backups/retention';
import { emitWebhook } from './webhooks/index';
import { cleanupAnalyticsRetention } from './db/analytics';
import type { VisitQueueMessage } from '@linketry/shared';
import { jsonError, jsonOk, notFound } from './utils/response';
import { resolvePublicLocale } from './utils/publicPages';
import { getPublicPageMessage } from './utils/pageTemplates';
import { DEFAULT_DAILY_CRON, scheduledWorkForCron } from './health/schedulePolicy';
import { healthCors } from './health/cors';
import { getDailyCron, getHealthCron, getRuntimeVersion } from './config/runtime';
import { registerAdminApiRoutes } from './routes/api';
import { isLegacyApiPath } from './routes/apiVersion';
import { checkDemoRateLimit, isPublicReadOnlyDemo, isReadOnlyMethod } from './demo/policy';

const RESERVED_PATHS = new Set([
  'admin',
  'api',
  'health',
  'login',
  'settings',
  'assets',
  'static',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
]);

const app = new Hono<{ Bindings: Env }>();

// Public runtime-version checks are read-only and may come from a separately hosted Admin.
app.use('/health', healthCors);

// CORS for admin frontend
app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use('/api/*', async (c, next) => {
  if (!isPublicReadOnlyDemo(c.env)) {
    await next();
    return;
  }

  const method = c.req.raw.method;
  if (!isReadOnlyMethod(method)) {
    return jsonError('The public Linketry Demo is read-only.', 403);
  }

  if (method === 'OPTIONS') {
    await next();
    return;
  }

  try {
    const rateLimit = await checkDemoRateLimit(c.env, c.req.raw);
    c.header('X-RateLimit-Limit', String(rateLimit.limit));
    if (!rateLimit.allowed) {
      c.header('Retry-After', String(rateLimit.retryAfterSeconds));
      return jsonError('Demo request limit exceeded. Please try again shortly.', 429);
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        message: 'Demo rate-limit check failed closed',
        error: error instanceof Error ? error.message : String(error),
      })
    );
    return jsonError('The public Demo is temporarily unavailable.', 503);
  }

  await next();
});

app.use('/api/*', async (c, next) => {
  await next();
  if (isLegacyApiPath(c.req.path)) {
    c.header('Deprecation', 'true');
    c.header('Link', '</api/v1>; rel="successor-version"');
  }
});

app.route('/', publicStatsRoutes);

// Health check
app.get('/health', (c) => {
  return jsonOk({
    status: 'ok',
    name: 'Linketry',
    version: getRuntimeVersion(c.env),
  });
});

registerAdminApiRoutes(app);

// Slug redirect - catch all (must be last)
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  if (RESERVED_PATHS.has(slug.toLowerCase())) {
    return notFound(
      await getPublicPageMessage(c.env, '404', { slug }),
      resolvePublicLocale(c.req.header('Accept-Language'))
    );
  }
  return handleRedirect(c);
});

app.post('/:slug', async (c) => {
  const slug = c.req.param('slug');
  if (RESERVED_PATHS.has(slug.toLowerCase())) {
    return notFound(
      await getPublicPageMessage(c.env, '404', { slug }),
      resolvePublicLocale(c.req.header('Accept-Language'))
    );
  }
  return handleRedirect(c);
});

// Root
app.get('/', (c) => {
  return jsonOk({
    name: 'Linketry',
    version: getRuntimeVersion(c.env),
    status: 'ok',
  });
});

const handler: ExportedHandler<Env, VisitQueueMessage> = {
  fetch(request, env, ctx) {
    return app.fetch(request, env, ctx);
  },
  queue(batch, env, ctx) {
    ctx.waitUntil(processVisitQueueBatch(env, batch));
  },
  scheduled(controller, env, ctx) {
    const dailyCron = getDailyCron(env, DEFAULT_DAILY_CRON);
    const work = scheduledWorkForCron(controller.cron, dailyCron, getHealthCron(env));

    if (work.health) {
      ctx.waitUntil(
        runScheduledHealthChecks(env).catch((error) => {
          console.error('Scheduled Linketry health monitoring failed', error);
        })
      );
    }

    if (work.daily) {
      ctx.waitUntil(
        cleanupAnalyticsRetention(env).catch((error) => {
          console.error('Scheduled Linketry analytics retention cleanup failed', error);
        })
      );
      ctx.waitUntil(
        cleanupBackupRetention(env).catch((error) => {
          console.error('Scheduled Linketry backup retention cleanup failed', error);
        })
      );
      ctx.waitUntil(
        createScheduledAnalyticsReport(env).catch((error) =>
          console.error('Scheduled Analytics report failed', error)
        )
      );
      ctx.waitUntil(
        runScheduledTrafficAnomalyCheck(env).catch((error) =>
          console.error('Scheduled traffic anomaly check failed', error)
        )
      );
    }
    if (work.daily && env.BACKUPS) {
      ctx.waitUntil(
        createR2Backup(env, 'scheduled')
          .then((backup) => emitWebhook(env, 'backup.completed', { backup, trigger: 'scheduled' }))
          .catch((error) => {
            console.error('Scheduled Linketry backup failed', error);
            return emitWebhook(env, 'backup.failed', {
              trigger: 'scheduled',
              error: error instanceof Error ? error.message : String(error),
            });
          })
      );
    }
  },
};

export default handler;

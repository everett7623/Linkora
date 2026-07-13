import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { handleRedirect } from './routes/redirect';
import authRoutes from './routes/auth';
import linksRoutes from './routes/links';
import tagsRoutes from './routes/tags';
import settingsRoutes from './routes/settings';
import domainRoutes from './routes/domains';
import exportRoutes from './routes/export';
import importRoutes from './routes/importRoutes';
import metadataRoutes from './routes/metadata';
import auditRoutes from './routes/audit';
import analyticsRoutes from './routes/analytics';
import conversionRoutes from './routes/conversions';
import backupRoutes from './routes/backups';
import tokenRoutes from './routes/tokens';
import webhookRoutes from './routes/webhooks';
import redirectRuleRoutes from './routes/redirectRules';
import groupRoutes from './routes/groups';
import healthCheckRoutes, { runScheduledHealthChecks } from './routes/healthChecks';
import maintenanceRoutes from './routes/maintenance';
import systemRoutes from './routes/system';
import publicStatsRoutes from './routes/publicStats';
import analyticsViewRoutes from './routes/analyticsViews';
import analyticsReportRoutes from './routes/analyticsReports';
import { createScheduledAnalyticsReport } from './analytics/scheduledReports';
import utmTemplateRoutes from './routes/utmTemplates';
import linkNoteRoutes from './routes/linkNotes';
import { processVisitQueueBatch } from './analytics/index';
import { createR2Backup } from './backups/index';
import { cleanupBackupRetention } from './backups/retention';
import { emitWebhook } from './webhooks/index';
import { cleanupAnalyticsRetention } from './db/analytics';
import { LINKORA_VERSION, type VisitQueueMessage } from '@linkora/shared';
import { getOverviewStats } from './db/index';
import { requireAuth } from './auth/index';
import { jsonOk, notFound } from './utils/response';
import { resolvePublicLocale } from './utils/publicPages';
import { getPublicPageMessage } from './utils/pageTemplates';

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

// CORS for admin frontend
app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

app.route('/', publicStatsRoutes);

// Health check
app.get('/health', (c) => {
  return jsonOk({
    status: 'ok',
    name: 'Linkora',
    version: c.env.LINKORA_VERSION ?? LINKORA_VERSION,
  });
});

// Auth routes
app.route('/api/auth', authRoutes);

// Links CRUD
app.route('/api/links', linksRoutes);

// Tags
app.route('/api/tags', tagsRoutes);

// Settings
app.route('/api/settings', settingsRoutes);

// Domains
app.route('/api/domains', domainRoutes);

// Export
app.route('/api/export', exportRoutes);

// Import
app.route('/api/import', importRoutes);

// Metadata helpers
app.route('/api/metadata', metadataRoutes);

// Audit logs
app.route('/api/audit', auditRoutes);

// Analytics
app.route('/api/analytics', analyticsRoutes);
app.route('/api/analytics-views', analyticsViewRoutes);
app.route('/api/analytics-reports', analyticsReportRoutes);
app.route('/api/utm-templates', utmTemplateRoutes);
app.route('/api/link-notes', linkNoteRoutes);

// Conversion events
app.route('/api/conversions', conversionRoutes);

// Backups
app.route('/api/backups', backupRoutes);

// API Tokens
app.route('/api/tokens', tokenRoutes);

// Webhooks
app.route('/api/webhooks', webhookRoutes);

// Smart redirect rules
app.route('/api/redirect-rules', redirectRuleRoutes);

// Campaigns and project groups
app.route('/api/groups', groupRoutes);

// Link health checks
app.route('/api/health-checks', healthCheckRoutes);

// Maintenance
app.route('/api/maintenance', maintenanceRoutes);

// Deployment capabilities
app.route('/api/system', systemRoutes);

// Overview stats
app.get('/api/overview', async (c) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  const stats = await getOverviewStats(c.env);
  return jsonOk(stats);
});

// Slug redirect - catch all (must be last)
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  if (RESERVED_PATHS.has(slug.toLowerCase())) {
    return notFound(await getPublicPageMessage(c.env, '404', { slug }), resolvePublicLocale(c.req.header('Accept-Language')));
  }
  return handleRedirect(c);
});

app.post('/:slug', async (c) => {
  const slug = c.req.param('slug');
  if (RESERVED_PATHS.has(slug.toLowerCase())) {
    return notFound(await getPublicPageMessage(c.env, '404', { slug }), resolvePublicLocale(c.req.header('Accept-Language')));
  }
  return handleRedirect(c);
});

// Root
app.get('/', (c) => {
  return jsonOk({
    name: 'Linkora',
    version: c.env.LINKORA_VERSION ?? LINKORA_VERSION,
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
  scheduled(_controller, env, ctx) {
    ctx.waitUntil(
      cleanupAnalyticsRetention(env).catch((error) => {
        console.error('Scheduled Linkora analytics retention cleanup failed', error);
      })
    );
    ctx.waitUntil(
      cleanupBackupRetention(env).catch((error) => {
        console.error('Scheduled Linkora backup retention cleanup failed', error);
      })
    );
    ctx.waitUntil(
      runScheduledHealthChecks(env).catch((error) => {
        console.error('Scheduled Linkora health monitoring failed', error);
      })
    );
    ctx.waitUntil(createScheduledAnalyticsReport(env).catch((error) => console.error('Scheduled Analytics report failed', error)));
    if (env.BACKUPS) {
      ctx.waitUntil(
        createR2Backup(env, 'scheduled')
          .then((backup) => emitWebhook(env, 'backup.completed', { backup, trigger: 'scheduled' }))
          .catch((error) => {
            console.error('Scheduled Linkora backup failed', error);
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

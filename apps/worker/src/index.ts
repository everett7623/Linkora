import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { handleRedirect } from './routes/redirect';
import authRoutes from './routes/auth';
import linksRoutes from './routes/links';
import tagsRoutes from './routes/tags';
import settingsRoutes from './routes/settings';
import exportRoutes from './routes/export';
import importRoutes from './routes/importRoutes';
import metadataRoutes from './routes/metadata';
import auditRoutes from './routes/audit';
import analyticsRoutes from './routes/analytics';
import { getOverviewStats } from './db/index';
import { requireAuth } from './auth/index';
import { jsonOk } from './utils/response';

const RESERVED_PATHS = new Set([
  'admin', 'api', 'health', 'login', 'settings',
  'assets', 'static', 'favicon.ico', 'robots.txt', 'sitemap.xml',
]);

const app = new Hono<{ Bindings: Env }>();

// CORS for admin frontend
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/health', (c) => {
  return jsonOk({
    status: 'ok',
    name: 'Linkora',
    version: c.env.LINKORA_VERSION ?? '0.1.0',
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

// Overview stats
app.get('/api/overview', async (c) => {
  const authError = requireAuth(c);
  if (authError) return authError;
  const stats = await getOverviewStats(c.env);
  return jsonOk(stats);
});

// Slug redirect - catch all (must be last)
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  if (RESERVED_PATHS.has(slug.toLowerCase())) {
    return new Response('Not Found', { status: 404 });
  }
  return handleRedirect(c);
});

app.post('/:slug', async (c) => {
  const slug = c.req.param('slug');
  if (RESERVED_PATHS.has(slug.toLowerCase())) {
    return new Response('Not Found', { status: 404 });
  }
  return handleRedirect(c);
});

// Root
app.get('/', (c) => {
  return jsonOk({ name: 'Linkora', version: c.env.LINKORA_VERSION ?? '0.1.0', status: 'ok' });
});

export default app;

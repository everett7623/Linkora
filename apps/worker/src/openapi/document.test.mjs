import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { API_OPERATIONS, createOpenApiDocument } from './document.ts';

const routeModules = [
  ['analytics.ts', '/analytics', 'analyticsRoutes'],
  ['analyticsReports.ts', '/analytics-reports', 'routes'],
  ['trafficAnomalies.ts', '/analytics-alerts', 'trafficAnomalies'],
  ['analyticsViews.ts', '/analytics-views', 'routes'],
  ['audit.ts', '/audit', 'auditRoutes'],
  ['auth.ts', '/auth', 'auth'],
  ['backups.ts', '/backups', 'backupRoutes'],
  ['bulkUtm.ts', '/links/bulk-utm', 'bulkUtm'],
  ['conversions.ts', '/conversions', 'conversions'],
  ['domains.ts', '/domains', 'domainRoutes'],
  ['export.ts', '/export', 'exportRoutes'],
  ['groups.ts', '/groups', 'groups'],
  ['healthChecks.ts', '/health-checks', 'healthChecks'],
  ['importRoutes.ts', '/import', 'importRoutes'],
  ['linkNotes.ts', '/link-notes', 'routes'],
  ['links.ts', '/links', 'links'],
  ['maintenance.ts', '/maintenance', 'maintenanceRoutes'],
  ['metadata.ts', '/metadata', 'metadata'],
  ['notifications.ts', '/notifications', 'notificationRoutes'],
  ['redirectRules.ts', '/redirect-rules', 'redirectRules'],
  ['settings.ts', '/settings', 'settings'],
  ['system.ts', '/system', 'systemRoutes'],
  ['tags.ts', '/tags', 'tags'],
  ['tokens.ts', '/tokens', 'tokenRoutes'],
  ['utmTemplates.ts', '/utm-templates', 'routes'],
  ['webhooks.ts', '/webhooks', 'webhookRoutes'],
];
const normalize = (path) => path.replace(/:([A-Za-z0-9_]+)/g, '{$1}').replace(/\/$/, '') || '/';
const key = (method, path) => `${method.toLowerCase()} ${normalize(path)}`;

test('OpenAPI operation inventory matches mounted Hono route declarations', async () => {
  const declared = new Set(API_OPERATIONS.map((item) => key(item.method, item.path)));
  const discovered = new Set([
    'get /overview',
    'get /public-stats/links/{id}',
    'post /public-stats/links/{id}',
    'delete /public-stats/links/{id}',
  ]);
  for (const [file, base, receiver] of routeModules) {
    const source = await readFile(new URL(`../routes/${file}`, import.meta.url), 'utf8');
    const expression = new RegExp(
      `${receiver}\\.(get|post|put|delete)\\(\\s*['\u0060]([^'\u0060]+)['\u0060]`,
      'g'
    );
    for (const match of source.matchAll(expression))
      discovered.add(key(match[1], `${base}${match[2]}`));
  }
  assert.deepEqual([...declared].sort(), [...discovered].sort());
});

test('OpenAPI document is versioned, secured, unique, and contains no credential examples', () => {
  const document = createOpenApiDocument({}, '0.23.0');
  assert.equal(document.openapi, '3.1.0');
  assert.equal(document.info.version, '0.23.0');
  assert.equal(
    new Set(API_OPERATIONS.map((item) => key(item.method, item.path))).size,
    API_OPERATIONS.length
  );
  assert.deepEqual(document.paths['/auth/login'].post.security, []);
  assert.deepEqual(document.paths['/links'].get.security, [{ bearerAuth: [] }]);
  assert.doesNotMatch(JSON.stringify(document), /LINKETRY_ADMIN_TOKEN|Bearer [A-Za-z0-9_-]{8,}/);
});

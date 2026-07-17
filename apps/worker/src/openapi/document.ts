import type { Env } from '../types';

export type ApiOperation = {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  summary: string;
  tag: string;
  scope?: 'read' | 'write';
};

export const API_OPERATIONS: ApiOperation[] = [
  ['post', '/auth/login', 'Log in with the instance admin token', 'Authentication', 'write'],
  ['get', '/auth/me', 'Check the current bearer token', 'Authentication', 'read'],
  ['post', '/auth/logout', 'End the client session', 'Authentication', 'write'],
  ['get', '/overview', 'Read overview statistics', 'System', 'read'],
  ['get', '/system/capabilities', 'Read deployment capabilities', 'System', 'read'],
  ['get', '/system/upgrade', 'Read online upgrade capability', 'System', 'read'],
  ['post', '/system/upgrade', 'Trigger the configured deployment workflow', 'System', 'write'],
  ['get', '/system/upgrade/{runId}', 'Read deployment workflow status', 'System', 'read'],
  ['get', '/links', 'List and filter links', 'Links', 'read'],
  ['get', '/links/duplicates', 'Find links with the same normalized destination', 'Links', 'read'],
  ['post', '/links', 'Create a link', 'Links', 'write'],
  ['post', '/links/bulk-create', 'Create up to 100 links', 'Links', 'write'],
  ['post', '/links/bulk', 'Apply a bulk link action', 'Links', 'write'],
  ['post', '/links/bulk-tag', 'Update tags in bulk', 'Links', 'write'],
  ['post', '/links/bulk-replace-url/preview', 'Preview destination replacements', 'Links', 'write'],
  ['post', '/links/bulk-replace-url/confirm', 'Confirm destination replacements', 'Links', 'write'],
  ['post', '/links/migrate-domain/preview', 'Preview a short-domain migration', 'Links', 'write'],
  ['post', '/links/migrate-domain/confirm', 'Confirm a short-domain migration', 'Links', 'write'],
  ['post', '/links/bulk-utm/preview', 'Preview bulk UTM changes', 'Links', 'write'],
  ['post', '/links/bulk-utm/confirm', 'Confirm bulk UTM changes', 'Links', 'write'],
  ['get', '/links/{id}', 'Read a link', 'Links', 'read'],
  ['put', '/links/{id}', 'Update a link', 'Links', 'write'],
  ['delete', '/links/{id}', 'Delete a link', 'Links', 'write'],
  ['post', '/links/{id}/disable', 'Disable a link', 'Links', 'write'],
  ['post', '/links/{id}/enable', 'Enable a link', 'Links', 'write'],
  ['post', '/links/{id}/archive', 'Archive a link', 'Links', 'write'],
  ['post', '/links/{id}/restore', 'Restore a link', 'Links', 'write'],
  ['get', '/tags', 'List tags', 'Tags', 'read'],
  ['post', '/tags', 'Create a tag', 'Tags', 'write'],
  ['put', '/tags/{id}', 'Update a tag', 'Tags', 'write'],
  ['delete', '/tags/{id}', 'Delete a tag', 'Tags', 'write'],
  ['get', '/domains', 'List domains', 'Domains', 'read'],
  ['post', '/domains', 'Create a domain', 'Domains', 'write'],
  ['put', '/domains/{id}', 'Update a domain', 'Domains', 'write'],
  ['delete', '/domains/{id}', 'Delete a domain', 'Domains', 'write'],
  ['post', '/domains/{id}/set-default', 'Set the default domain', 'Domains', 'write'],
  ['get', '/settings', 'Read settings', 'Settings', 'read'],
  ['put', '/settings', 'Update settings', 'Settings', 'write'],
  ['get', '/redirect-rules', 'List redirect rules', 'Redirect rules', 'read'],
  ['get', '/redirect-rules/{id}', 'Read a redirect rule', 'Redirect rules', 'read'],
  ['post', '/redirect-rules', 'Create a redirect rule', 'Redirect rules', 'write'],
  ['put', '/redirect-rules/{id}', 'Update a redirect rule', 'Redirect rules', 'write'],
  ['delete', '/redirect-rules/{id}', 'Delete a redirect rule', 'Redirect rules', 'write'],
  ['get', '/groups', 'List campaign and project groups', 'Groups', 'read'],
  ['post', '/groups', 'Create a group', 'Groups', 'write'],
  ['put', '/groups/{id}', 'Update a group', 'Groups', 'write'],
  ['delete', '/groups/{id}', 'Delete a group', 'Groups', 'write'],
  ['get', '/analytics', 'Read analytics', 'Analytics', 'read'],
  ['get', '/analytics/links/{id}', 'Read link analytics', 'Analytics', 'read'],
  ['get', '/analytics-views', 'List saved analytics views', 'Analytics', 'read'],
  ['post', '/analytics-views', 'Create an analytics view', 'Analytics', 'write'],
  ['delete', '/analytics-views/{id}', 'Delete an analytics view', 'Analytics', 'write'],
  ['get', '/analytics-reports', 'Read scheduled report state', 'Analytics', 'read'],
  ['put', '/analytics-reports/config', 'Update report configuration', 'Analytics', 'write'],
  ['post', '/analytics-reports/run', 'Run an analytics report', 'Analytics', 'write'],
  ['get', '/analytics-reports/download', 'Download an analytics report', 'Analytics', 'read'],
  ['get', '/analytics-alerts', 'Read traffic anomaly alert state', 'Analytics', 'read'],
  [
    'put',
    '/analytics-alerts/config',
    'Update traffic anomaly alert configuration',
    'Analytics',
    'write',
  ],
  ['post', '/analytics-alerts/run', 'Run traffic anomaly detection', 'Analytics', 'write'],
  ['post', '/conversions', 'Record a conversion', 'Analytics', 'write'],
  ['get', '/audit', 'List audit events', 'Operations', 'read'],
  ['get', '/backups', 'List backups', 'Backups', 'read'],
  ['post', '/backups/create', 'Create a backup', 'Backups', 'write'],
  ['get', '/backups/{id}/download', 'Download a backup', 'Backups', 'read'],
  ['post', '/backups/{id}/restore-preview', 'Preview a restore', 'Backups', 'write'],
  ['post', '/backups/{id}/restore', 'Restore a backup', 'Backups', 'write'],
  ['post', '/import/shlink-api/fetch', 'Fetch a Shlink API export', 'Import and export', 'write'],
  ['post', '/import/preview', 'Preview an import', 'Import and export', 'write'],
  ['post', '/import/confirm', 'Confirm an import', 'Import and export', 'write'],
  ['get', '/import/jobs', 'List import jobs', 'Import and export', 'read'],
  ['get', '/import/jobs/{id}', 'Read an import job', 'Import and export', 'read'],
  ['get', '/import/jobs/{id}/report.csv', 'Download an import report', 'Import and export', 'read'],
  ['get', '/export/links.csv', 'Export links as CSV', 'Import and export', 'read'],
  ['get', '/export/links.json', 'Export links as JSON', 'Import and export', 'read'],
  ['get', '/export/visits.csv', 'Export visits as CSV', 'Import and export', 'read'],
  ['get', '/export/analytics.csv', 'Export analytics as CSV', 'Import and export', 'read'],
  ['get', '/export/backup.json', 'Export a portable backup', 'Import and export', 'read'],
  ['post', '/metadata/title', 'Resolve a destination title', 'Metadata', 'write'],
  ['post', '/metadata/suggestions', 'Generate local link suggestions', 'Metadata', 'write'],
  ['post', '/metadata/preview', 'Read destination preview metadata', 'Metadata', 'write'],
  ['get', '/health-checks/alerts', 'List health alerts', 'Monitoring', 'read'],
  ['get', '/health-checks/history', 'List health history', 'Monitoring', 'read'],
  ['post', '/health-checks/url', 'Check a target URL', 'Monitoring', 'write'],
  ['post', '/health-checks/links/{id}', 'Check a stored link', 'Monitoring', 'write'],
  ['post', '/health-checks/batch', 'Check links in a batch', 'Monitoring', 'write'],
  ['get', '/notifications/config', 'Read notification configuration', 'Notifications', 'read'],
  [
    'put',
    '/notifications/config/{provider}',
    'Update a notification provider',
    'Notifications',
    'write',
  ],
  [
    'post',
    '/notifications/test/{provider}',
    'Test a notification provider',
    'Notifications',
    'write',
  ],
  ['get', '/webhooks/config', 'Read webhook configuration', 'Webhooks', 'read'],
  ['put', '/webhooks/config', 'Update webhook configuration', 'Webhooks', 'write'],
  ['post', '/webhooks/test', 'Send a test webhook', 'Webhooks', 'write'],
  ['get', '/tokens', 'List API tokens', 'API tokens', 'read'],
  ['post', '/tokens', 'Create an API token', 'API tokens', 'write'],
  ['post', '/tokens/{id}/revoke', 'Revoke an API token', 'API tokens', 'write'],
  ['delete', '/tokens/{id}', 'Delete an API token', 'API tokens', 'write'],
  ['get', '/utm-templates', 'List UTM templates', 'UTM templates', 'read'],
  ['post', '/utm-templates', 'Create a UTM template', 'UTM templates', 'write'],
  ['delete', '/utm-templates/{id}', 'Delete a UTM template', 'UTM templates', 'write'],
  ['get', '/link-notes/{id}', 'Read a private link note', 'Links', 'read'],
  ['put', '/link-notes/{id}', 'Update a private link note', 'Links', 'write'],
  [
    'get',
    '/public-stats/links/{id}',
    'Read public statistics sharing state',
    'Public stats',
    'read',
  ],
  ['post', '/public-stats/links/{id}', 'Enable public statistics', 'Public stats', 'write'],
  ['delete', '/public-stats/links/{id}', 'Disable public statistics', 'Public stats', 'write'],
  ['get', '/maintenance/reset-preview', 'Preview a factory reset', 'Operations', 'read'],
  ['post', '/maintenance/reset', 'Confirm a factory reset', 'Operations', 'write'],
].map(([method, path, summary, tag, scope]) => ({
  method,
  path,
  summary,
  tag,
  scope,
})) as ApiOperation[];

const jsonResponse = (
  description: string,
  schema: Record<string, unknown> = { $ref: '#/components/schemas/ApiSuccess' }
) => ({
  description,
  content: { 'application/json': { schema } },
});

export function createOpenApiDocument(_env: Env, version = '0.26.1') {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const operation of API_OPERATIONS) {
    const parameters = [...operation.path.matchAll(/\{([^}]+)\}/g)].map((match) => ({
      name: match[1],
      in: 'path',
      required: true,
      schema: { type: 'string' },
    }));
    paths[operation.path] ??= {};
    paths[operation.path][operation.method] = {
      operationId: `${operation.method}_${operation.path.replace(/[^a-zA-Z0-9]+/g, '_')}`,
      summary: operation.summary,
      tags: [operation.tag],
      security: operation.path === '/auth/login' ? [] : [{ bearerAuth: [] }],
      ...(parameters.length ? { parameters } : {}),
      ...(operation.method !== 'get' && operation.method !== 'delete'
        ? {
            requestBody: {
              required: false,
              content: {
                'application/json': { schema: { type: 'object', additionalProperties: true } },
              },
            },
          }
        : {}),
      responses: {
        '200': jsonResponse('Successful response'),
        '400': jsonResponse('Invalid request', { $ref: '#/components/schemas/ApiError' }),
        '401': jsonResponse('Missing or invalid bearer token', {
          $ref: '#/components/schemas/ApiError',
        }),
        '403': jsonResponse(`Bearer token lacks ${operation.scope ?? 'read'} access`, {
          $ref: '#/components/schemas/ApiError',
        }),
        '404': jsonResponse('Resource not found', { $ref: '#/components/schemas/ApiError' }),
      },
    };
  }
  return {
    openapi: '3.1.0',
    info: {
      title: 'Linketry API',
      version,
      description:
        'Authenticated administration and integration API. D1 remains the source of truth. The legacy /api alias is deprecated and is not part of this contract.',
    },
    servers: [{ url: '/api/v1', description: 'Current Linketry instance' }],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description:
            'Admin token or a scoped Linketry API token. Tokens are never included in this document.',
        },
      },
      schemas: {
        ApiSuccess: {
          type: 'object',
          required: ['success', 'data'],
          properties: { success: { const: true }, data: {} },
        },
        ApiError: {
          type: 'object',
          required: ['success', 'error'],
          properties: { success: { const: false }, error: { type: 'string' } },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1 },
            total: { type: 'integer', minimum: 0 },
            totalPages: { type: 'integer', minimum: 0 },
          },
        },
      },
    },
  };
}

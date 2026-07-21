import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const DAY_MS = 24 * 60 * 60 * 1_000;
const DEMO_BACKUP_LATEST_KEY = 'backups/linketry-demo-snapshot.json';
const DEMO_BACKUP_PREVIOUS_KEY = 'backups/linketry-demo-pre-release.json';
const DEMO_REPORT_KEY = 'reports/linketry-demo-analytics.csv';

function sqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

function insertWithStableKey(table, columns, rows, conflictKey = 'id') {
  const updateColumns = columns.filter((column) => column !== conflictKey);
  const values = rows
    .map((row) => `  (${columns.map((column) => sqlValue(row[column])).join(', ')})`)
    .join(',\n');
  const updates = updateColumns.map((column) => `${column} = excluded.${column}`).join(', ');
  return `INSERT INTO ${table} (${columns.join(', ')})\nVALUES\n${values}\nON CONFLICT(${conflictKey}) DO UPDATE SET ${updates};`;
}

function syntheticHash(value) {
  return createHash('sha256').update(`linketry-public-demo:${value}`).digest('hex');
}

function isoAgo(now, days, hours = 0) {
  return new Date(now.getTime() - days * DAY_MS - hours * 60 * 60 * 1_000).toISOString();
}

function normalizeOrigin(value) {
  const origin = new URL(value);
  if (origin.protocol !== 'https:' || origin.username || origin.password) {
    throw new Error('Demo origin must be an HTTPS URL without credentials.');
  }
  if (origin.pathname !== '/' || origin.search || origin.hash) {
    throw new Error('Demo origin must not contain a path, query, or fragment.');
  }
  return origin.origin;
}

export function buildDemoSeedSql({ origin: originValue, now: nowValue = new Date() }) {
  const origin = normalizeOrigin(originValue);
  const hostname = new URL(origin).hostname;
  const now = new Date(nowValue);
  if (Number.isNaN(now.getTime())) throw new Error('Demo seed timestamp is invalid.');

  const links = [
    {
      id: 'linketry-demo-link-product',
      slug: 'product',
      long_url: 'https://linketry.com/?utm_source=demo&utm_medium=shortlink&utm_campaign=product',
      title: 'Explore Linketry',
      description: 'Synthetic product campaign link for the public Demo.',
      tags: JSON.stringify(['demo', 'campaign:product', 'project:website']),
    },
    {
      id: 'linketry-demo-link-github',
      slug: 'github',
      long_url:
        'https://github.com/everett7623/Linketry?utm_source=linketry-demo&utm_medium=referral&utm_campaign=opensource',
      title: 'Linketry on GitHub',
      description: 'Synthetic open-source campaign link for the public Demo.',
      tags: JSON.stringify(['demo', 'campaign:opensource', 'project:community']),
    },
    {
      id: 'linketry-demo-link-roadmap',
      slug: 'roadmap',
      long_url:
        'https://linketry.com/?utm_source=newsletter&utm_medium=email&utm_campaign=launch#roadmap',
      title: 'Product roadmap',
      description: 'Synthetic newsletter link demonstrating UTM reporting.',
      tags: JSON.stringify(['demo', 'campaign:launch', 'project:website']),
    },
    {
      id: 'linketry-demo-link-deploy',
      slug: 'deploy',
      long_url:
        'https://linketry.com/?utm_source=docs&utm_medium=referral&utm_campaign=self-hosting#deploy',
      title: 'Self-hosting guide',
      description: 'Synthetic documentation link for deployment analytics.',
      tags: JSON.stringify(['demo', 'campaign:self-hosting', 'project:docs']),
    },
    {
      id: 'linketry-demo-link-features',
      slug: 'features',
      long_url:
        'https://linketry.com/?utm_source=social&utm_medium=organic&utm_campaign=features#features',
      title: 'Feature overview',
      description: 'Synthetic social campaign link for the public Demo.',
      tags: JSON.stringify(['demo', 'campaign:features', 'project:website']),
    },
  ];

  const linkPattern = [0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 4];
  const countries = ['US', 'DE', 'SG', 'GB', 'CA', 'JP', 'AU', 'FR', 'BR', 'IN'];
  const referrers = [
    null,
    'https://www.google.com/',
    'https://github.com/',
    'https://news.ycombinator.com/',
    'https://www.linkedin.com/',
  ];
  const clients = [
    {
      browser: 'Chrome',
      os: 'Windows',
      device_type: 'desktop',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Demo',
    },
    {
      browser: 'Safari',
      os: 'iOS',
      device_type: 'mobile',
      user_agent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile Demo',
    },
    {
      browser: 'Firefox',
      os: 'Linux',
      device_type: 'desktop',
      user_agent: 'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0 Demo',
    },
    {
      browser: 'Chrome',
      os: 'Android',
      device_type: 'mobile',
      user_agent:
        'Mozilla/5.0 (Linux; Android 14; Demo) AppleWebKit/537.36 Chrome/126.0 Mobile Demo',
    },
  ];
  const visits = [];
  const visitTargets = [];
  const clickCounts = new Map(links.map((link) => [link.id, 0]));

  for (let index = 0; index < 84; index += 1) {
    const link = links[linkPattern[index % linkPattern.length]];
    const client = clients[index % clients.length];
    const createdAt = isoAgo(now, index % 14, (index * 5) % 21);
    const id = `linketry-demo-visit-${String(index + 1).padStart(3, '0')}`;
    const isBot = index % 19 === 0 ? 1 : 0;
    clickCounts.set(link.id, (clickCounts.get(link.id) ?? 0) + 1);
    visits.push({
      id,
      link_id: link.id,
      slug: link.slug,
      domain: hostname,
      referer: referrers[index % referrers.length],
      country: countries[index % countries.length],
      user_agent: isBot ? 'LinketryDemoBot/1.0' : client.user_agent,
      browser: isBot ? 'Other' : client.browser,
      os: isBot ? 'Other' : client.os,
      device_type: isBot ? 'bot' : client.device_type,
      ip_hash: syntheticHash(`visitor-${index % 27}`),
      is_bot: isBot,
      created_at: createdAt,
    });
    visitTargets.push({
      id,
      visit_id: id,
      link_id: link.id,
      slug: link.slug,
      domain: hostname,
      target_url: link.long_url,
      redirect_rule_id: null,
      redirect_rule_type: null,
      created_at: createdAt,
    });
  }

  const linkRows = links.map((link, index) => ({
    ...link,
    domain: hostname,
    short_url: `${origin}/${link.slug}`,
    status: index === 4 ? 'disabled' : 'active',
    redirect_type: index === 1 ? 301 : 302,
    clicks: clickCounts.get(link.id) ?? 0,
    source: 'demo-seed',
    source_id: 'linketry-public-demo',
    created_at: isoAgo(now, 45 - index * 4),
    updated_at: now.toISOString(),
    warning_enabled: index === 3 ? 1 : 0,
    archived: 0,
  }));

  const conversions = Array.from({ length: 12 }, (_, index) => {
    const link = links[linkPattern[(index * 5) % linkPattern.length]];
    return {
      id: `linketry-demo-conversion-${String(index + 1).padStart(2, '0')}`,
      link_id: link.id,
      slug: link.slug,
      domain: hostname,
      event_name: index % 3 === 0 ? 'signup' : 'docs_opened',
      value: index % 3 === 0 ? 9 + index : null,
      currency: index % 3 === 0 ? 'USD' : null,
      metadata: JSON.stringify({ synthetic: true, campaign: 'public-demo' }),
      ip_hash: syntheticHash(`conversion-visitor-${index}`),
      user_agent: 'Linketry synthetic Demo event',
      created_at: isoAgo(now, index % 12, index % 8),
    };
  });

  const tags = [
    ['demo', '#f59e0b', 'Synthetic public Demo data'],
    ['campaign:product', '#0ea5e9', 'Synthetic product campaign'],
    ['campaign:launch', '#8b5cf6', 'Synthetic launch campaign'],
    ['project:website', '#22c55e', 'Synthetic website project'],
    ['project:docs', '#ec4899', 'Synthetic documentation project'],
  ].map(([name, color, description], index) => ({
    id: `linketry-demo-tag-${index + 1}`,
    name,
    color,
    description,
    created_at: isoAgo(now, 45),
    updated_at: now.toISOString(),
  }));

  const redirectRules = [
    {
      id: 'linketry-demo-rule-country',
      link_id: links[0].id,
      rule_type: 'country',
      rule_config: JSON.stringify({
        enabled: true,
        values: ['de', 'at'],
        targetUrl: 'https://linketry.com/?utm_source=demo&utm_medium=geo&utm_campaign=product',
      }),
      priority: 10,
      status: 'active',
      created_at: isoAgo(now, 20),
      updated_at: now.toISOString(),
    },
    {
      id: 'linketry-demo-rule-device',
      link_id: links[1].id,
      rule_type: 'device',
      rule_config: JSON.stringify({
        enabled: true,
        values: ['mobile'],
        targetUrl: 'https://github.com/everett7623/Linketry#readme',
      }),
      priority: 20,
      status: 'active',
      created_at: isoAgo(now, 18),
      updated_at: now.toISOString(),
    },
    {
      id: 'linketry-demo-rule-weighted',
      link_id: links[2].id,
      rule_type: 'weighted',
      rule_config: JSON.stringify({
        enabled: true,
        targets: [
          { url: 'https://linketry.com/#roadmap', weight: 70 },
          { url: 'https://github.com/everett7623/Linketry', weight: 30 },
        ],
      }),
      priority: 30,
      status: 'active',
      created_at: isoAgo(now, 16),
      updated_at: now.toISOString(),
    },
  ];

  const importJobs = [
    {
      id: 'linketry-demo-import-shlink',
      source: 'shlink',
      filename: 'synthetic-shlink-export.json',
      total_count: 12,
      success_count: 10,
      skipped_count: 1,
      conflict_count: 1,
      failed_count: 1,
      status: 'completed',
      report:
        'slug,status,reason\nlegacy-docs,skipped,slug conflict\nbroken-row,failed,invalid URL\n',
      created_at: isoAgo(now, 24),
      completed_at: isoAgo(now, 24, -1),
    },
    {
      id: 'linketry-demo-import-generic',
      source: 'generic',
      filename: 'synthetic-campaign-links.csv',
      total_count: 8,
      success_count: 8,
      skipped_count: 0,
      conflict_count: 0,
      failed_count: 0,
      status: 'completed',
      report: 'slug,status,reason\nlaunch-page,created,\nproduct-docs,created,\n',
      created_at: isoAgo(now, 12),
      completed_at: isoAgo(now, 12, -1),
    },
  ];

  const apiTokens = [
    {
      id: 'linketry-demo-token-read',
      name: 'Synthetic reporting client',
      token_hash: syntheticHash('api-token-read'),
      scopes: JSON.stringify(['read']),
      last_used_at: isoAgo(now, 1, 2),
      created_at: isoAgo(now, 30),
      revoked_at: null,
    },
    {
      id: 'linketry-demo-token-revoked',
      name: 'Retired automation token',
      token_hash: syntheticHash('api-token-revoked'),
      scopes: JSON.stringify(['admin']),
      last_used_at: isoAgo(now, 15),
      created_at: isoAgo(now, 40),
      revoked_at: isoAgo(now, 10),
    },
  ];

  const backups = [
    {
      id: 'linketry-demo-backup-latest',
      filename: DEMO_BACKUP_LATEST_KEY,
      storage: 'r2',
      size: 718,
      status: 'completed',
      created_at: isoAgo(now, 1),
    },
    {
      id: 'linketry-demo-backup-previous',
      filename: DEMO_BACKUP_PREVIOUS_KEY,
      storage: 'r2',
      size: 718,
      status: 'completed',
      created_at: isoAgo(now, 7),
    },
  ];

  const savedViews = [
    {
      id: 'linketry-demo-view-campaign',
      name: 'Launch campaign - 30 days',
      filters: { days: 30, utm_campaign: 'launch' },
      created_at: isoAgo(now, 14),
    },
    {
      id: 'linketry-demo-view-mobile',
      name: 'Mobile traffic - 7 days',
      filters: { days: 7, device: 'mobile' },
      created_at: isoAgo(now, 9),
    },
  ];

  const healthHistory = [
    ['linketry-demo-link-product', 'healthy', 200, 142, 0, 0],
    ['linketry-demo-link-github', 'healthy', 200, 218, 0, 1],
    ['linketry-demo-link-roadmap', 'warning', 429, 684, 1, 2],
    ['linketry-demo-link-deploy', 'broken', 503, 1200, 2, 3],
  ].map(([link_id, status, http_status, response_time_ms, consecutive_failures, hours]) => ({
    link_id,
    status,
    http_status,
    checked_at: isoAgo(now, 0, hours),
    response_time_ms,
    consecutive_failures,
  }));

  const reportRecords = [
    {
      key: DEMO_REPORT_KEY,
      created_at: isoAgo(now, 1, 3),
      status: 'completed',
      size: 135,
    },
  ];

  const auditLogs = [
    ['demo.seeded', 'system', 'linketry-public-demo', 'Synthetic Demo dataset refreshed'],
    ['link.created', 'link', links[0].id, 'Synthetic product link created'],
    ['link.created', 'link', links[1].id, 'Synthetic GitHub link created'],
    ['settings.updated', 'settings', 'site_name', 'Synthetic Demo settings configured'],
    [
      'redirect_rule.create',
      'redirect_rule',
      redirectRules[0].id,
      'Synthetic country rule created',
    ],
    ['import.completed', 'import_job', importJobs[0].id, 'Synthetic Shlink import completed'],
    ['backup.create', 'backup', backups[0].id, 'Synthetic R2 backup completed'],
    ['api_token.create', 'api_token', apiTokens[0].id, 'Synthetic read token created'],
    ['health_check.batch', 'health_check', 'synthetic-batch', 'Synthetic health check completed'],
  ].map(([action, target_type, target_id, detail], index) => ({
    id: `linketry-demo-audit-${index + 1}`,
    action,
    target_type,
    target_id,
    detail,
    ip_hash: syntheticHash(`audit-${index}`),
    user_agent: 'Linketry Demo seed',
    created_at: isoAgo(now, index),
  }));

  const statements = [
    '-- Linketry public Demo synthetic dataset. Generated; do not use production data.',
    'PRAGMA foreign_keys = ON;',
    insertWithStableKey(
      'links',
      [
        'id',
        'slug',
        'domain',
        'long_url',
        'short_url',
        'title',
        'description',
        'tags',
        'status',
        'redirect_type',
        'clicks',
        'source',
        'source_id',
        'created_at',
        'updated_at',
        'warning_enabled',
        'archived',
      ],
      linkRows
    ),
    insertWithStableKey(
      'visits',
      [
        'id',
        'link_id',
        'slug',
        'domain',
        'referer',
        'country',
        'user_agent',
        'browser',
        'os',
        'device_type',
        'ip_hash',
        'is_bot',
        'created_at',
      ],
      visits
    ),
    insertWithStableKey(
      'visit_targets',
      [
        'visit_id',
        'link_id',
        'slug',
        'domain',
        'target_url',
        'redirect_rule_id',
        'redirect_rule_type',
        'created_at',
      ],
      visitTargets,
      'visit_id'
    ),
    insertWithStableKey(
      'conversion_events',
      [
        'id',
        'link_id',
        'slug',
        'domain',
        'event_name',
        'value',
        'currency',
        'metadata',
        'ip_hash',
        'user_agent',
        'created_at',
      ],
      conversions
    ),
    insertWithStableKey(
      'tags',
      ['id', 'name', 'color', 'description', 'created_at', 'updated_at'],
      tags
    ),
    insertWithStableKey(
      'redirect_rules',
      [
        'id',
        'link_id',
        'rule_type',
        'rule_config',
        'priority',
        'status',
        'created_at',
        'updated_at',
      ],
      redirectRules
    ),
    insertWithStableKey(
      'import_jobs',
      [
        'id',
        'source',
        'filename',
        'total_count',
        'success_count',
        'skipped_count',
        'conflict_count',
        'failed_count',
        'status',
        'report',
        'created_at',
        'completed_at',
      ],
      importJobs
    ),
    insertWithStableKey(
      'api_tokens',
      ['id', 'name', 'token_hash', 'scopes', 'last_used_at', 'created_at', 'revoked_at'],
      apiTokens
    ),
    insertWithStableKey(
      'backups',
      ['id', 'filename', 'storage', 'size', 'status', 'created_at'],
      backups
    ),
    insertWithStableKey(
      'domains',
      ['id', 'domain', 'is_default', 'status', 'created_at', 'updated_at'],
      [
        {
          id: 'linketry-demo-domain',
          domain: hostname,
          is_default: 1,
          status: 'active',
          created_at: isoAgo(now, 45),
          updated_at: now.toISOString(),
        },
      ]
    ),
    insertWithStableKey(
      'audit_logs',
      ['id', 'action', 'target_type', 'target_id', 'detail', 'ip_hash', 'user_agent', 'created_at'],
      auditLogs
    ),
    `INSERT INTO settings (key, value, updated_at) VALUES
  ('site_name', 'Linketry Public Demo', ${sqlValue(now.toISOString())}),
  ('default_domain', ${sqlValue(hostname)}, ${sqlValue(now.toISOString())}),
  ('default_redirect_type', '302', ${sqlValue(now.toISOString())}),
  ('analytics_retention_days', '0', ${sqlValue(now.toISOString())}),
  ('backup_retention_days', '30', ${sqlValue(now.toISOString())}),
  ('health_monitoring_enabled', 'true', ${sqlValue(now.toISOString())}),
  ('health_monitoring_limit', '5', ${sqlValue(now.toISOString())}),
  ('health_failure_threshold', '2', ${sqlValue(now.toISOString())}),
  ('health_alert_suppression_minutes', '1440', ${sqlValue(now.toISOString())}),
  ('health_monitoring_cursor', '4', ${sqlValue(now.toISOString())}),
  ('health_check_history', ${sqlValue(JSON.stringify(healthHistory))}, ${sqlValue(now.toISOString())}),
  ('health_alert_state', ${sqlValue(JSON.stringify({ failures: { 'linketry-demo-link-roadmap': 1, 'linketry-demo-link-deploy': 2 }, alerted: ['linketry-demo-link-deploy'], lastAlertAt: isoAgo(now, 0, 3) }))}, ${sqlValue(now.toISOString())}),
  ('analytics_saved_views', ${sqlValue(JSON.stringify(savedViews))}, ${sqlValue(now.toISOString())}),
  ('analytics_report_schedule', ${sqlValue(JSON.stringify({ enabled: true, days: 30, saved_view_id: savedViews[0].id }))}, ${sqlValue(now.toISOString())}),
  ('analytics_report_records', ${sqlValue(JSON.stringify(reportRecords))}, ${sqlValue(now.toISOString())})
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
  ];

  return `${statements.join('\n\n')}\n`;
}

export function buildDemoArtifacts({
  origin: originValue,
  now: nowValue = new Date(),
  version = '0.25.2',
}) {
  const origin = normalizeOrigin(originValue);
  const now = new Date(nowValue);
  if (Number.isNaN(now.getTime())) throw new Error('Demo artifact timestamp is invalid.');
  const backupBody = JSON.stringify(
    {
      name: 'Linketry Backup',
      version,
      exportedAt: now.toISOString(),
      links: [
        {
          id: 'linketry-demo-link-product',
          slug: 'product',
          domain: new URL(origin).hostname,
          long_url: 'https://linketry.com/',
          title: 'Explore Linketry',
          tags: JSON.stringify(['demo', 'campaign:product']),
          status: 'active',
          redirect_type: 302,
          clicks: 42,
        },
      ],
      tags: [{ id: 'linketry-demo-tag-1', name: 'demo', color: '#f59e0b' }],
      redirectRules: [],
      settings: { site_name: 'Linketry Public Demo', default_domain: new URL(origin).hostname },
    },
    null,
    2
  );
  const reportBody = [
    'section,label,value',
    'summary,total_clicks,84',
    'summary,unique_visitors,27',
    'summary,conversions,12',
    'top_links,product,35',
    'top_links,github,21',
  ].join('\n');

  return [
    {
      key: DEMO_BACKUP_LATEST_KEY,
      filename: 'backup-latest.json',
      contentType: 'application/json; charset=utf-8',
      body: backupBody,
    },
    {
      key: DEMO_BACKUP_PREVIOUS_KEY,
      filename: 'backup-previous.json',
      contentType: 'application/json; charset=utf-8',
      body: backupBody,
    },
    {
      key: DEMO_REPORT_KEY,
      filename: 'analytics-report.csv',
      contentType: 'text/csv; charset=utf-8',
      body: `${reportBody}\n`,
    },
  ];
}

function parseArgs(argv) {
  const result = { origin: '', output: '', artifactDir: '', version: '0.25.2' };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--origin') result.origin = argv[++index] ?? '';
    else if (argument === '--output') result.output = argv[++index] ?? '';
    else if (argument === '--artifact-dir') result.artifactDir = argv[++index] ?? '';
    else if (argument === '--version') result.version = argv[++index] ?? '';
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!result.origin || !result.output) {
    throw new Error('Usage: node scripts/demo-seed.mjs --origin <https-url> --output <sql-file>');
  }
  return result;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const sql = buildDemoSeedSql({ origin: options.origin });
  await writeFile(options.output, sql, 'utf8');
  if (options.artifactDir) {
    await mkdir(options.artifactDir, { recursive: true });
    for (const artifact of buildDemoArtifacts({
      origin: options.origin,
      version: options.version,
    })) {
      await writeFile(join(options.artifactDir, artifact.filename), artifact.body, 'utf8');
    }
  }
  console.log(`Generated synthetic Linketry Demo seed: ${options.output}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

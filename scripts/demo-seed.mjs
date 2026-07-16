import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const DAY_MS = 24 * 60 * 60 * 1_000;

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
  const countries = ['US', 'DE', 'SG', 'GB', 'CA', 'JP', 'AU', 'FR'];
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

  const auditLogs = [
    ['demo.seeded', 'system', 'linketry-public-demo', 'Synthetic Demo dataset refreshed'],
    ['link.created', 'link', links[0].id, 'Synthetic product link created'],
    ['link.created', 'link', links[1].id, 'Synthetic GitHub link created'],
    ['settings.updated', 'settings', 'site_name', 'Synthetic Demo settings configured'],
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
  ('analytics_retention_days', '0', ${sqlValue(now.toISOString())})
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
  ];

  return `${statements.join('\n\n')}\n`;
}

function parseArgs(argv) {
  const result = { origin: '', output: '' };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--origin') result.origin = argv[++index] ?? '';
    else if (argument === '--output') result.output = argv[++index] ?? '';
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
  console.log(`Generated synthetic Linketry Demo seed: ${options.output}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

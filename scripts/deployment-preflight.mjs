import { pathToFileURL } from 'node:url';
import { parseJsonOutput, runWrangler, stripAnsi } from './lib/wrangler.mjs';

const TRACKS = new Set(['fresh', 'upgrade', 'demo']);
const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const RESOURCE_ID_PATTERN =
  /^(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
const ACCOUNT_ID_PATTERN = /^[a-f0-9]{32}$/i;
const RESOURCE_NAME_PATTERN = /^[a-z0-9][a-z0-9_-]{0,62}$/i;
const UPGRADE_GATES = [
  'LINKETRY_BACKUP_VERIFIED',
  'LINKETRY_MIGRATIONS_REVIEWED',
  'LINKETRY_UPGRADE_TARGET_CONFIRMED',
];
const UPGRADE_FORBIDDEN_FLAGS = [
  'LINKETRY_ALLOW_INITIALIZATION',
  'LINKETRY_ALLOW_FACTORY_RESET',
  'LINKETRY_ALLOW_DEMO_SEED',
  'LINKETRY_ALLOW_RESOURCE_RECREATION',
  'LINKETRY_ALLOW_DOMAIN_REPLACEMENT',
];

function readEnv(env, key) {
  return String(env[key] ?? '').trim();
}

function isTrue(value) {
  return TRUE_VALUES.has(
    String(value ?? '')
      .trim()
      .toLowerCase()
  );
}

function splitList(value) {
  return [
    ...new Set(
      String(value ?? '')
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];
}

function maskIdentifier(value) {
  if (!value) return 'not configured';
  if (value.length <= 8) return '*'.repeat(value.length);
  return `${'*'.repeat(Math.min(12, value.length - 6))}${value.slice(-6)}`;
}

function isPlaceholder(value) {
  return !value || /[<>]/.test(value) || /(?:^|\.)example\.(?:com|net|org)$/i.test(value);
}

function normalizeHostname(value) {
  const candidate = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!candidate || candidate.includes('/') || candidate.includes(':')) return '';
  try {
    const parsed = new URL(`https://${candidate}`);
    return parsed.hostname === candidate ? candidate : '';
  } catch {
    return '';
  }
}

function hostnameFromUrl(value) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return '';
    return parsed.hostname.toLowerCase();
  } catch {
    return '';
  }
}

function addCheck(checks, ok, code, passMessage, failMessage = passMessage) {
  checks.push({ status: ok ? 'pass' : 'fail', code, message: ok ? passMessage : failMessage });
}

function addWarning(checks, code, message) {
  checks.push({ status: 'warn', code, message });
}

function collectNamedResources(value, keys, names = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectNamedResources(item, keys, names);
    return names;
  }
  if (!value || typeof value !== 'object') return names;

  for (const key of keys) {
    if (typeof value[key] === 'string') names.add(value[key]);
  }
  for (const nested of Object.values(value)) {
    if (Array.isArray(nested)) collectNamedResources(nested, keys, names);
  }
  return names;
}

function outputContainsResource(output, resourceName, jsonKeys) {
  try {
    return collectNamedResources(parseJsonOutput(output), jsonKeys).has(resourceName);
  } catch {
    const escaped = resourceName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|[^A-Za-z0-9_-])${escaped}(?:$|[^A-Za-z0-9_-])`, 'm').test(
      stripAnsi(output)
    );
  }
}

function cloudflareAccessFailure(command, result) {
  const output = `${result?.stdout ?? ''}\n${result?.stderr ?? ''}`;
  if (command.key === 'r2' && /(?:code:\s*10042|\[code:\s*10042\])/i.test(output)) {
    return 'Wrangler R2 read access failed because R2 is not enabled for the selected Cloudflare account (code 10042). Enable R2 in that exact account, or leave both R2 bindings unset.';
  }
  return `Wrangler ${command.key} read access failed; verify the selected account and token permissions.`;
}

function collectTargets(env) {
  const domains = splitList(
    readEnv(env, 'LINKETRY_WORKER_DOMAINS') || readEnv(env, 'LINKETRY_SHORT_DOMAIN')
  );
  const apiUrl = readEnv(env, 'LINKETRY_API_URL');
  const apiOriginUrl = readEnv(env, 'LINKETRY_API_ORIGIN_URL') || apiUrl;
  const adminUrl = readEnv(env, 'LINKETRY_ADMIN_URL');
  return {
    accountId: readEnv(env, 'CLOUDFLARE_ACCOUNT_ID'),
    workerName: readEnv(env, 'LINKETRY_WORKER_NAME'),
    workerDomains: domains,
    apiUrl,
    apiHostname: hostnameFromUrl(apiUrl),
    apiOriginUrl,
    apiOriginHostname: hostnameFromUrl(apiOriginUrl),
    apiPagesProject: readEnv(env, 'LINKETRY_API_PAGES_PROJECT'),
    apiCustomDomain: normalizeHostname(readEnv(env, 'LINKETRY_API_CUSTOM_DOMAIN')),
    adminUrl,
    adminHostname: adminUrl ? hostnameFromUrl(adminUrl) : '',
    pagesProject: readEnv(env, 'LINKETRY_PAGES_PROJECT'),
    d1Name: readEnv(env, 'LINKETRY_D1_DATABASE_NAME'),
    d1Id: readEnv(env, 'LINKETRY_D1_DATABASE_ID'),
    kvId: readEnv(env, 'LINKETRY_KV_NAMESPACE_ID'),
    kvPreviewId: readEnv(env, 'LINKETRY_KV_PREVIEW_ID'),
    r2Bucket: readEnv(env, 'LINKETRY_R2_BUCKET'),
    r2PreviewBucket: readEnv(env, 'LINKETRY_R2_PREVIEW_BUCKET'),
    visitsQueue: readEnv(env, 'LINKETRY_VISITS_QUEUE'),
  };
}

function validateCoreConfiguration(env, targets, checks) {
  addCheck(
    checks,
    ACCOUNT_ID_PATTERN.test(targets.accountId),
    'account-id',
    'Cloudflare account ID is configured.',
    'CLOUDFLARE_ACCOUNT_ID must be a 32-character account ID.'
  );
  if (readEnv(env, 'CLOUDFLARE_API_TOKEN')) {
    addCheck(checks, true, 'api-token', 'Cloudflare API token is present (value hidden).');
  } else {
    addWarning(
      checks,
      'api-token-optional-local',
      'Cloudflare API token is not in the environment; local read checks may use an existing Wrangler login.'
    );
  }
  addCheck(
    checks,
    RESOURCE_NAME_PATTERN.test(targets.workerName),
    'worker-name',
    'Worker name is configured.',
    'LINKETRY_WORKER_NAME must be a valid Cloudflare resource name.'
  );
  addCheck(
    checks,
    targets.workerDomains.length > 0 &&
      targets.workerDomains.every((domain) => normalizeHostname(domain) && !isPlaceholder(domain)),
    'worker-domains',
    'Worker domains are explicit non-example hostnames.',
    'Set LINKETRY_WORKER_DOMAINS or LINKETRY_SHORT_DOMAIN to your own hostname(s), without protocol or path.'
  );
  addCheck(
    checks,
    Boolean(targets.apiHostname) && !isPlaceholder(targets.apiHostname),
    'api-url',
    'Admin API URL uses HTTPS and a non-example hostname.',
    'LINKETRY_API_URL must be an HTTPS URL on your own hostname.'
  );
  addCheck(
    checks,
    Boolean(targets.apiOriginHostname) && targets.workerDomains.includes(targets.apiOriginHostname),
    'api-domain-binding',
    'The API origin hostname is included in the Worker domains.',
    'The LINKETRY_API_ORIGIN_URL hostname must be present in LINKETRY_WORKER_DOMAINS or LINKETRY_SHORT_DOMAIN.'
  );
  addCheck(
    checks,
    RESOURCE_NAME_PATTERN.test(targets.pagesProject),
    'pages-project',
    'Pages project name is configured.',
    'LINKETRY_PAGES_PROJECT must be a valid Cloudflare resource name.'
  );
  addCheck(
    checks,
    RESOURCE_NAME_PATTERN.test(targets.d1Name),
    'd1-name',
    'D1 database name is configured.',
    'LINKETRY_D1_DATABASE_NAME must be a valid Cloudflare resource name.'
  );
  addCheck(
    checks,
    RESOURCE_ID_PATTERN.test(targets.d1Id),
    'd1-id',
    'D1 database ID is configured.',
    'LINKETRY_D1_DATABASE_ID must be a valid Cloudflare resource ID.'
  );
  addCheck(
    checks,
    RESOURCE_ID_PATTERN.test(targets.kvId),
    'kv-id',
    'KV namespace ID is configured.',
    'LINKETRY_KV_NAMESPACE_ID must be a valid Cloudflare resource ID.'
  );

  if (targets.kvPreviewId) {
    addCheck(
      checks,
      RESOURCE_ID_PATTERN.test(targets.kvPreviewId) && targets.kvPreviewId !== targets.kvId,
      'kv-preview-id',
      'Optional KV preview namespace is valid and separate.',
      'LINKETRY_KV_PREVIEW_ID must be valid and different from LINKETRY_KV_NAMESPACE_ID.'
    );
  } else {
    addWarning(
      checks,
      'kv-preview-optional',
      'KV preview namespace is not configured; it is optional for the basic deployment.'
    );
  }

  const hasR2 = Boolean(targets.r2Bucket);
  const hasR2Preview = Boolean(targets.r2PreviewBucket);
  addCheck(
    checks,
    hasR2 === hasR2Preview,
    'r2-pair',
    hasR2
      ? 'Optional R2 production and preview buckets are configured together.'
      : 'Optional R2 backup bindings are omitted together.',
    'Configure LINKETRY_R2_BUCKET and LINKETRY_R2_PREVIEW_BUCKET together, or leave both unset.'
  );
  if (!targets.visitsQueue) {
    addWarning(
      checks,
      'queue-optional',
      'Visit Queue is not configured; redirects retain the non-blocking D1 fallback.'
    );
  }
}

function validateTrack(track, env, targets, checks) {
  if (track === 'fresh') {
    addCheck(
      checks,
      isTrue(readEnv(env, 'LINKETRY_FRESH_INSTALL_CONFIRMED')),
      'fresh-target-confirmed',
      'Fresh-install target account and resources were explicitly confirmed.',
      'Set LINKETRY_FRESH_INSTALL_CONFIRMED=true only after confirming this is a new installation in your own account.'
    );
    return;
  }

  if (track === 'upgrade') {
    for (const gate of UPGRADE_GATES) {
      addCheck(
        checks,
        isTrue(readEnv(env, gate)),
        `upgrade-gate-${gate.toLowerCase()}`,
        `${gate} is confirmed.`,
        `Set ${gate}=true only after completing that upgrade safety check.`
      );
    }
    addCheck(
      checks,
      Boolean(readEnv(env, 'LINKETRY_BACKUP_REFERENCE')),
      'upgrade-backup-reference',
      'A verified backup reference is recorded.',
      'LINKETRY_BACKUP_REFERENCE must identify the verified backup or restore point used for this upgrade.'
    );
    for (const flag of UPGRADE_FORBIDDEN_FLAGS) {
      addCheck(
        checks,
        !isTrue(readEnv(env, flag)),
        `upgrade-forbidden-${flag.toLowerCase()}`,
        `${flag} is disabled.`,
        `${flag} is prohibited for an existing production upgrade.`
      );
    }
    return;
  }

  addCheck(
    checks,
    isTrue(readEnv(env, 'LINKETRY_DEMO_ISOLATION_CONFIRMED')),
    'demo-isolation-confirmed',
    'Demo isolation was explicitly confirmed.',
    'Set LINKETRY_DEMO_ISOLATION_CONFIRMED=true only after reviewing every Demo target.'
  );
  addCheck(
    checks,
    isTrue(readEnv(env, 'LINKETRY_DEMO_SYNTHETIC_DATA_ONLY')),
    'demo-synthetic-data',
    'Demo is restricted to synthetic data.',
    'Set LINKETRY_DEMO_SYNTHETIC_DATA_ONLY=true only when no production data will be used.'
  );
  addCheck(
    checks,
    RESOURCE_NAME_PATTERN.test(targets.apiPagesProject) &&
      targets.apiPagesProject !== targets.pagesProject &&
      targets.apiPagesProject !== targets.workerName,
    'demo-api-pages-project',
    'The Demo API gateway uses a separate Pages project.',
    'LINKETRY_API_PAGES_PROJECT must be a valid Pages name distinct from the Demo Admin and Worker.'
  );
  addCheck(
    checks,
    Boolean(targets.apiCustomDomain) &&
      targets.apiHostname &&
      [targets.apiOriginHostname, targets.apiCustomDomain].includes(targets.apiHostname),
    'demo-api-public-domain',
    'The public Demo API uses either its reviewed custom domain or the isolated Worker fallback.',
    'LINKETRY_API_CUSTOM_DOMAIN must be a valid hostname and LINKETRY_API_URL must use it or the isolated Worker fallback.'
  );

  const protectedIds = splitList(readEnv(env, 'LINKETRY_PROTECTED_RESOURCE_IDS'));
  const protectedNames = splitList(readEnv(env, 'LINKETRY_PROTECTED_RESOURCE_NAMES'));
  const protectedDomains = splitList(readEnv(env, 'LINKETRY_PROTECTED_DOMAINS'));
  addCheck(
    checks,
    protectedIds.length > 0 && protectedNames.length > 0 && protectedDomains.length > 0,
    'demo-protection-lists',
    'Protected production IDs, names, and domains are configured.',
    'Demo preflight fails closed unless LINKETRY_PROTECTED_RESOURCE_IDS, LINKETRY_PROTECTED_RESOURCE_NAMES, and LINKETRY_PROTECTED_DOMAINS are all configured.'
  );

  const targetIds = [targets.d1Id, targets.kvId, targets.kvPreviewId]
    .filter(Boolean)
    .map((value) => value.toLowerCase());
  const targetNames = [
    targets.workerName,
    targets.pagesProject,
    targets.apiPagesProject,
    targets.d1Name,
    targets.r2Bucket,
    targets.r2PreviewBucket,
    targets.visitsQueue,
  ]
    .filter(Boolean)
    .map((value) => value.toLowerCase());
  const targetDomains = [
    ...targets.workerDomains,
    targets.apiHostname,
    targets.apiCustomDomain,
    targets.adminHostname,
  ].filter(Boolean);
  addCheck(
    checks,
    !targetIds.some((value) => protectedIds.includes(value)),
    'demo-id-isolation',
    'Demo resource IDs do not overlap protected production IDs.',
    'A Demo D1 or KV resource ID overlaps a protected production resource.'
  );
  addCheck(
    checks,
    !targetNames.some((value) => protectedNames.includes(value)),
    'demo-name-isolation',
    'Demo resource names do not overlap protected production names.',
    'A Demo Worker, Pages, D1, R2, or Queue name overlaps a protected production resource.'
  );
  addCheck(
    checks,
    !targetDomains.some((value) => protectedDomains.includes(value)),
    'demo-domain-isolation',
    'Demo hostnames do not overlap protected production domains.',
    'A Demo Worker, API, or Admin hostname overlaps a protected production domain.'
  );
}

async function validateCloudflareResources(env, targets, checks, runner = runWrangler) {
  const commands = [
    { key: 'whoami', args: ['whoami', '--account', targets.accountId] },
    { key: 'd1', args: ['d1', 'list', '--json'] },
    { key: 'kv', args: ['kv', 'namespace', 'list'] },
  ];
  if (targets.r2Bucket && targets.r2PreviewBucket) {
    commands.push({ key: 'r2', args: ['r2', 'bucket', 'list'] });
  }
  if (targets.visitsQueue) {
    commands.push({ key: 'queue', args: ['queues', 'list'] });
  }
  const results = new Map();

  for (const command of commands) {
    const result = await runner(command.args, env);
    const ok = result && result.status === 0;
    addCheck(
      checks,
      ok,
      `cloudflare-${command.key}-access`,
      `Wrangler ${command.key} read access succeeded.`,
      cloudflareAccessFailure(command, result)
    );
    if (ok) results.set(command.key, result.stdout);
  }

  if (results.has('d1')) {
    try {
      const databases = parseJsonOutput(results.get('d1'));
      const match = Array.isArray(databases)
        ? databases.find((database) => (database.uuid || database.id) === targets.d1Id)
        : undefined;
      addCheck(
        checks,
        Boolean(match) && match.name === targets.d1Name,
        'cloudflare-d1-target',
        'Configured D1 ID and name match a database in the selected account.',
        'Configured D1 ID/name do not match a database in the selected Cloudflare account.'
      );
    } catch {
      addCheck(
        checks,
        false,
        'cloudflare-d1-json',
        '',
        'Could not parse the read-only Wrangler D1 list response.'
      );
    }
  }

  if (results.has('kv')) {
    try {
      const namespaces = parseJsonOutput(results.get('kv'));
      const ids = [targets.kvId, targets.kvPreviewId].filter(Boolean);
      const found =
        Array.isArray(namespaces) &&
        ids.every((id) => namespaces.some((namespace) => namespace.id === id));
      addCheck(
        checks,
        found,
        'cloudflare-kv-target',
        'Configured KV namespace IDs exist in the selected account.',
        'One or more configured KV namespace IDs were not found in the selected Cloudflare account.'
      );
    } catch {
      addCheck(
        checks,
        false,
        'cloudflare-kv-json',
        '',
        'Could not parse the read-only Wrangler KV namespace list response.'
      );
    }
  }

  if (results.has('r2')) {
    const missingBuckets = [targets.r2Bucket, targets.r2PreviewBucket].filter(
      (bucket) => !outputContainsResource(results.get('r2'), bucket, ['name'])
    );
    if (missingBuckets.length === 0) {
      addCheck(
        checks,
        true,
        'cloudflare-r2-target',
        'Configured R2 production and preview buckets exist in the selected account.'
      );
    } else {
      addWarning(
        checks,
        'cloudflare-r2-target',
        'One or more configured R2 buckets do not exist yet; the guarded deployment may create them after this read-only gate.'
      );
    }
  }

  if (results.has('queue')) {
    if (outputContainsResource(results.get('queue'), targets.visitsQueue, ['queue_name', 'name'])) {
      addCheck(
        checks,
        true,
        'cloudflare-queue-target',
        'Configured Visit Queue exists in the selected account.'
      );
    } else {
      addWarning(
        checks,
        'cloudflare-queue-target',
        'The configured Visit Queue does not exist yet; the guarded deployment may create it after this read-only gate.'
      );
    }
  }
}

export async function runPreflight({
  track,
  env = process.env,
  checkCloudflare = false,
  runner,
} = {}) {
  if (!TRACKS.has(track)) {
    throw new Error('Deployment track must be one of: fresh, upgrade, demo.');
  }

  const targets = collectTargets(env);
  const checks = [];
  validateCoreConfiguration(env, targets, checks);
  validateTrack(track, env, targets, checks);

  if (checkCloudflare) {
    if (checks.some((check) => check.status === 'fail' && check.code === 'account-id')) {
      addCheck(
        checks,
        false,
        'cloudflare-read-checks',
        '',
        'Cloudflare read checks were skipped because the account ID is invalid.'
      );
    } else {
      await validateCloudflareResources(env, targets, checks, runner);
    }
  }

  const safeTargets = {
    accountId: maskIdentifier(targets.accountId),
    workerName: targets.workerName || 'not configured',
    workerDomains: targets.workerDomains,
    apiUrl: targets.apiUrl || 'not configured',
    apiOriginUrl: targets.apiOriginUrl || 'not configured',
    apiPagesProject: targets.apiPagesProject || 'not configured',
    apiCustomDomain: targets.apiCustomDomain || 'not configured',
    adminUrl: targets.adminUrl || 'automatic Pages URL',
    pagesProject: targets.pagesProject || 'not configured',
    d1: `${targets.d1Name || 'not configured'} (${maskIdentifier(targets.d1Id)})`,
    kv: maskIdentifier(targets.kvId),
    kvPreview: maskIdentifier(targets.kvPreviewId),
    r2:
      targets.r2Bucket && targets.r2PreviewBucket
        ? `${targets.r2Bucket}, ${targets.r2PreviewBucket}`
        : 'optional / not configured',
    queue: targets.visitsQueue || 'optional / not configured',
  };
  const failed = checks.filter((check) => check.status === 'fail').length;
  const warnings = checks.filter((check) => check.status === 'warn').length;
  return {
    track,
    mode: checkCloudflare
      ? 'configuration + Cloudflare read-only checks'
      : 'local configuration only',
    ok: failed === 0,
    summary: { passed: checks.length - failed - warnings, failed, warnings },
    targets: safeTargets,
    checks,
    mutationPerformed: false,
  };
}

function parseArgs(argv) {
  const options = { track: '', checkCloudflare: false, json: false, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--track') options.track = argv[++index] ?? '';
    else if (argument === '--check-cloudflare') options.checkCloudflare = true;
    else if (argument === '--json') options.json = true;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function printHelp() {
  console.log(`Linketry deployment preflight

Usage:
  npm run deploy:preflight -- --track <fresh|upgrade|demo> [--check-cloudflare] [--json]

The command is read-only. By default it validates local environment configuration only.
--check-cloudflare additionally runs Wrangler whoami, D1/KV lists, and read-only R2/Queue lists when configured.
It never creates, migrates, deploys, resets, seeds, or replaces resources.`);
}

function printReport(report) {
  console.log(`Linketry deployment preflight: ${report.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Track: ${report.track}`);
  console.log(`Mode: ${report.mode}`);
  console.log('Targets:');
  for (const [key, value] of Object.entries(report.targets)) {
    const rendered = Array.isArray(value) ? value.join(', ') || 'not configured' : value;
    console.log(`  ${key}: ${rendered}`);
  }
  console.log('Checks:');
  for (const check of report.checks) {
    console.log(`  [${check.status.toUpperCase()}] ${check.message}`);
  }
  console.log(
    `Summary: ${report.summary.passed} passed, ${report.summary.failed} failed, ${report.summary.warnings} warnings.`
  );
  console.log('No mutations were performed.');
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return;
    }
    const report = await runPreflight(options);
    if (options.json) console.log(JSON.stringify(report, null, 2));
    else printReport(report);
    process.exitCode = report.ok ? 0 : 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}

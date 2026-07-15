import { pathToFileURL } from 'node:url';
import { parseJsonOutput, runWrangler } from './lib/wrangler.mjs';

const ACCOUNT_ID_PATTERN = /^[a-f0-9]{32}$/i;
const RESOURCE_ID_PATTERN =
  /^(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
const PREFIX_PATTERN = /^linketry-[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;
const D1_LOCATIONS = new Set(['weur', 'eeur', 'apac', 'oc', 'wnam', 'enam']);

function readValue(value) {
  return String(value ?? '').trim();
}

function readEnv(env, key) {
  return readValue(env[key]);
}

function maskIdentifier(value) {
  if (!value) return 'not configured';
  if (value.length <= 8) return '*'.repeat(value.length);
  return `${'*'.repeat(Math.min(12, value.length - 6))}${value.slice(-6)}`;
}

function normalizeHostname(value) {
  const candidate = readValue(value).toLowerCase();
  if (!candidate || candidate.includes('/') || candidate.includes(':')) return '';
  try {
    const parsed = new URL(`https://${candidate}`);
    return parsed.hostname === candidate ? candidate : '';
  } catch {
    return '';
  }
}

function isPlaceholderHostname(value) {
  return /[<>]/.test(value) || /(?:^|\.)example\.(?:com|net|org)$/i.test(value);
}

export function deriveResourceNames(prefix) {
  return {
    worker: `${prefix}-worker`,
    pages: `${prefix}-admin`,
    d1: `${prefix}-db`,
    kv: `${prefix}-kv`,
  };
}

function expectedConfirmation(accountId, prefix) {
  const suffix = accountId.length >= 6 ? accountId.slice(-6).toLowerCase() : 'unknown';
  return `fresh:${suffix}:${prefix || 'missing-prefix'}`;
}

function normalizeOptions(options, env) {
  const prefix = readValue(
    options.prefix || readEnv(env, 'LINKETRY_BOOTSTRAP_PREFIX')
  ).toLowerCase();
  const accountId = readValue(
    options.accountId || readEnv(env, 'CLOUDFLARE_ACCOUNT_ID')
  ).toLowerCase();
  const domain = normalizeHostname(
    options.domain ||
      readEnv(env, 'LINKETRY_BOOTSTRAP_DOMAIN') ||
      readEnv(env, 'LINKETRY_SHORT_DOMAIN')
  );
  const location = readValue(
    options.location || readEnv(env, 'LINKETRY_D1_LOCATION')
  ).toLowerCase();
  return {
    prefix,
    accountId,
    domain,
    location,
    apply: Boolean(options.apply),
    confirmation: readValue(options.confirmation),
  };
}

function validateOptions(config) {
  const errors = [];
  if (!ACCOUNT_ID_PATTERN.test(config.accountId)) {
    errors.push('CLOUDFLARE_ACCOUNT_ID or --account-id must be a 32-character account ID.');
  }
  if (!PREFIX_PATTERN.test(config.prefix) || config.prefix === 'linketry-demo') {
    errors.push(
      'Use --prefix linketry-<unique-name> with lowercase letters, numbers, and hyphens; the official Demo prefix is reserved.'
    );
  }
  if (!config.domain || isPlaceholderHostname(config.domain)) {
    errors.push(
      'Use --domain with your own hostname, without a protocol, path, or example.com placeholder.'
    );
  }
  if (config.location && !D1_LOCATIONS.has(config.location)) {
    errors.push(`Unsupported D1 location: ${config.location}.`);
  }
  const confirmation = expectedConfirmation(config.accountId, config.prefix);
  if (config.apply && config.confirmation !== confirmation) {
    errors.push(`Apply mode requires the exact confirmation phrase: ${confirmation}`);
  }
  return { errors, confirmation };
}

function successful(result) {
  return Boolean(result) && result.status === 0;
}

async function invoke(runner, args, env) {
  return runner(args, env);
}

async function readResourceLists(runner, env) {
  const d1Result = await invoke(runner, ['d1', 'list', '--json'], env);
  const kvResult = await invoke(runner, ['kv', 'namespace', 'list'], env);
  const errors = [];
  let d1 = [];
  let kv = [];

  if (!successful(d1Result)) {
    errors.push(
      'Wrangler could not list D1 databases; verify D1 read permission for the selected account.'
    );
  } else {
    try {
      const parsed = parseJsonOutput(d1Result.stdout);
      if (!Array.isArray(parsed)) throw new Error('D1 response was not an array.');
      d1 = parsed;
    } catch {
      errors.push('Wrangler returned an unreadable D1 database list.');
    }
  }

  if (!successful(kvResult)) {
    errors.push(
      'Wrangler could not list KV namespaces; verify KV read permission for the selected account.'
    );
  } else {
    try {
      const parsed = parseJsonOutput(kvResult.stdout);
      if (!Array.isArray(parsed)) throw new Error('KV response was not an array.');
      kv = parsed;
    } catch {
      errors.push('Wrangler returned an unreadable KV namespace list.');
    }
  }

  return { d1, kv, errors };
}

function findUniqueResource(items, name, type) {
  const getName = type === 'd1' ? (item) => item.name : (item) => item.title ?? item.name;
  const getId = type === 'd1' ? (item) => item.uuid ?? item.id : (item) => item.id;
  const matches = items.filter((item) => getName(item) === name);
  if (matches.length > 1) {
    return {
      error: `Multiple ${type.toUpperCase()} resources use the exact name ${name}; resolve the collision manually.`,
    };
  }
  if (matches.length === 0) return { name, id: '', exists: false };
  const id = readValue(getId(matches[0]));
  if (!RESOURCE_ID_PATTERN.test(id)) {
    return { error: `${type.toUpperCase()} resource ${name} returned an invalid resource ID.` };
  }
  return { name, id, exists: true };
}

function resolveResources(lists, names) {
  const d1 = findUniqueResource(lists.d1, names.d1, 'd1');
  const kv = findUniqueResource(lists.kv, names.kv, 'kv');
  const errors = [d1.error, kv.error].filter(Boolean);
  return { d1, kv, errors };
}

function buildBindings(config, names, resources) {
  return {
    LINKETRY_API_URL: `https://${config.domain}`,
    LINKETRY_PAGES_PROJECT: names.pages,
    LINKETRY_WORKER_NAME: names.worker,
    LINKETRY_SHORT_DOMAIN: config.domain,
    LINKETRY_D1_DATABASE_NAME: names.d1,
    LINKETRY_D1_DATABASE_ID: resources.d1.id || '<created-after-apply>',
    LINKETRY_KV_NAMESPACE_ID: resources.kv.id || '<created-after-apply>',
  };
}

function buildWranglerBindingSnippet(names, resources) {
  return [
    '[[d1_databases]]',
    'binding = "DB"',
    `database_name = "${names.d1}"`,
    `database_id = "${resources.d1.id || '<created-after-apply>'}"`,
    'migrations_dir = "../../migrations"',
    '',
    '[[kv_namespaces]]',
    'binding = "KV"',
    `id = "${resources.kv.id || '<created-after-apply>'}"`,
  ].join('\n');
}

function buildReport({
  config,
  confirmation,
  names,
  resources,
  errors,
  applied,
  created,
  mutationAttempted,
}) {
  const bindings = buildBindings(config, names, resources);
  const ready = Boolean(resources.d1.id && resources.kv.id && errors.length === 0);
  return {
    ok: errors.length === 0,
    mode: applied ? 'apply' : 'dry-run',
    accountId: maskIdentifier(config.accountId),
    prefix: config.prefix,
    domain: config.domain,
    location: config.location || 'automatic',
    confirmation,
    resources: {
      d1: {
        name: names.d1,
        id: resources.d1.id || '',
        action: resources.d1.exists ? 'reuse' : applied ? 'unresolved' : 'create',
      },
      kv: {
        name: names.kv,
        id: resources.kv.id || '',
        action: resources.kv.exists ? 'reuse' : applied ? 'unresolved' : 'create',
      },
      worker: { name: names.worker, action: 'binding output only' },
      pages: { name: names.pages, action: 'binding output only' },
    },
    created,
    mutationAttempted,
    mutationPerformed: created.length > 0,
    bindingOutputReady: ready,
    bindings,
    wranglerToml: buildWranglerBindingSnippet(names, resources),
    requiredSecrets: [
      'CLOUDFLARE_ACCOUNT_ID (reuse the selected value; not printed)',
      'CLOUDFLARE_API_TOKEN (CI only; never printed)',
    ],
    optionalNextResources: [
      'KV preview namespace',
      'R2 backup buckets',
      'Queue',
      'extra domains',
      'advanced Cron',
    ],
    errors,
  };
}

export async function runBootstrap({ options = {}, env = process.env, runner = runWrangler } = {}) {
  const config = normalizeOptions(options, env);
  const names = deriveResourceNames(config.prefix || 'linketry-missing');
  const validation = validateOptions(config);
  const emptyResources = {
    d1: { name: names.d1, id: '', exists: false },
    kv: { name: names.kv, id: '', exists: false },
  };
  if (validation.errors.length > 0) {
    return buildReport({
      config,
      confirmation: validation.confirmation,
      names,
      resources: emptyResources,
      errors: validation.errors,
      applied: config.apply,
      created: [],
      mutationAttempted: false,
    });
  }

  const whoami = await invoke(runner, ['whoami', '--account', config.accountId], env);
  if (!successful(whoami)) {
    return buildReport({
      config,
      confirmation: validation.confirmation,
      names,
      resources: emptyResources,
      errors: ['Wrangler authentication failed for the selected Cloudflare account.'],
      applied: config.apply,
      created: [],
      mutationAttempted: false,
    });
  }

  let lists = await readResourceLists(runner, env);
  let resolved = resolveResources(lists, names);
  const errors = [...lists.errors, ...resolved.errors];
  const created = [];
  let mutationAttempted = false;

  if (config.apply && errors.length === 0) {
    const createSteps = [];
    if (!resolved.d1.exists) {
      const args = ['d1', 'create', names.d1];
      if (config.location) args.push('--location', config.location);
      createSteps.push({ type: 'D1', name: names.d1, args });
    }
    if (!resolved.kv.exists) {
      createSteps.push({
        type: 'KV',
        name: names.kv,
        args: ['kv', 'namespace', 'create', names.kv],
      });
    }

    for (const step of createSteps) {
      mutationAttempted = true;
      const result = await invoke(runner, step.args, env);
      if (!successful(result)) {
        errors.push(
          `${step.type} resource ${step.name} could not be created; rerun the dry-run before retrying.`
        );
        break;
      }
      created.push(`${step.type}:${step.name}`);
    }

    if (mutationAttempted) {
      lists = await readResourceLists(runner, env);
      resolved = resolveResources(lists, names);
      errors.push(...lists.errors, ...resolved.errors);
    }
    if (!resolved.d1.exists || !resolved.kv.exists) {
      errors.push(
        'The required D1 and KV resources were not both visible after apply; rerun the dry-run before retrying.'
      );
    }
  }

  return buildReport({
    config,
    confirmation: validation.confirmation,
    names,
    resources: resolved,
    errors: [...new Set(errors)],
    applied: config.apply,
    created,
    mutationAttempted,
  });
}

function parseArgs(argv) {
  const options = {
    prefix: '',
    domain: '',
    accountId: '',
    location: '',
    apply: false,
    confirmation: '',
    json: false,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--prefix') options.prefix = argv[++index] ?? '';
    else if (argument === '--domain') options.domain = argv[++index] ?? '';
    else if (argument === '--account-id') options.accountId = argv[++index] ?? '';
    else if (argument === '--location') options.location = argv[++index] ?? '';
    else if (argument === '--apply') options.apply = true;
    else if (argument === '--confirm') options.confirmation = argv[++index] ?? '';
    else if (argument === '--json') options.json = true;
    else if (argument === '--help' || argument === '-h') options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
}

function printHelp() {
  console.log(`Linketry beginner Cloudflare bootstrap

Usage:
  npm run deploy:bootstrap -- --prefix linketry-<unique-name> --domain <hostname> --account-id <id>
  npm run deploy:bootstrap -- --prefix linketry-<unique-name> --domain <hostname> --account-id <id> --apply --confirm <phrase>

The first command is a read-only dry-run. It lists the selected account's D1/KV resources,
shows whether each exact name will be created or reused, and prints the required confirmation.
Apply mode creates only missing D1/KV resources, reads them back, and prints binding values.
It never applies migrations, deploys code, writes secrets, changes DNS, or creates optional resources.`);
}

function printReport(report) {
  console.log(`Linketry beginner bootstrap: ${report.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Mode: ${report.mode}`);
  console.log(`Account: ${report.accountId}`);
  console.log(`Prefix: ${report.prefix || 'not configured'}`);
  console.log(`Domain: ${report.domain || 'not configured'}`);
  console.log(`D1 location: ${report.location}`);
  console.log('Resource plan:');
  for (const [type, resource] of Object.entries(report.resources)) {
    console.log(`  ${type}: ${resource.name} (${resource.action})`);
  }
  if (report.errors.length > 0) {
    console.log('Errors:');
    for (const error of report.errors) console.log(`  - ${error}`);
  }
  if (report.mode === 'dry-run' && report.ok) {
    console.log('No mutations were performed. To apply this exact plan, rerun with:');
    console.log(`  --apply --confirm ${report.confirmation}`);
  }
  if (report.bindingOutputReady) {
    console.log('GitHub repository variables:');
    for (const [key, value] of Object.entries(report.bindings)) console.log(`  ${key}=${value}`);
    console.log('Wrangler TOML bindings:');
    console.log(report.wranglerToml);
  }
  console.log(`Mutations attempted: ${report.mutationAttempted ? 'yes' : 'no'}`);
  console.log(
    `Mutations completed: ${report.mutationPerformed ? report.created.join(', ') : 'none'}`
  );
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      printHelp();
      return;
    }
    const report = await runBootstrap({ options });
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

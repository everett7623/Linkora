import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runPreflight } from './deployment-preflight.mjs';
import { inspectMigrations, readMigrationSources } from './deployment-workflow-gate.mjs';
import { runWrangler } from './lib/wrangler.mjs';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ACCOUNT_ID_PATTERN = /^[a-f0-9]{32}$/i;
const SHA_PATTERN = /^[a-f0-9]{40}$/i;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/i;
const DEMO_RESOURCE_PATTERN = /^linketry-demo-[a-z0-9-]+$/;
const COMPATIBILITY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEPLOY_CONFIRMATION = 'DEPLOY LINKETRY DEMO';

function readEnv(env, key) {
  return String(env[key] ?? '').trim();
}

function isTrue(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function splitList(value) {
  return String(value)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function addCheck(checks, ok, code, passMessage, failMessage = passMessage) {
  checks.push({ status: ok ? 'pass' : 'fail', code, message: ok ? passMessage : failMessage });
}

function packageVersion() {
  const packageJson = JSON.parse(readFileSync(resolve(REPOSITORY_ROOT, 'package.json'), 'utf8'));
  return String(packageJson.version ?? '').trim();
}

function emptyPreflight() {
  return {
    track: 'demo',
    mode: 'not run',
    ok: false,
    summary: { passed: 0, failed: 0, warnings: 0 },
    targets: {},
    checks: [],
    mutationPerformed: false,
  };
}

export async function runDemoDeploymentWorkflowGate({
  env = process.env,
  version = packageVersion(),
  migrations = readMigrationSources(),
  runner = runWrangler,
  checkCloudflare = true,
} = {}) {
  const checks = [];
  const currentCommit = readEnv(env, 'GITHUB_SHA').toLowerCase();
  const approvedCommit = readEnv(env, 'LINKETRY_DEMO_APPROVED_COMMIT').toLowerCase();
  const approvedRelease = readEnv(env, 'LINKETRY_DEMO_APPROVED_RELEASE');
  const approvedMigrations = readEnv(env, 'LINKETRY_DEMO_APPROVED_MIGRATIONS_SHA256').toLowerCase();
  const accountId = readEnv(env, 'CLOUDFLARE_ACCOUNT_ID').toLowerCase();
  const protectedAccountIds = splitList(readEnv(env, 'LINKETRY_PROTECTED_ACCOUNT_IDS'));
  const migrationPolicy = inspectMigrations(migrations);
  const demoNames = [
    readEnv(env, 'LINKETRY_WORKER_NAME'),
    readEnv(env, 'LINKETRY_PAGES_PROJECT'),
    readEnv(env, 'LINKETRY_D1_DATABASE_NAME'),
  ];
  const workerDomains = splitList(readEnv(env, 'LINKETRY_WORKER_DOMAINS'));
  const useWorkersDev = isTrue(readEnv(env, 'LINKETRY_DEMO_USE_WORKERS_DEV'));

  addCheck(
    checks,
    readEnv(env, 'GITHUB_EVENT_NAME') === 'workflow_dispatch',
    'manual-trigger',
    'The Demo deployment was started manually.',
    'The isolated Demo workflow may only run through workflow_dispatch.'
  );
  addCheck(
    checks,
    useWorkersDev
      ? workerDomains.length === 1 && workerDomains[0].endsWith('.workers.dev')
      : workerDomains.every((domain) => !domain.endsWith('.workers.dev')),
    'demo-worker-routing',
    useWorkersDev
      ? 'The Demo uses one isolated-account workers.dev hostname.'
      : 'The Demo uses reviewed custom-domain routing.',
    useWorkersDev
      ? 'LINKETRY_DEMO_USE_WORKERS_DEV=true requires exactly one *.workers.dev hostname.'
      : 'A *.workers.dev hostname requires LINKETRY_DEMO_USE_WORKERS_DEV=true so it is not configured as a custom domain.'
  );
  addCheck(
    checks,
    readEnv(env, 'LINKETRY_DEMO_DEPLOY_CONFIRMATION') === DEPLOY_CONFIRMATION,
    'deploy-confirmation',
    'The exact Demo deployment confirmation was supplied.',
    `Type ${DEPLOY_CONFIRMATION} when dispatching the Demo workflow.`
  );
  addCheck(
    checks,
    isTrue(readEnv(env, 'LINKETRY_DEMO_CREDENTIAL_SCOPE_CONFIRMED')),
    'credential-scope',
    'The Demo API token scope was explicitly reviewed.',
    'Set LINKETRY_DEMO_CREDENTIAL_SCOPE_CONFIRMED=true only after restricting the token to the Demo account.'
  );
  addCheck(
    checks,
    Boolean(readEnv(env, 'CLOUDFLARE_API_TOKEN')) &&
      Boolean(readEnv(env, 'LINKETRY_ADMIN_TOKEN_OVERRIDE')),
    'demo-secrets',
    'Demo Cloudflare and Admin secrets are present (values hidden).',
    'Configure the Demo-only Cloudflare API token and Admin token secrets.'
  );
  addCheck(
    checks,
    ACCOUNT_ID_PATTERN.test(accountId),
    'demo-account-id',
    'The Demo Cloudflare account ID is valid.',
    'The Demo Cloudflare account ID must contain exactly 32 hexadecimal characters.'
  );
  addCheck(
    checks,
    protectedAccountIds.length > 0 &&
      protectedAccountIds.every((id) => ACCOUNT_ID_PATTERN.test(id)),
    'protected-account-list',
    'Every protected production account ID is valid.',
    'LINKETRY_PROTECTED_ACCOUNT_IDS must contain valid 32-character production Cloudflare account IDs.'
  );
  addCheck(
    checks,
    ACCOUNT_ID_PATTERN.test(accountId) && !protectedAccountIds.includes(accountId),
    'demo-account-isolation',
    'The Demo account does not overlap a protected production account.',
    'The Demo workflow cannot target a protected production Cloudflare account.'
  );
  addCheck(
    checks,
    demoNames.every((name) => DEMO_RESOURCE_PATTERN.test(name)) &&
      new Set(demoNames).size === demoNames.length,
    'demo-resource-prefix',
    'Core Demo resources are unique and use the reserved linketry-demo-* prefix.',
    'Demo Worker, Pages, and D1 names must be unique and each use the linketry-demo-* prefix.'
  );
  const compatibilityDate = readEnv(env, 'LINKETRY_COMPATIBILITY_DATE');
  addCheck(
    checks,
    !compatibilityDate || COMPATIBILITY_DATE_PATTERN.test(compatibilityDate),
    'compatibility-date',
    'The optional Demo compatibility date has a safe date-only format.',
    'LINKETRY_DEMO_COMPATIBILITY_DATE must use YYYY-MM-DD without additional TOML content.'
  );
  addCheck(
    checks,
    Boolean(version) && approvedRelease === version,
    'approved-release',
    `Demo release ${version} is explicitly approved.`,
    `LINKETRY_DEMO_APPROVED_RELEASE must exactly match package version ${version}.`
  );
  addCheck(
    checks,
    SHA_PATTERN.test(approvedCommit) && approvedCommit === currentCommit,
    'approved-commit',
    'The current Git commit is explicitly approved for Demo deployment.',
    'LINKETRY_DEMO_APPROVED_COMMIT must exactly match the 40-character GITHUB_SHA.'
  );
  addCheck(
    checks,
    migrations.length > 0 && migrationPolicy.unsafe.length === 0,
    'migration-policy',
    `${migrations.length} non-destructive migration file(s) were inventoried.`,
    `Demo migration policy rejected: ${
      migrationPolicy.unsafe.map((finding) => `${finding.file}:${finding.rule}`).join(', ') ||
      'no migration files were found'
    }.`
  );
  addCheck(
    checks,
    DIGEST_PATTERN.test(approvedMigrations) && approvedMigrations === migrationPolicy.digest,
    'approved-migrations',
    'The reviewed Demo migration digest matches this commit.',
    `LINKETRY_DEMO_APPROVED_MIGRATIONS_SHA256 must match ${migrationPolicy.digest}.`
  );

  let preflight = emptyPreflight();
  if (checks.every((check) => check.status === 'pass')) {
    preflight = await runPreflight({ track: 'demo', env, checkCloudflare, runner });
    addCheck(
      checks,
      preflight.ok,
      'demo-preflight',
      'Demo configuration, resource, and domain isolation checks passed.',
      'Demo preflight failed; review the redacted checks below.'
    );
  } else {
    addCheck(
      checks,
      false,
      'demo-preflight',
      '',
      'Demo preflight was skipped because a local safety check failed.'
    );
  }

  if (checks.every((check) => check.status === 'pass') && checkCloudflare) {
    const migrationList = await runner(
      [
        'd1',
        'migrations',
        'list',
        readEnv(env, 'LINKETRY_D1_DATABASE_NAME'),
        '--remote',
        '--config',
        'wrangler.demo.toml',
        '--cwd',
        'apps/worker',
      ],
      env
    );
    addCheck(
      checks,
      migrationList?.status === 0,
      'remote-migration-status',
      'Wrangler read pending migrations from the isolated Demo D1 database.',
      'Wrangler could not read pending migrations from the isolated Demo D1 database.'
    );
  }

  const failed = checks.filter((check) => check.status === 'fail').length;
  return {
    ok: failed === 0,
    track: 'demo',
    version,
    commit: SHA_PATTERN.test(currentCommit) ? currentCommit : 'not configured',
    migrationDigest: migrationPolicy.digest,
    migrationFiles: migrationPolicy.files,
    checks,
    preflight,
    mutationPerformed: false,
  };
}

function printReport(report) {
  console.log(`Linketry Demo deployment gate: ${report.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Version: ${report.version}`);
  console.log(`Commit: ${report.commit}`);
  console.log(`Migration digest: ${report.migrationDigest}`);
  for (const check of report.checks) {
    console.log(`  [${check.status.toUpperCase()}] ${check.message}`);
  }
  if (report.preflight.checks.length > 0) {
    console.log('Demo preflight:');
    for (const check of report.preflight.checks) {
      console.log(`  [${check.status.toUpperCase()}] ${check.message}`);
    }
  }
  console.log('No mutations were performed by the gate.');
}

async function main() {
  try {
    const report = await runDemoDeploymentWorkflowGate();
    printReport(report);
    process.exitCode = report.ok ? 0 : 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await main();
}

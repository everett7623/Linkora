import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runPreflight } from './deployment-preflight.mjs';
import { runWrangler } from './lib/wrangler.mjs';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '..');
const MIGRATIONS_DIRECTORY = resolve(REPOSITORY_ROOT, 'migrations');
const DEPLOYMENT_TRACKS = new Set(['fresh', 'upgrade']);
const SHA_PATTERN = /^[a-f0-9]{40}$/i;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/i;
const UNSAFE_SQL_PATTERNS = [
  { name: 'DROP', pattern: /\bDROP\s+(?:TABLE|INDEX|VIEW|TRIGGER|COLUMN)\b/i },
  { name: 'TRUNCATE', pattern: /\bTRUNCATE\b/i },
  { name: 'DELETE', pattern: /\bDELETE\s+FROM\b/i },
  { name: 'REPLACE', pattern: /\bREPLACE\s+INTO\b/i },
  { name: 'UPDATE', pattern: /\bUPDATE\s+(?:OR\s+\w+\s+)?[\w"`\[]+\s+SET\b/i },
  { name: 'ALTER DROP/RENAME', pattern: /\bALTER\s+TABLE\b[^;]*\b(?:DROP|RENAME)\b/i },
  { name: 'WRITABLE SCHEMA', pattern: /\bPRAGMA\s+writable_schema\b/i },
];

function readEnv(env, key) {
  return String(env[key] ?? '').trim();
}

function addCheck(checks, ok, code, passMessage, failMessage = passMessage) {
  checks.push({ status: ok ? 'pass' : 'fail', code, message: ok ? passMessage : failMessage });
}

function stripSqlComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--.*$/gm, '');
}

export function readMigrationSources(directory = MIGRATIONS_DIRECTORY) {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => ({
      name: entry.name,
      source: readFileSync(resolve(directory, entry.name), 'utf8'),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function inspectMigrations(sources) {
  const hash = createHash('sha256');
  const unsafe = [];
  for (const migration of sources) {
    hash.update(migration.name);
    hash.update('\0');
    hash.update(migration.source);
    hash.update('\0');
    const executableSql = stripSqlComments(migration.source);
    for (const rule of UNSAFE_SQL_PATTERNS) {
      if (rule.pattern.test(executableSql)) unsafe.push({ file: migration.name, rule: rule.name });
    }
  }
  return { digest: hash.digest('hex'), files: sources.map((migration) => migration.name), unsafe };
}

function packageVersion() {
  const packageJson = JSON.parse(readFileSync(resolve(REPOSITORY_ROOT, 'package.json'), 'utf8'));
  return String(packageJson.version ?? '').trim();
}

function emptyPreflight(track) {
  return {
    track,
    mode: 'not run',
    ok: false,
    summary: { passed: 0, failed: 0, warnings: 0 },
    targets: {},
    checks: [],
    mutationPerformed: false,
  };
}

export async function runDeploymentWorkflowGate({
  env = process.env,
  version = packageVersion(),
  migrations = readMigrationSources(),
  runner = runWrangler,
  checkCloudflare = true,
} = {}) {
  const track = readEnv(env, 'LINKETRY_DEPLOYMENT_TRACK').toLowerCase();
  const approvedRelease = readEnv(env, 'LINKETRY_APPROVED_RELEASE');
  const approvedCommit = readEnv(env, 'LINKETRY_APPROVED_COMMIT').toLowerCase();
  const currentCommit = readEnv(env, 'GITHUB_SHA').toLowerCase();
  const approvedMigrations = readEnv(env, 'LINKETRY_APPROVED_MIGRATIONS_SHA256').toLowerCase();
  const migrationPolicy = inspectMigrations(migrations);
  const checks = [];

  addCheck(
    checks,
    DEPLOYMENT_TRACKS.has(track),
    'deployment-track',
    `Deployment track ${track} is allowed in the production workflow.`,
    'LINKETRY_DEPLOYMENT_TRACK must be explicitly set to fresh or upgrade; Demo requires a separate workflow.'
  );
  addCheck(
    checks,
    Boolean(version) && approvedRelease === version,
    'approved-release',
    `Release ${version} is explicitly approved.`,
    `LINKETRY_APPROVED_RELEASE must exactly match package version ${version}.`
  );
  addCheck(
    checks,
    SHA_PATTERN.test(approvedCommit) && approvedCommit === currentCommit,
    'approved-commit',
    'The current Git commit is explicitly approved.',
    'LINKETRY_APPROVED_COMMIT must exactly match the 40-character GITHUB_SHA for this run.'
  );
  addCheck(
    checks,
    migrations.length > 0,
    'migration-inventory',
    `${migrations.length} migration file(s) were inventoried.`,
    'No migration files were found; deployment is blocked.'
  );
  addCheck(
    checks,
    migrationPolicy.unsafe.length === 0,
    'migration-policy',
    'Migration files contain no automatically prohibited destructive SQL.',
    `Migration policy rejected: ${migrationPolicy.unsafe
      .map((finding) => `${finding.file}:${finding.rule}`)
      .join(', ')}.`
  );
  addCheck(
    checks,
    DIGEST_PATTERN.test(approvedMigrations) && approvedMigrations === migrationPolicy.digest,
    'approved-migrations',
    'The reviewed migration digest matches this commit.',
    `LINKETRY_APPROVED_MIGRATIONS_SHA256 must match ${migrationPolicy.digest}.`
  );

  let preflight = emptyPreflight(track);
  if (checks.every((check) => check.status === 'pass')) {
    preflight = await runPreflight({ track, env, checkCloudflare, runner });
    addCheck(
      checks,
      preflight.ok,
      'deployment-preflight',
      'Track-specific configuration and Cloudflare resource preflight passed.',
      'Track-specific deployment preflight failed; review the redacted checks below.'
    );
  } else {
    addCheck(
      checks,
      false,
      'deployment-preflight',
      '',
      'Track-specific deployment preflight was skipped because a release approval check failed.'
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
        '--cwd',
        'apps/worker',
      ],
      env
    );
    addCheck(
      checks,
      migrationList && migrationList.status === 0,
      'remote-migration-status',
      'Wrangler read the pending migration status from the approved D1 target.',
      'Wrangler could not read pending migrations from the approved D1 target.'
    );
  }

  const failed = checks.filter((check) => check.status === 'fail').length;
  return {
    ok: failed === 0,
    track: track || 'not configured',
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
  console.log(`Linketry deployment workflow gate: ${report.ok ? 'PASS' : 'FAIL'}`);
  console.log(`Track: ${report.track}`);
  console.log(`Version: ${report.version}`);
  console.log(`Commit: ${report.commit}`);
  console.log(`Migration digest: ${report.migrationDigest}`);
  console.log(`Migration files: ${report.migrationFiles.join(', ') || 'none'}`);
  console.log('Release checks:');
  for (const check of report.checks)
    console.log(`  [${check.status.toUpperCase()}] ${check.message}`);
  if (report.preflight.checks.length > 0) {
    console.log('Track preflight:');
    for (const check of report.preflight.checks) {
      console.log(`  [${check.status.toUpperCase()}] ${check.message}`);
    }
  }
  console.log('No mutations were performed by the gate.');
}

async function main() {
  try {
    if (process.argv.includes('--digest-only')) {
      console.log(inspectMigrations(readMigrationSources()).digest);
      return;
    }
    const report = await runDeploymentWorkflowGate();
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

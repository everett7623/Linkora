import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { inspectMigrations, runDeploymentWorkflowGate } from './deployment-workflow-gate.mjs';

const version = '0.23.0';
const commit = 'a'.repeat(40);
const migrations = [
  { name: '0001_init.sql', source: 'CREATE TABLE links (id TEXT PRIMARY KEY);' },
  { name: '0002_add.sql', source: 'ALTER TABLE links ADD COLUMN title TEXT;' },
];
const migrationDigest = inspectMigrations(migrations).digest;
const baseEnv = {
  GITHUB_SHA: commit,
  LINKETRY_DEPLOYMENT_TRACK: 'upgrade',
  LINKETRY_APPROVED_RELEASE: version,
  LINKETRY_APPROVED_COMMIT: commit,
  LINKETRY_APPROVED_MIGRATIONS_SHA256: migrationDigest,
  CLOUDFLARE_ACCOUNT_ID: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  CLOUDFLARE_API_TOKEN: 'must-never-appear',
  LINKETRY_WORKER_NAME: 'linketry-worker-new',
  LINKETRY_WORKER_DOMAINS: 'go.linketry-test.net',
  LINKETRY_API_URL: 'https://go.linketry-test.net',
  LINKETRY_PAGES_PROJECT: 'linketry-admin-new',
  LINKETRY_D1_DATABASE_NAME: 'linketry-new',
  LINKETRY_D1_DATABASE_ID: '11111111-1111-4111-8111-111111111111',
  LINKETRY_KV_NAMESPACE_ID: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  LINKETRY_BACKUP_VERIFIED: 'true',
  LINKETRY_MIGRATIONS_REVIEWED: 'true',
  LINKETRY_UPGRADE_TARGET_CONFIRMED: 'true',
  LINKETRY_BACKUP_REFERENCE: 'd1-pitr:2026-07-16T10:00:00Z',
};

function createRunner() {
  const calls = [];
  const runner = async (args) => {
    calls.push(args.join(' '));
    if (args[0] === 'd1' && args[1] === 'list') {
      return {
        status: 0,
        stdout: JSON.stringify([
          { uuid: baseEnv.LINKETRY_D1_DATABASE_ID, name: baseEnv.LINKETRY_D1_DATABASE_NAME },
        ]),
      };
    }
    if (args[0] === 'kv') {
      return {
        status: 0,
        stdout: JSON.stringify([{ id: baseEnv.LINKETRY_KV_NAMESPACE_ID, title: 'linketry-new' }]),
      };
    }
    return { status: 0, stdout: 'ok' };
  };
  return { runner, calls };
}

test('upgrade gate binds approval to release, commit, migrations, backup, and remote resources', async () => {
  const { runner, calls } = createRunner();
  const report = await runDeploymentWorkflowGate({
    env: baseEnv,
    version,
    migrations,
    runner,
  });

  assert.equal(report.ok, true);
  assert.equal(report.mutationPerformed, false);
  assert.equal(report.migrationDigest, migrationDigest);
  assert.equal(report.preflight.ok, true);
  assert.equal(calls.at(-1), 'd1 migrations list linketry-new --remote --cwd apps/worker');
  assert.doesNotMatch(JSON.stringify(report), /must-never-appear/);
});

test('fresh gate uses fresh confirmation while retaining release-bound approval', async () => {
  const { runner } = createRunner();
  const report = await runDeploymentWorkflowGate({
    env: {
      ...baseEnv,
      LINKETRY_DEPLOYMENT_TRACK: 'fresh',
      LINKETRY_FRESH_INSTALL_CONFIRMED: 'true',
    },
    version,
    migrations,
    runner,
  });

  assert.equal(report.ok, true);
  assert.equal(report.track, 'fresh');
});

test('Demo is rejected from the production workflow before Cloudflare access', async () => {
  const { runner, calls } = createRunner();
  const report = await runDeploymentWorkflowGate({
    env: { ...baseEnv, LINKETRY_DEPLOYMENT_TRACK: 'demo' },
    version,
    migrations,
    runner,
  });

  assert.equal(report.ok, false);
  assert.equal(calls.length, 0);
  assert.match(
    report.checks.find((check) => check.code === 'deployment-track')?.message,
    /separate workflow/
  );
});

test('release or commit mismatch fails closed before Cloudflare access', async () => {
  const { runner, calls } = createRunner();
  const report = await runDeploymentWorkflowGate({
    env: {
      ...baseEnv,
      LINKETRY_APPROVED_RELEASE: '0.13.0',
      LINKETRY_APPROVED_COMMIT: 'b'.repeat(40),
    },
    version,
    migrations,
    runner,
  });

  assert.equal(report.ok, false);
  assert.equal(calls.length, 0);
  assert.equal(report.checks.find((check) => check.code === 'approved-release')?.status, 'fail');
  assert.equal(report.checks.find((check) => check.code === 'approved-commit')?.status, 'fail');
});

test('migration digest mismatch blocks a release before Cloudflare access', async () => {
  const { runner, calls } = createRunner();
  const report = await runDeploymentWorkflowGate({
    env: { ...baseEnv, LINKETRY_APPROVED_MIGRATIONS_SHA256: 'c'.repeat(64) },
    version,
    migrations,
    runner,
  });

  assert.equal(report.ok, false);
  assert.equal(calls.length, 0);
  assert.equal(report.checks.find((check) => check.code === 'approved-migrations')?.status, 'fail');
});

test('destructive SQL is rejected even when its digest was approved', async () => {
  const unsafeMigrations = [
    ...migrations,
    { name: '0003_bad.sql', source: 'DROP TABLE links; DELETE FROM visits;' },
  ];
  const { runner, calls } = createRunner();
  const report = await runDeploymentWorkflowGate({
    env: {
      ...baseEnv,
      LINKETRY_APPROVED_MIGRATIONS_SHA256: inspectMigrations(unsafeMigrations).digest,
    },
    version,
    migrations: unsafeMigrations,
    runner,
  });

  assert.equal(report.ok, false);
  assert.equal(calls.length, 0);
  assert.equal(report.checks.find((check) => check.code === 'migration-policy')?.status, 'fail');
  assert.match(report.checks.find((check) => check.code === 'migration-policy')?.message, /DROP/);
});

test('SQL policy ignores destructive words inside comments', () => {
  const policy = inspectMigrations([
    {
      name: '0001.sql',
      source: '-- DROP TABLE links\nCREATE TABLE links (id TEXT); /* DELETE FROM links; */',
    },
  ]);

  assert.deepEqual(policy.unsafe, []);
});

test('migration digest is stable across Windows and Unix line endings', () => {
  const unix = inspectMigrations([
    { name: '0001.sql', source: 'CREATE TABLE links (\nid TEXT\n);\n' },
  ]);
  const windows = inspectMigrations([
    { name: '0001.sql', source: 'CREATE TABLE links (\r\nid TEXT\r\n);\r\n' },
  ]);

  assert.equal(windows.digest, unix.digest);
});

test('production workflow runs the safety gate before every Cloudflare write', () => {
  const workflow = readFileSync(
    new URL('../.github/workflows/deploy.yml', import.meta.url),
    'utf8'
  );
  const gate = workflow.indexOf('- name: Enforce deployment safety gate');
  const secret = workflow.indexOf('- name: Ensure LINKETRY_ADMIN_TOKEN secret');
  const updateSecret = workflow.indexOf('- name: Configure optional online-upgrade secret');
  const migrations = workflow.indexOf('- name: Apply D1 migrations');
  const deploy = workflow.indexOf('- name: Deploy Worker');
  const siteDeploy = workflow.indexOf('- name: Deploy project site');

  assert.ok(gate > -1);
  assert.ok(gate < secret);
  assert.ok(secret < updateSecret);
  assert.ok(updateSecret < migrations);
  assert.ok(migrations < deploy);
  assert.ok(deploy < siteDeploy);
  for (const name of [
    'LINKETRY_DEPLOYMENT_TRACK',
    'LINKETRY_APPROVED_RELEASE',
    'LINKETRY_APPROVED_COMMIT',
    'LINKETRY_APPROVED_MIGRATIONS_SHA256',
  ]) {
    assert.match(workflow, new RegExp(`${name}: \\$\\{\\{ vars\\.${name} \\}\\}`));
  }
  assert.match(workflow, /confirm_release:/);
  assert.match(workflow, /uses: actions\/checkout@v6/);
  assert.match(workflow, /uses: actions\/setup-node@v6/);
  assert.doesNotMatch(workflow, /uses: actions\/(?:checkout|setup-node)@v4/);
  assert.match(workflow, /deploy:\s*\r?\n\s+runs-on: ubuntu-latest\s*\r?\n\s+environment: production/);
  assert.match(workflow, /LINKETRY_MANUAL_RELEASE_APPROVED: \$\{\{ inputs\.confirm_release \}\}/);
  assert.match(workflow, /node scripts\/deployment-release-approval\.mjs/);
  assert.match(
    workflow,
    /VITE_LINKETRY_REPOSITORY_URL: \$\{\{ github\.server_url \}\}\/\$\{\{ github\.repository \}\}/
  );
  assert.match(workflow, /VITE_LINKETRY_UPDATE_BRANCH: \$\{\{ env\.LINKETRY_UPDATE_BRANCH \}\}/);
  assert.match(
    workflow,
    /LINKETRY_GITHUB_UPDATE_TOKEN_OVERRIDE: \$\{\{ secrets\.LINKETRY_GITHUB_UPDATE_TOKEN \}\}/
  );
  assert.match(workflow, /LINKETRY_UPDATE_REPOSITORY: \$\{\{ github\.repository \}\}/);
  assert.match(workflow, /LINKETRY_UPDATE_BRANCH: \$\{\{ github\.ref_name \}\}/);
  assert.doesNotMatch(workflow, /VITE_[A-Z0-9_]*GITHUB_UPDATE_TOKEN/);
});

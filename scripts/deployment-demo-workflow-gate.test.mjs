import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { inspectMigrations } from './deployment-workflow-gate.mjs';
import { runDemoDeploymentWorkflowGate } from './deployment-demo-workflow-gate.mjs';

const version = '0.19.0';
const commit = 'a'.repeat(40);
const migrations = [
  { name: '0001_init.sql', source: 'CREATE TABLE links (id TEXT PRIMARY KEY);' },
  { name: '0002_add.sql', source: 'ALTER TABLE links ADD COLUMN title TEXT;' },
];
const baseEnv = {
  GITHUB_EVENT_NAME: 'workflow_dispatch',
  GITHUB_SHA: commit,
  CLOUDFLARE_ACCOUNT_ID: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  CLOUDFLARE_API_TOKEN: 'demo-token-must-never-appear',
  LINKETRY_ADMIN_TOKEN_OVERRIDE: 'demo-admin-token-must-never-appear',
  LINKETRY_DEMO_DEPLOY_CONFIRMATION: 'DEPLOY LINKETRY DEMO',
  LINKETRY_DEMO_CREDENTIAL_SCOPE_CONFIRMED: 'true',
  LINKETRY_DEMO_ISOLATION_CONFIRMED: 'true',
  LINKETRY_DEMO_SYNTHETIC_DATA_ONLY: 'true',
  LINKETRY_DEMO_APPROVED_RELEASE: version,
  LINKETRY_DEMO_APPROVED_COMMIT: commit,
  LINKETRY_DEMO_APPROVED_MIGRATIONS_SHA256: inspectMigrations(migrations).digest,
  LINKETRY_WORKER_NAME: 'linketry-demo-worker',
  LINKETRY_WORKER_DOMAINS: 'go.demo-linketry.net',
  LINKETRY_API_URL: 'https://go.demo-linketry.net',
  LINKETRY_ADMIN_URL: 'https://linketry-demo-admin.pages.dev',
  LINKETRY_PAGES_PROJECT: 'linketry-demo-admin',
  LINKETRY_D1_DATABASE_NAME: 'linketry-demo-d1',
  LINKETRY_D1_DATABASE_ID: '11111111-1111-4111-8111-111111111111',
  LINKETRY_KV_NAMESPACE_ID: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  LINKETRY_PROTECTED_ACCOUNT_IDS: 'cccccccccccccccccccccccccccccccc',
  LINKETRY_PROTECTED_RESOURCE_IDS:
    '99999999-9999-4999-8999-999999999999,dddddddddddddddddddddddddddddddd',
  LINKETRY_PROTECTED_RESOURCE_NAMES: 'linketry-worker,linketry-admin,linketry-d1',
  LINKETRY_PROTECTED_DOMAINS: 'go.linketry.com,admin.linketry.com',
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
        stdout: JSON.stringify([{ id: baseEnv.LINKETRY_KV_NAMESPACE_ID, title: 'demo-kv' }]),
      };
    }
    return { status: 0, stdout: 'ok' };
  };
  return { runner, calls };
}

test('Demo gate binds manual approval to an isolated account, release, commit, and migrations', async () => {
  const { runner, calls } = createRunner();
  const report = await runDemoDeploymentWorkflowGate({
    env: baseEnv,
    version,
    migrations,
    runner,
  });

  assert.equal(report.ok, true);
  assert.equal(report.mutationPerformed, false);
  assert.equal(report.preflight.ok, true);
  assert.equal(
    calls.at(-1),
    'd1 migrations list linketry-demo-d1 --remote --config wrangler.demo.toml --cwd apps/worker'
  );
  assert.doesNotMatch(JSON.stringify(report), /demo-token-must-never-appear/);
  assert.doesNotMatch(JSON.stringify(report), /demo-admin-token-must-never-appear/);
});

test('Demo gate rejects a protected production account before Cloudflare access', async () => {
  const { runner, calls } = createRunner();
  const report = await runDemoDeploymentWorkflowGate({
    env: { ...baseEnv, LINKETRY_PROTECTED_ACCOUNT_IDS: baseEnv.CLOUDFLARE_ACCOUNT_ID },
    version,
    migrations,
    runner,
  });

  assert.equal(report.ok, false);
  assert.equal(calls.length, 0);
  assert.equal(
    report.checks.find((check) => check.code === 'demo-account-isolation')?.status,
    'fail'
  );
});

test('Demo gate rejects an invalid protected-account inventory before Cloudflare access', async () => {
  const { runner, calls } = createRunner();
  const report = await runDemoDeploymentWorkflowGate({
    env: { ...baseEnv, LINKETRY_PROTECTED_ACCOUNT_IDS: '<production-account-id>' },
    version,
    migrations,
    runner,
  });

  assert.equal(report.ok, false);
  assert.equal(calls.length, 0);
  assert.equal(
    report.checks.find((check) => check.code === 'protected-account-list')?.status,
    'fail'
  );
});

test('Demo gate rejects automatic triggers and an incorrect confirmation', async () => {
  const { runner, calls } = createRunner();
  const report = await runDemoDeploymentWorkflowGate({
    env: {
      ...baseEnv,
      GITHUB_EVENT_NAME: 'push',
      LINKETRY_DEMO_DEPLOY_CONFIRMATION: 'deploy',
    },
    version,
    migrations,
    runner,
  });

  assert.equal(report.ok, false);
  assert.equal(calls.length, 0);
  assert.equal(report.checks.find((check) => check.code === 'manual-trigger')?.status, 'fail');
  assert.equal(report.checks.find((check) => check.code === 'deploy-confirmation')?.status, 'fail');
});

test('Demo gate requires reserved resource names and exact release approval', async () => {
  const { runner, calls } = createRunner();
  const report = await runDemoDeploymentWorkflowGate({
    env: {
      ...baseEnv,
      LINKETRY_WORKER_NAME: 'linketry-worker',
      LINKETRY_DEMO_APPROVED_RELEASE: '0.17.0',
    },
    version,
    migrations,
    runner,
  });

  assert.equal(report.ok, false);
  assert.equal(calls.length, 0);
  assert.equal(
    report.checks.find((check) => check.code === 'demo-resource-prefix')?.status,
    'fail'
  );
  assert.equal(report.checks.find((check) => check.code === 'approved-release')?.status, 'fail');
});

test('Demo gate rejects duplicate core resource names', async () => {
  const { runner, calls } = createRunner();
  const report = await runDemoDeploymentWorkflowGate({
    env: {
      ...baseEnv,
      LINKETRY_PAGES_PROJECT: baseEnv.LINKETRY_WORKER_NAME,
    },
    version,
    migrations,
    runner,
  });

  assert.equal(report.ok, false);
  assert.equal(calls.length, 0);
  assert.equal(
    report.checks.find((check) => check.code === 'demo-resource-prefix')?.status,
    'fail'
  );
});

test('Demo gate rejects compatibility-date config injection', async () => {
  const { runner, calls } = createRunner();
  const report = await runDemoDeploymentWorkflowGate({
    env: {
      ...baseEnv,
      LINKETRY_COMPATIBILITY_DATE: '2026-07-16"\nroutes = []',
    },
    version,
    migrations,
    runner,
  });

  assert.equal(report.ok, false);
  assert.equal(calls.length, 0);
  assert.equal(report.checks.find((check) => check.code === 'compatibility-date')?.status, 'fail');
});

test('Demo workflow keeps its gate before all Cloudflare writes and uses Demo-only credentials', () => {
  const workflow = readFileSync(
    new URL('../.github/workflows/deploy-demo.yml', import.meta.url),
    'utf8'
  );
  const gate = workflow.indexOf('- name: Enforce isolated Demo safety gate');
  const secret = workflow.indexOf('- name: Set isolated Demo Admin token');
  const migrations = workflow.indexOf('- name: Apply isolated Demo migrations');
  const worker = workflow.indexOf('- name: Deploy isolated Demo Worker');
  const admin = workflow.indexOf('- name: Deploy isolated Demo Admin');

  assert.ok(gate > -1);
  assert.ok(gate < secret);
  assert.ok(secret < migrations);
  assert.ok(migrations < worker);
  assert.ok(worker < admin);
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\n  push:/);
  assert.match(workflow, /secrets\.LINKETRY_DEMO_CLOUDFLARE_API_TOKEN/);
  assert.match(workflow, /secrets\.LINKETRY_DEMO_CLOUDFLARE_ACCOUNT_ID/);
  assert.doesNotMatch(workflow, /secrets\.CLOUDFLARE_API_TOKEN/);
  assert.doesNotMatch(workflow, /Ensure Linketry Admin DNS|Deploy project site/);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { inspectMigrations } from './deployment-workflow-gate.mjs';
import { runDemoDeploymentWorkflowGate } from './deployment-demo-workflow-gate.mjs';

const version = '0.23.0';
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
  LINKETRY_API_ORIGIN_URL: 'https://go.demo-linketry.net',
  LINKETRY_API_PAGES_PROJECT: 'linketry-demo-api',
  LINKETRY_API_CUSTOM_DOMAIN: 'demoapi.demo-linketry.net',
  LINKETRY_ADMIN_URL: 'https://linketry-demo-admin.pages.dev',
  LINKETRY_PAGES_PROJECT: 'linketry-demo-admin',
  LINKETRY_D1_DATABASE_NAME: 'linketry-demo-d1',
  LINKETRY_D1_DATABASE_ID: '11111111-1111-4111-8111-111111111111',
  LINKETRY_KV_NAMESPACE_ID: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  LINKETRY_R2_BUCKET: 'linketry-demo-backups',
  LINKETRY_R2_PREVIEW_BUCKET: 'linketry-demo-backups-preview',
  LINKETRY_VISITS_QUEUE: 'linketry-demo-visits',
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
    if (args[0] === 'r2') {
      return {
        status: 0,
        stdout: JSON.stringify([
          { name: baseEnv.LINKETRY_R2_BUCKET },
          { name: baseEnv.LINKETRY_R2_PREVIEW_BUCKET },
        ]),
      };
    }
    if (args[0] === 'queues') {
      return {
        status: 0,
        stdout: JSON.stringify([{ queue_name: baseEnv.LINKETRY_VISITS_QUEUE }]),
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

test('Demo gate rejects an API gateway that overlaps another Demo resource', async () => {
  const { runner, calls } = createRunner();
  const report = await runDemoDeploymentWorkflowGate({
    env: {
      ...baseEnv,
      LINKETRY_API_PAGES_PROJECT: baseEnv.LINKETRY_WORKER_NAME,
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

test('Demo gate permits a reviewed public API domain with an isolated Worker origin', async () => {
  const { runner } = createRunner();
  const report = await runDemoDeploymentWorkflowGate({
    env: {
      ...baseEnv,
      LINKETRY_API_URL: baseEnv.LINKETRY_API_CUSTOM_DOMAIN.replace(/^/, 'https://'),
    },
    version,
    migrations,
    runner,
  });

  assert.equal(report.ok, true);
  assert.equal(
    report.preflight.checks.find((check) => check.code === 'api-domain-binding')?.status,
    'pass'
  );
  assert.equal(
    report.preflight.checks.find((check) => check.code === 'demo-api-public-domain')?.status,
    'pass'
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

test('Demo gate accepts workers.dev only through the explicit isolated routing mode', async () => {
  const { runner } = createRunner();
  const env = {
    ...baseEnv,
    LINKETRY_DEMO_USE_WORKERS_DEV: 'true',
    LINKETRY_WORKER_DOMAINS: 'linketry-demo-worker.demo-account.workers.dev',
    LINKETRY_API_URL: 'https://linketry-demo-worker.demo-account.workers.dev',
    LINKETRY_API_ORIGIN_URL: 'https://linketry-demo-worker.demo-account.workers.dev',
  };
  const report = await runDemoDeploymentWorkflowGate({ env, version, migrations, runner });

  assert.equal(report.ok, true);
  assert.equal(report.checks.find((check) => check.code === 'demo-worker-routing')?.status, 'pass');

  const invalid = await runDemoDeploymentWorkflowGate({
    env: { ...env, LINKETRY_DEMO_USE_WORKERS_DEV: 'false' },
    version,
    migrations,
    runner,
  });
  assert.equal(invalid.ok, false);
  assert.equal(
    invalid.checks.find((check) => check.code === 'demo-worker-routing')?.status,
    'fail'
  );
});

test('Demo workflow keeps its gate before all Cloudflare writes and uses Demo-only credentials', () => {
  const workflow = readFileSync(
    new URL('../.github/workflows/deploy-demo.yml', import.meta.url),
    'utf8'
  ).replace(/\r\n/g, '\n');
  const gate = workflow.indexOf('- name: Enforce isolated Demo safety gate');
  const apiProject = workflow.indexOf('- name: Ensure isolated Demo API Pages project');
  const resources = workflow.indexOf('- name: Ensure isolated Demo advanced resources');
  const secret = workflow.indexOf('- name: Set isolated Demo Admin token');
  const migrations = workflow.indexOf('- name: Apply isolated Demo migrations');
  const seed = workflow.indexOf('- name: Seed isolated synthetic Demo data');
  const featureSeed = workflow.indexOf('- name: Seed synthetic Demo feature settings');
  const worker = workflow.indexOf('- name: Deploy isolated Demo Worker');
  const apiGateway = workflow.indexOf('- name: Deploy isolated Demo API gateway');
  const apiDomain = workflow.indexOf('- name: Register isolated Demo API custom domain');
  const admin = workflow.indexOf('- name: Deploy isolated Demo Admin');
  const apiGatewayParity = workflow.indexOf('- name: Verify isolated Demo API gateway');
  const parity = workflow.indexOf('- name: Verify Demo production parity');
  const summary = workflow.indexOf('- name: Write isolated Demo summary');

  assert.ok(gate > -1);
  assert.ok(gate < apiProject);
  assert.ok(apiProject < resources);
  assert.ok(resources < secret);
  assert.ok(secret < migrations);
  assert.ok(migrations < seed);
  assert.ok(seed < featureSeed);
  assert.ok(featureSeed < worker);
  assert.ok(worker < apiGateway);
  assert.ok(apiGateway < apiDomain);
  assert.ok(apiDomain < admin);
  assert.ok(admin < apiGatewayParity);
  assert.ok(apiGatewayParity < parity);
  assert.ok(parity < summary);
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\n  push:/);
  assert.match(workflow, /uses: actions\/checkout@v6/);
  assert.match(workflow, /uses: actions\/setup-node@v6/);
  assert.doesNotMatch(workflow, /uses: actions\/(?:checkout|setup-node)@v4/);
  assert.match(workflow, /secrets\.LINKETRY_DEMO_CLOUDFLARE_API_TOKEN/);
  assert.match(workflow, /secrets\.LINKETRY_DEMO_CLOUDFLARE_ACCOUNT_ID/);
  assert.match(workflow, /VITE_LINKETRY_DEMO_MODE: 'true'/);
  assert.match(workflow, /VITE_LINKETRY_DEMO_ACCESS_CODE/);
  assert.match(workflow, /LINKETRY_DEMO_ACCESS_CODE/);
  assert.match(workflow, /LINKETRY_DEMO_USE_WORKERS_DEV/);
  assert.match(workflow, /LINKETRY_DEMO_API_ORIGIN_URL/);
  assert.match(workflow, /LINKETRY_DEMO_API_PAGES_PROJECT/);
  assert.match(workflow, /LINKETRY_DEMO_API_CUSTOM_DOMAIN/);
  assert.match(workflow, /scripts\/demo-seed\.mjs \\\n\s+--origin "\$LINKETRY_API_ORIGIN_URL"/);
  assert.match(workflow, /LINKETRY_DEMO_R2_BUCKET/);
  assert.match(workflow, /LINKETRY_DEMO_VISITS_QUEUE/);
  assert.match(workflow, /wrangler r2 bucket list\)/);
  assert.match(workflow, /wrangler queues list\)/);
  assert.doesNotMatch(workflow, /wrangler (?:r2 bucket|queues) list --json/);
  assert.match(workflow, /\[\[r2_buckets\]\]/);
  assert.match(workflow, /\[\[queues\.producers\]\]/);
  assert.match(workflow, /Upload isolated synthetic Demo artifacts/);
  assert.match(workflow, /binding: 'DEMO_API'/);
  assert.match(workflow, /pages deploy public/);
  assert.match(workflow, /scripts\/pages-project-inventory\.mjs/);
  assert.match(workflow, /scripts\/cloudflare-pages-domain\.mjs/);
  assert.match(workflow, /workers_dev = true/);
  assert.match(workflow, /LINKETRY_DEMO_MODE = "read-only"/);
  assert.match(workflow, /LINKETRY_DAILY_CRON = "15 3 \* \* \*"/);
  assert.match(workflow, /LINKETRY_HEALTH_CRON = "15 \* \* \* \*"/);
  assert.match(workflow, /name = "DEMO_RATE_LIMITER"/);
  assert.match(workflow, /limit = 120/);
  assert.match(workflow, /period = 60/);
  assert.match(workflow, /scripts\/demo-seed\.mjs/);
  assert.match(workflow, /scripts\/demo-feature-seed\.mjs/);
  assert.match(workflow, /scripts\/demo-live-smoke\.mjs/);
  assert.doesNotMatch(workflow, /secrets\.CLOUDFLARE_API_TOKEN/);
  assert.doesNotMatch(workflow, /Ensure Linketry Admin DNS|Deploy project site/);
});

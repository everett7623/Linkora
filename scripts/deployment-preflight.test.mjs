import assert from 'node:assert/strict';
import test from 'node:test';
import { runPreflight } from './deployment-preflight.mjs';

const baseEnv = {
  CLOUDFLARE_ACCOUNT_ID: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  CLOUDFLARE_API_TOKEN: 'must-never-appear-in-output',
  LINKETRY_WORKER_NAME: 'linketry-worker-new',
  LINKETRY_WORKER_DOMAINS: 'go.linketry-test.net',
  LINKETRY_API_URL: 'https://go.linketry-test.net',
  LINKETRY_PAGES_PROJECT: 'linketry-admin-new',
  LINKETRY_D1_DATABASE_NAME: 'linketry-new',
  LINKETRY_D1_DATABASE_ID: '11111111-1111-4111-8111-111111111111',
  LINKETRY_KV_NAMESPACE_ID: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  LINKETRY_FRESH_INSTALL_CONFIRMED: 'true',
};

test('fresh preflight passes and never exposes credentials', async () => {
  const report = await runPreflight({ track: 'fresh', env: baseEnv });

  assert.equal(report.ok, true);
  assert.equal(report.mutationPerformed, false);
  assert.match(report.targets.accountId, /^\*+a{6}$/);
  assert.doesNotMatch(JSON.stringify(report), /must-never-appear-in-output/);
});

test('fresh preflight rejects example domains and mismatched API bindings', async () => {
  const report = await runPreflight({
    track: 'fresh',
    env: {
      ...baseEnv,
      LINKETRY_WORKER_DOMAINS: 'go.example.com',
      LINKETRY_API_URL: 'https://api.linketry-test.net',
    },
  });

  assert.equal(report.ok, false);
  assert.equal(report.checks.find((check) => check.code === 'worker-domains')?.status, 'fail');
  assert.equal(report.checks.find((check) => check.code === 'api-domain-binding')?.status, 'fail');
});

test('local Wrangler authentication can be used without exposing or requiring an API token', async () => {
  const { CLOUDFLARE_API_TOKEN: _removed, ...wranglerLoginEnv } = baseEnv;
  const report = await runPreflight({ track: 'fresh', env: wranglerLoginEnv });

  assert.equal(report.ok, true);
  assert.equal(
    report.checks.find((check) => check.code === 'api-token-optional-local')?.status,
    'warn'
  );
});

test('upgrade preflight requires backup, migration, and target gates', async () => {
  const failed = await runPreflight({ track: 'upgrade', env: baseEnv });
  assert.equal(failed.ok, false);
  assert.equal(
    failed.checks.find((check) => check.code === 'upgrade-backup-reference')?.status,
    'fail'
  );

  const passed = await runPreflight({
    track: 'upgrade',
    env: {
      ...baseEnv,
      LINKETRY_BACKUP_VERIFIED: 'true',
      LINKETRY_MIGRATIONS_REVIEWED: 'true',
      LINKETRY_UPGRADE_TARGET_CONFIRMED: 'true',
      LINKETRY_BACKUP_REFERENCE: 'd1-pitr:2026-07-16T08:00:00Z',
    },
  });
  assert.equal(passed.ok, true);
});

test('upgrade preflight rejects destructive deployment flags', async () => {
  const report = await runPreflight({
    track: 'upgrade',
    env: {
      ...baseEnv,
      LINKETRY_BACKUP_VERIFIED: 'true',
      LINKETRY_MIGRATIONS_REVIEWED: 'true',
      LINKETRY_UPGRADE_TARGET_CONFIRMED: 'true',
      LINKETRY_BACKUP_REFERENCE: 'backup.json:verified',
      LINKETRY_ALLOW_FACTORY_RESET: 'true',
    },
  });

  assert.equal(report.ok, false);
  assert.equal(
    report.checks.find((check) => check.code.includes('allow_factory_reset'))?.status,
    'fail'
  );
});

test('demo preflight fails closed when production protection lists are absent or overlap', async () => {
  const absent = await runPreflight({
    track: 'demo',
    env: {
      ...baseEnv,
      LINKETRY_DEMO_ISOLATION_CONFIRMED: 'true',
      LINKETRY_DEMO_SYNTHETIC_DATA_ONLY: 'true',
    },
  });
  assert.equal(absent.ok, false);
  assert.equal(
    absent.checks.find((check) => check.code === 'demo-protection-lists')?.status,
    'fail'
  );

  const overlap = await runPreflight({
    track: 'demo',
    env: {
      ...baseEnv,
      LINKETRY_DEMO_ISOLATION_CONFIRMED: 'true',
      LINKETRY_DEMO_SYNTHETIC_DATA_ONLY: 'true',
      LINKETRY_PROTECTED_RESOURCE_IDS: baseEnv.LINKETRY_D1_DATABASE_ID,
      LINKETRY_PROTECTED_RESOURCE_NAMES: 'production-worker,production-admin,production-d1',
      LINKETRY_PROTECTED_DOMAINS: 'go.production.net,admin.production.net',
    },
  });
  assert.equal(overlap.ok, false);
  assert.equal(overlap.checks.find((check) => check.code === 'demo-id-isolation')?.status, 'fail');
});

test('demo preflight passes when all targets are isolated', async () => {
  const report = await runPreflight({
    track: 'demo',
    env: {
      ...baseEnv,
      LINKETRY_DEMO_ISOLATION_CONFIRMED: 'true',
      LINKETRY_DEMO_SYNTHETIC_DATA_ONLY: 'true',
      LINKETRY_PROTECTED_RESOURCE_IDS:
        '99999999-9999-4999-8999-999999999999,cccccccccccccccccccccccccccccccc',
      LINKETRY_PROTECTED_RESOURCE_NAMES: 'production-worker,production-admin,production-d1',
      LINKETRY_PROTECTED_DOMAINS: 'go.production.net,admin.production.net',
    },
  });

  assert.equal(report.ok, true);
});

test('optional R2 bindings must be configured as a pair', async () => {
  const report = await runPreflight({
    track: 'fresh',
    env: { ...baseEnv, LINKETRY_R2_BUCKET: 'linketry-backups-new' },
  });

  assert.equal(report.ok, false);
  assert.equal(report.checks.find((check) => check.code === 'r2-pair')?.status, 'fail');
});

test('Cloudflare checks verify the selected D1 and KV resources using read-only commands', async () => {
  const calls = [];
  const runner = async (args) => {
    calls.push(args.join(' '));
    if (args[0] === 'd1') {
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
    return { status: 0, stdout: 'authenticated' };
  };

  const report = await runPreflight({
    track: 'fresh',
    env: baseEnv,
    checkCloudflare: true,
    runner,
  });

  assert.equal(report.ok, true);
  assert.deepEqual(calls, [
    `whoami --account ${baseEnv.CLOUDFLARE_ACCOUNT_ID}`,
    'd1 list --json',
    'kv namespace list',
  ]);
  assert.equal(
    report.checks.find((check) => check.code === 'cloudflare-d1-target')?.status,
    'pass'
  );
  assert.equal(
    report.checks.find((check) => check.code === 'cloudflare-kv-target')?.status,
    'pass'
  );
});

test('Cloudflare checks verify configured R2 and Queue access before deployment writes', async () => {
  const env = {
    ...baseEnv,
    LINKETRY_R2_BUCKET: 'linketry-backups-new',
    LINKETRY_R2_PREVIEW_BUCKET: 'linketry-backups-preview-new',
    LINKETRY_VISITS_QUEUE: 'linketry-visits-new',
  };
  const calls = [];
  const runner = async (args) => {
    calls.push(args.join(' '));
    if (args[0] === 'd1') {
      return {
        status: 0,
        stdout: JSON.stringify([
          { uuid: env.LINKETRY_D1_DATABASE_ID, name: env.LINKETRY_D1_DATABASE_NAME },
        ]),
      };
    }
    if (args[0] === 'kv') {
      return {
        status: 0,
        stdout: JSON.stringify([{ id: env.LINKETRY_KV_NAMESPACE_ID, title: 'linketry-new' }]),
      };
    }
    if (args[0] === 'r2') {
      return {
        status: 0,
        stdout: `name\n${env.LINKETRY_R2_BUCKET}\n${env.LINKETRY_R2_PREVIEW_BUCKET}`,
      };
    }
    if (args[0] === 'queues') {
      return { status: 0, stdout: JSON.stringify([{ queue_name: env.LINKETRY_VISITS_QUEUE }]) };
    }
    return { status: 0, stdout: 'authenticated' };
  };

  const report = await runPreflight({
    track: 'fresh',
    env,
    checkCloudflare: true,
    runner,
  });

  assert.equal(report.ok, true);
  assert.deepEqual(calls, [
    `whoami --account ${env.CLOUDFLARE_ACCOUNT_ID}`,
    'd1 list --json',
    'kv namespace list',
    'r2 bucket list',
    'queues list',
  ]);
  assert.equal(
    report.checks.find((check) => check.code === 'cloudflare-r2-target')?.status,
    'pass'
  );
  assert.equal(
    report.checks.find((check) => check.code === 'cloudflare-queue-target')?.status,
    'pass'
  );
});

test('Cloudflare checks warn when optional resources can be listed but are not created yet', async () => {
  const env = {
    ...baseEnv,
    LINKETRY_R2_BUCKET: 'linketry-backups-new',
    LINKETRY_R2_PREVIEW_BUCKET: 'linketry-backups-preview-new',
    LINKETRY_VISITS_QUEUE: 'linketry-visits-new',
  };
  const runner = async (args) => {
    if (args[0] === 'd1') {
      return {
        status: 0,
        stdout: JSON.stringify([
          { uuid: env.LINKETRY_D1_DATABASE_ID, name: env.LINKETRY_D1_DATABASE_NAME },
        ]),
      };
    }
    if (args[0] === 'kv') {
      return {
        status: 0,
        stdout: JSON.stringify([{ id: env.LINKETRY_KV_NAMESPACE_ID }]),
      };
    }
    if (args[0] === 'r2' || args[0] === 'queues') {
      return { status: 0, stdout: '[]' };
    }
    return { status: 0, stdout: 'authenticated' };
  };

  const report = await runPreflight({
    track: 'fresh',
    env,
    checkCloudflare: true,
    runner,
  });

  assert.equal(report.ok, true);
  assert.equal(
    report.checks.find((check) => check.code === 'cloudflare-r2-target')?.status,
    'warn'
  );
  assert.equal(
    report.checks.find((check) => check.code === 'cloudflare-queue-target')?.status,
    'warn'
  );
});

test('Cloudflare checks explain R2 account code 10042 before deployment writes', async () => {
  const env = {
    ...baseEnv,
    LINKETRY_R2_BUCKET: 'linketry-backups-new',
    LINKETRY_R2_PREVIEW_BUCKET: 'linketry-backups-preview-new',
  };
  const runner = async (args) => {
    if (args[0] === 'd1') {
      return {
        status: 0,
        stdout: JSON.stringify([
          { uuid: env.LINKETRY_D1_DATABASE_ID, name: env.LINKETRY_D1_DATABASE_NAME },
        ]),
      };
    }
    if (args[0] === 'kv') {
      return {
        status: 0,
        stdout: JSON.stringify([{ id: env.LINKETRY_KV_NAMESPACE_ID }]),
      };
    }
    if (args[0] === 'r2') {
      return {
        status: 1,
        stdout: '',
        stderr: 'Please enable R2 through the Cloudflare Dashboard. [code: 10042]',
      };
    }
    return { status: 0, stdout: 'authenticated' };
  };

  const report = await runPreflight({
    track: 'fresh',
    env,
    checkCloudflare: true,
    runner,
  });
  const accessCheck = report.checks.find((check) => check.code === 'cloudflare-r2-access');

  assert.equal(report.ok, false);
  assert.equal(accessCheck?.status, 'fail');
  assert.match(accessCheck?.message ?? '', /selected Cloudflare account \(code 10042\)/);
  assert.equal(
    report.checks.some((check) => check.code === 'cloudflare-r2-target'),
    false
  );
});

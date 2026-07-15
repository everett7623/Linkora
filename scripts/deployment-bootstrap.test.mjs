import assert from 'node:assert/strict';
import test from 'node:test';
import { deriveResourceNames, runBootstrap } from './deployment-bootstrap.mjs';

const accountId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const d1Id = '11111111-1111-4111-8111-111111111111';
const kvId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const baseOptions = {
  prefix: 'linketry-alice',
  domain: 'go.alice.dev',
  accountId,
};

function createRunner({ d1 = [], kv = [], failCreate = '' } = {}) {
  const state = { d1: [...d1], kv: [...kv], calls: [] };
  const runner = async (args) => {
    state.calls.push(args.join(' '));
    if (args[0] === 'whoami') return { status: 0, stdout: 'authenticated', stderr: '' };
    if (args[0] === 'd1' && args[1] === 'list') {
      return { status: 0, stdout: JSON.stringify(state.d1), stderr: '' };
    }
    if (args[0] === 'kv' && args[2] === 'list') {
      return { status: 0, stdout: JSON.stringify(state.kv), stderr: '' };
    }
    if (args[0] === 'd1' && args[1] === 'create') {
      if (failCreate === 'd1') return { status: 1, stdout: '', stderr: 'hidden failure' };
      state.d1.push({ name: args[2], uuid: d1Id });
      return { status: 0, stdout: 'created', stderr: '' };
    }
    if (args[0] === 'kv' && args[2] === 'create') {
      if (failCreate === 'kv') return { status: 1, stdout: '', stderr: 'hidden failure' };
      state.kv.push({ title: args[3], id: kvId });
      return { status: 0, stdout: 'created', stderr: '' };
    }
    return { status: 1, stdout: '', stderr: 'unexpected command' };
  };
  return { runner, state };
}

test('derives unique required and deployment resource names from one prefix', () => {
  assert.deepEqual(deriveResourceNames('linketry-alice'), {
    worker: 'linketry-alice-worker',
    pages: 'linketry-alice-admin',
    d1: 'linketry-alice-db',
    kv: 'linketry-alice-kv',
  });
});

test('dry-run plans missing D1 and KV resources without mutations or credential output', async () => {
  const { runner, state } = createRunner();
  const report = await runBootstrap({
    options: baseOptions,
    env: { CLOUDFLARE_API_TOKEN: 'must-never-appear' },
    runner,
  });

  assert.equal(report.ok, true);
  assert.equal(report.mode, 'dry-run');
  assert.equal(report.resources.d1.action, 'create');
  assert.equal(report.resources.kv.action, 'create');
  assert.equal(report.mutationAttempted, false);
  assert.equal(report.confirmation, 'fresh:aaaaaa:linketry-alice');
  assert.deepEqual(state.calls, [
    `whoami --account ${accountId}`,
    'd1 list --json',
    'kv namespace list',
  ]);
  assert.doesNotMatch(JSON.stringify(report), /must-never-appear/);
});

test('apply requires the exact account and prefix confirmation before any command', async () => {
  const { runner, state } = createRunner();
  const report = await runBootstrap({
    options: { ...baseOptions, apply: true, confirmation: 'wrong' },
    runner,
  });

  assert.equal(report.ok, false);
  assert.equal(report.mutationAttempted, false);
  assert.deepEqual(state.calls, []);
  assert.match(report.errors.join(' '), /fresh:aaaaaa:linketry-alice/);
});

test('apply creates only missing D1 and KV resources then prints complete bindings', async () => {
  const { runner, state } = createRunner();
  const report = await runBootstrap({
    options: {
      ...baseOptions,
      location: 'apac',
      apply: true,
      confirmation: 'fresh:aaaaaa:linketry-alice',
    },
    runner,
  });

  assert.equal(report.ok, true);
  assert.equal(report.mutationPerformed, true);
  assert.deepEqual(report.created, ['D1:linketry-alice-db', 'KV:linketry-alice-kv']);
  assert.equal(report.bindings.LINKETRY_D1_DATABASE_ID, d1Id);
  assert.equal(report.bindings.LINKETRY_KV_NAMESPACE_ID, kvId);
  assert.equal(report.bindings.LINKETRY_API_URL, 'https://go.alice.dev');
  assert.equal(report.bindingOutputReady, true);
  assert.ok(state.calls.includes('d1 create linketry-alice-db --location apac'));
  assert.ok(state.calls.includes('kv namespace create linketry-alice-kv'));
});

test('rerunning apply reuses exact resources and performs no writes', async () => {
  const { runner, state } = createRunner({
    d1: [{ name: 'linketry-alice-db', uuid: d1Id }],
    kv: [{ title: 'linketry-alice-kv', id: kvId }],
  });
  const report = await runBootstrap({
    options: {
      ...baseOptions,
      apply: true,
      confirmation: 'fresh:aaaaaa:linketry-alice',
    },
    runner,
  });

  assert.equal(report.ok, true);
  assert.equal(report.mutationAttempted, false);
  assert.equal(report.resources.d1.action, 'reuse');
  assert.equal(report.resources.kv.action, 'reuse');
  assert.equal(
    state.calls.some((call) => call.includes(' create ')),
    false
  );
});

test('an interrupted apply can reuse D1 and create only the missing KV namespace', async () => {
  const { runner, state } = createRunner({
    d1: [{ name: 'linketry-alice-db', uuid: d1Id }],
  });
  const report = await runBootstrap({
    options: {
      ...baseOptions,
      apply: true,
      confirmation: 'fresh:aaaaaa:linketry-alice',
    },
    runner,
  });

  assert.equal(report.ok, true);
  assert.deepEqual(report.created, ['KV:linketry-alice-kv']);
  assert.equal(
    state.calls.some((call) => call.startsWith('d1 create')),
    false
  );
  assert.equal(
    state.calls.some((call) => call === 'kv namespace create linketry-alice-kv'),
    true
  );
});

test('create failure is reported without deleting or hiding a previously created resource', async () => {
  const { runner } = createRunner({ failCreate: 'kv' });
  const report = await runBootstrap({
    options: {
      ...baseOptions,
      apply: true,
      confirmation: 'fresh:aaaaaa:linketry-alice',
    },
    runner,
  });

  assert.equal(report.ok, false);
  assert.equal(report.mutationAttempted, true);
  assert.deepEqual(report.created, ['D1:linketry-alice-db']);
  assert.equal(report.resources.d1.action, 'reuse');
  assert.equal(report.resources.kv.action, 'unresolved');
  assert.match(report.errors.join(' '), /KV resource linketry-alice-kv could not be created/);
});

test('duplicate exact-name resources fail closed before any create command', async () => {
  const { runner, state } = createRunner({
    kv: [
      { title: 'linketry-alice-kv', id: kvId },
      { title: 'linketry-alice-kv', id: 'cccccccccccccccccccccccccccccccc' },
    ],
  });
  const report = await runBootstrap({
    options: {
      ...baseOptions,
      apply: true,
      confirmation: 'fresh:aaaaaa:linketry-alice',
    },
    runner,
  });

  assert.equal(report.ok, false);
  assert.equal(report.mutationAttempted, false);
  assert.equal(
    state.calls.some((call) => call.includes(' create ')),
    false
  );
  assert.match(report.errors.join(' '), /Multiple KV resources use the exact name/);
});

test('invalid or maintainer-style inputs fail before Cloudflare access', async () => {
  const { runner, state } = createRunner();
  const report = await runBootstrap({
    options: {
      prefix: 'linketry-demo',
      domain: 'go.example.com',
      accountId: 'invalid',
    },
    runner,
  });

  assert.equal(report.ok, false);
  assert.equal(report.mutationAttempted, false);
  assert.deepEqual(state.calls, []);
  assert.equal(report.errors.length, 3);
});

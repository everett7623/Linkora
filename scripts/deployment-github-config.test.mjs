import assert from 'node:assert/strict';
import test from 'node:test';
import { expectedGitHubConfirmation, runGitHubConfiguration } from './deployment-github-config.mjs';

const accountId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const d1Id = '11111111-1111-4111-8111-111111111111';
const kvId = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const commit = 'cccccccccccccccccccccccccccccccccccccccc';
const migrationDigest = 'd'.repeat(64);
const baseOptions = {
  repository: 'alice/linketry',
  prefix: 'linketry-alice',
  domain: 'go.alice.dev',
  accountId,
};
const metadata = { version: '0.27.2', commit, clean: true, migrationDigest };

function bootstrapReady() {
  return Promise.resolve({
    ok: true,
    bindingOutputReady: true,
    resources: {
      d1: { name: 'linketry-alice-db', id: d1Id },
      kv: { name: 'linketry-alice-kv', id: kvId },
    },
  });
}

function createGitHubRunner({
  includeToken = true,
  failVariable = '',
  remoteCommit = commit,
} = {}) {
  const calls = [];
  const variables = new Map();
  const secrets = new Set(includeToken ? ['CLOUDFLARE_API_TOKEN'] : []);
  const runner = (args, options = {}) => {
    calls.push({ args: [...args], input: options.input ?? '' });
    if (args[0] === 'auth') return { status: 0, stdout: '', stderr: '' };
    if (args[0] === 'repo') {
      return { status: 0, stdout: JSON.stringify({ nameWithOwner: 'Alice/Linketry' }), stderr: '' };
    }
    if (args[0] === 'api') {
      return { status: 0, stdout: `${remoteCommit}\n`, stderr: '' };
    }
    if (args[0] === 'secret' && args[1] === 'list') {
      return {
        status: 0,
        stdout: JSON.stringify([...secrets].map((name) => ({ name }))),
        stderr: '',
      };
    }
    if (args[0] === 'secret' && args[1] === 'set') {
      secrets.add(args[2]);
      return { status: 0, stdout: '', stderr: '' };
    }
    if (args[0] === 'variable' && args[1] === 'set') {
      if (args[2] === failVariable) return { status: 1, stdout: '', stderr: 'hidden' };
      variables.set(args[2], args[4]);
      return { status: 0, stdout: '', stderr: '' };
    }
    if (args[0] === 'variable' && args[1] === 'list') {
      return {
        status: 0,
        stdout: JSON.stringify([...variables].map(([name, value]) => ({ name, value }))),
        stderr: '',
      };
    }
    return { status: 1, stdout: '', stderr: 'unexpected command' };
  };
  return { runner, calls, variables, secrets };
}

test('dry-run derives the complete minimum repository plan without GitHub mutations', async () => {
  const { runner, calls } = createGitHubRunner();
  const report = await runGitHubConfiguration({
    options: baseOptions,
    ghRunner: runner,
    bootstrap: bootstrapReady,
    metadata,
  });

  assert.equal(report.ok, true);
  assert.equal(report.mode, 'dry-run');
  assert.equal(report.mutationAttempted, false);
  assert.deepEqual(calls, []);
  assert.equal(report.variables.LINKETRY_API_URL, 'https://go.alice.dev');
  assert.equal(report.variables.LINKETRY_PAGES_PROJECT, 'linketry-alice-admin');
  assert.equal(report.variables.LINKETRY_D1_DATABASE_ID, d1Id);
  assert.equal(report.variables.LINKETRY_KV_NAMESPACE_ID, kvId);
  assert.equal(report.variables.LINKETRY_WORKER_DOMAINS, 'go.alice.dev');
  assert.equal(report.variables.LINKETRY_APPROVED_RELEASE, metadata.version);
  assert.equal(report.variables.LINKETRY_APPROVED_COMMIT, commit);
  assert.equal(report.variables.LINKETRY_APPROVED_MIGRATIONS_SHA256, migrationDigest);
  assert.equal('LINKETRY_SHORT_DOMAIN' in report.variables, false);
  assert.equal('LINKETRY_VERSION' in report.variables, false);
});

test('apply requires the exact repository/account/prefix confirmation before any access', async () => {
  const { runner, calls } = createGitHubRunner();
  let bootstrapCalls = 0;
  const report = await runGitHubConfiguration({
    options: { ...baseOptions, apply: true, confirmation: 'wrong' },
    ghRunner: runner,
    bootstrap: () => {
      bootstrapCalls += 1;
      return bootstrapReady();
    },
    metadata,
  });

  assert.equal(report.ok, false);
  assert.equal(bootstrapCalls, 0);
  assert.deepEqual(calls, []);
  assert.match(report.errors.join(' '), /github:alice\/linketry:aaaaaa:linketry-alice/);
});

test('apply fails before writes when the prompted Cloudflare API token secret is absent', async () => {
  const { runner, calls } = createGitHubRunner({ includeToken: false });
  const report = await runGitHubConfiguration({
    options: {
      ...baseOptions,
      apply: true,
      confirmation: expectedGitHubConfirmation(baseOptions),
    },
    ghRunner: runner,
    bootstrap: bootstrapReady,
    metadata,
  });

  assert.equal(report.ok, false);
  assert.equal(report.mutationAttempted, false);
  assert.match(report.errors.join(' '), /gh secret set CLOUDFLARE_API_TOKEN/);
  assert.equal(
    calls.some((call) => call.args[1] === 'set'),
    false
  );
});

test('apply refuses a local release that is not present on the fork main branch', async () => {
  const { runner, calls } = createGitHubRunner({ remoteCommit: 'e'.repeat(40) });
  const report = await runGitHubConfiguration({
    options: {
      ...baseOptions,
      apply: true,
      confirmation: expectedGitHubConfirmation(baseOptions),
    },
    ghRunner: runner,
    bootstrap: bootstrapReady,
    metadata,
  });

  assert.equal(report.ok, false);
  assert.equal(report.mutationAttempted, false);
  assert.match(report.errors.join(' '), /not the target repository main commit/i);
  assert.equal(
    calls.some((call) => call.args[1] === 'set'),
    false
  );
});

test('apply sets the account secret through stdin and verifies every variable', async () => {
  const { runner, calls, variables, secrets } = createGitHubRunner();
  const report = await runGitHubConfiguration({
    options: {
      ...baseOptions,
      apply: true,
      confirmation: expectedGitHubConfirmation(baseOptions),
    },
    ghRunner: runner,
    bootstrap: bootstrapReady,
    metadata,
  });

  assert.equal(report.ok, true);
  assert.equal(report.mutationPerformed, true);
  assert.equal(secrets.has('CLOUDFLARE_ACCOUNT_ID'), true);
  assert.equal(variables.get('LINKETRY_DEPLOYMENT_TRACK'), 'fresh');
  assert.equal(variables.get('LINKETRY_FRESH_INSTALL_CONFIRMED'), 'true');
  const accountWrite = calls.find((call) => call.args[0] === 'secret' && call.args[1] === 'set');
  assert.equal(accountWrite.input, `${accountId}\n`);
  assert.equal(accountWrite.args.includes(accountId), false);
  assert.doesNotMatch(JSON.stringify(report), new RegExp(accountId));
});

test('apply stops after a variable write failure and reports no command output', async () => {
  const { runner, calls } = createGitHubRunner({ failVariable: 'LINKETRY_WORKER_NAME' });
  const report = await runGitHubConfiguration({
    options: {
      ...baseOptions,
      apply: true,
      confirmation: expectedGitHubConfirmation(baseOptions),
    },
    ghRunner: runner,
    bootstrap: bootstrapReady,
    metadata,
  });

  assert.equal(report.ok, false);
  assert.match(report.errors.join(' '), /LINKETRY_WORKER_NAME/);
  assert.doesNotMatch(JSON.stringify(report), /hidden/);
  assert.equal(calls.some((call) => call.args[2] === 'LINKETRY_SHORT_DOMAIN'), false);
  assert.equal(calls.some((call) => call.args[2] === 'LINKETRY_VERSION'), false);
});

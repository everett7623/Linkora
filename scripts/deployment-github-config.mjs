import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { deriveResourceNames, runBootstrap } from './deployment-bootstrap.mjs';
import { runGitHubConfigurationCli } from './lib/deployment-github-config-cli.mjs';
import {
  expectedGitHubConfirmation,
  normalizeGitHubConfigurationOptions,
  readGitHubConfigValue as readValue,
  validateGitHubConfigurationOptions,
} from './lib/deployment-github-config-input.mjs';
import { inspectMigrations, readMigrationSources } from './deployment-workflow-gate.mjs';

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = resolve(SCRIPT_DIRECTORY, '..');
const RESOURCE_ID_PATTERN =
  /^(?:[a-f0-9]{32}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;
const SHA_PATTERN = /^[a-f0-9]{40}$/i;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/i;

function maskIdentifier(value) {
  if (!value) return 'not configured';
  if (value.length <= 8) return '*'.repeat(value.length);
  return `${'*'.repeat(Math.min(12, value.length - 6))}${value.slice(-6)}`;
}

export { expectedGitHubConfirmation };

function runCommand(command, args, { input = '' } = {}) {
  return spawnSync(command, args, {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    input,
    windowsHide: true,
  });
}

function runGitHub(args, options) {
  return runCommand('gh', args, options);
}

function runGit(args) {
  return runCommand('git', args);
}

function successful(result) {
  return Boolean(result) && result.status === 0;
}

function parseJsonResult(result, description) {
  if (!successful(result)) throw new Error(`${description} failed.`);
  try {
    return JSON.parse(readValue(result.stdout));
  } catch {
    throw new Error(`${description} returned unreadable JSON.`);
  }
}

function packageVersion() {
  const value = JSON.parse(readFileSync(resolve(REPOSITORY_ROOT, 'package.json'), 'utf8'));
  return readValue(value.version);
}

export function readReleaseMetadata({ gitRunner = runGit } = {}) {
  const commitResult = gitRunner(['rev-parse', 'HEAD']);
  const statusResult = gitRunner(['status', '--porcelain']);
  const commit = successful(commitResult) ? readValue(commitResult.stdout).toLowerCase() : '';
  const clean = successful(statusResult) && !readValue(statusResult.stdout);
  const migrationDigest = inspectMigrations(readMigrationSources()).digest;
  return { version: packageVersion(), commit, clean, migrationDigest };
}

export function buildGitHubVariables({ config, resources, metadata }) {
  const names = deriveResourceNames(config.prefix);
  return {
    LINKETRY_API_URL: `https://${config.domain}`,
    LINKETRY_PAGES_PROJECT: names.pages,
    LINKETRY_WORKER_NAME: names.worker,
    LINKETRY_WORKER_DOMAINS: config.domain,
    LINKETRY_D1_DATABASE_NAME: names.d1,
    LINKETRY_D1_DATABASE_ID: resources.d1.id,
    LINKETRY_KV_NAMESPACE_ID: resources.kv.id,
    LINKETRY_DEPLOYMENT_TRACK: 'fresh',
    LINKETRY_APPROVED_RELEASE: metadata.version,
    LINKETRY_APPROVED_COMMIT: metadata.commit,
    LINKETRY_APPROVED_MIGRATIONS_SHA256: metadata.migrationDigest,
    LINKETRY_FRESH_INSTALL_CONFIRMED: 'true',
  };
}

function validateReleaseMetadata(metadata) {
  const errors = [];
  if (!metadata.version) errors.push('Could not read the Linketry package version.');
  if (!SHA_PATTERN.test(metadata.commit)) errors.push('Could not read the current Git commit.');
  if (!metadata.clean) {
    errors.push(
      'The Git worktree must be clean so the approved commit contains every deployment file.'
    );
  }
  if (!DIGEST_PATTERN.test(metadata.migrationDigest)) {
    errors.push('Could not calculate the migration digest.');
  }
  return errors;
}

function resourcesFromBootstrap(report) {
  const d1 = report?.resources?.d1 ?? {};
  const kv = report?.resources?.kv ?? {};
  if (
    !report?.ok ||
    !report?.bindingOutputReady ||
    !RESOURCE_ID_PATTERN.test(readValue(d1.id)) ||
    !RESOURCE_ID_PATTERN.test(readValue(kv.id))
  ) {
    return null;
  }
  return {
    d1: { name: readValue(d1.name), id: readValue(d1.id) },
    kv: { name: readValue(kv.name), id: readValue(kv.id) },
  };
}

function baseReport(config, confirmation, errors = []) {
  return {
    ok: errors.length === 0,
    mode: config.apply ? 'apply' : 'dry-run',
    repository: config.repository || 'not configured',
    accountId: maskIdentifier(config.accountId),
    prefix: config.prefix || 'not configured',
    domain: config.domain || 'not configured',
    confirmation,
    variables: {},
    requiredSecrets: ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'],
    mutations: [],
    mutationAttempted: false,
    mutationPerformed: false,
    errors,
  };
}

export async function runGitHubConfiguration({
  options = {},
  env = process.env,
  ghRunner = runGitHub,
  bootstrap = runBootstrap,
  metadata = null,
} = {}) {
  const config = normalizeGitHubConfigurationOptions(options, env);
  const validation = validateGitHubConfigurationOptions(config);
  const report = baseReport(config, validation.confirmation, [...validation.errors]);
  if (report.errors.length > 0) return report;

  const bootstrapReport = await bootstrap({
    options: {
      prefix: config.prefix,
      domain: config.domain,
      accountId: config.accountId,
    },
    env,
  });
  const resources = resourcesFromBootstrap(bootstrapReport);
  if (!resources) {
    report.errors.push(
      'Required D1/KV resources are not ready. Run deploy:bootstrap --apply, then rerun this command.'
    );
    report.ok = false;
    return report;
  }

  const release = metadata ?? readReleaseMetadata();
  report.errors.push(...validateReleaseMetadata(release));
  if (report.errors.length > 0) {
    report.ok = false;
    return report;
  }
  report.variables = buildGitHubVariables({ config, resources, metadata: release });
  if (!config.apply) return report;

  const auth = ghRunner(['auth', 'status']);
  if (!successful(auth)) report.errors.push('GitHub CLI authentication failed. Run gh auth login.');

  let repository = null;
  try {
    repository = parseJsonResult(
      ghRunner(['repo', 'view', config.repository, '--json', 'nameWithOwner']),
      'GitHub repository check'
    );
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : String(error));
  }
  if (
    repository &&
    readValue(repository.nameWithOwner).toLowerCase() !== config.repository.toLowerCase()
  ) {
    report.errors.push('GitHub resolved a different repository than --repo.');
  }

  const remoteCommit = ghRunner(['api', `repos/${config.repository}/commits/main`, '--jq', '.sha']);
  if (!successful(remoteCommit)) {
    report.errors.push('Could not read the target repository main commit.');
  } else if (readValue(remoteCommit.stdout).toLowerCase() !== release.commit) {
    report.errors.push(
      'The reviewed local commit is not the target repository main commit. Push it to the fork before applying configuration.'
    );
  }

  let secretNames = [];
  try {
    const secrets = parseJsonResult(
      ghRunner(['secret', 'list', '--repo', config.repository, '--json', 'name']),
      'GitHub secret inventory'
    );
    if (!Array.isArray(secrets)) throw new Error('GitHub secret inventory was not an array.');
    secretNames = secrets.map((item) => readValue(item?.name));
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : String(error));
  }
  if (!secretNames.includes('CLOUDFLARE_API_TOKEN')) {
    report.errors.push(
      `CLOUDFLARE_API_TOKEN is missing. Run: gh secret set CLOUDFLARE_API_TOKEN --repo ${config.repository}`
    );
  }
  if (report.errors.length > 0) {
    report.ok = false;
    return report;
  }

  report.mutationAttempted = true;
  const accountSecret = ghRunner(
    ['secret', 'set', 'CLOUDFLARE_ACCOUNT_ID', '--repo', config.repository],
    { input: `${config.accountId}\n` }
  );
  if (!successful(accountSecret)) {
    report.errors.push('Could not set CLOUDFLARE_ACCOUNT_ID in GitHub Actions secrets.');
  } else {
    report.mutations.push('secret:CLOUDFLARE_ACCOUNT_ID');
  }

  for (const [name, value] of Object.entries(report.variables)) {
    if (report.errors.length > 0) break;
    const result = ghRunner([
      'variable',
      'set',
      name,
      '--body',
      value,
      '--repo',
      config.repository,
    ]);
    if (!successful(result)) {
      report.errors.push(`Could not set GitHub Actions variable ${name}.`);
      break;
    }
    report.mutations.push(`variable:${name}`);
  }

  if (report.errors.length === 0) {
    try {
      const variables = parseJsonResult(
        ghRunner(['variable', 'list', '--repo', config.repository, '--json', 'name,value']),
        'GitHub variable verification'
      );
      const values = new Map(
        Array.isArray(variables)
          ? variables.map((item) => [readValue(item?.name), readValue(item?.value)])
          : []
      );
      for (const [name, value] of Object.entries(report.variables)) {
        if (values.get(name) !== value)
          report.errors.push(`GitHub variable ${name} did not verify.`);
      }
    } catch (error) {
      report.errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  report.ok = report.errors.length === 0;
  report.mutationPerformed = report.mutations.length > 0;
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await runGitHubConfigurationCli({ runGitHubConfiguration });
}

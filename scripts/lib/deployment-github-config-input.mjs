const ACCOUNT_ID_PATTERN = /^[a-f0-9]{32}$/i;
const PREFIX_PATTERN = /^linketry-[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function readGitHubConfigValue(value) {
  return String(value ?? '').trim();
}

function normalizeHostname(value) {
  const candidate = readGitHubConfigValue(value).toLowerCase();
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

export function normalizeGitHubConfigurationOptions(options, env) {
  const prefix = readGitHubConfigValue(options.prefix || env.LINKETRY_BOOTSTRAP_PREFIX).toLowerCase();
  const accountId = readGitHubConfigValue(options.accountId || env.CLOUDFLARE_ACCOUNT_ID).toLowerCase();
  const domain = normalizeHostname(
    options.domain || env.LINKETRY_BOOTSTRAP_DOMAIN || env.LINKETRY_SHORT_DOMAIN
  );
  const repository = readGitHubConfigValue(options.repository || env.LINKETRY_GITHUB_REPOSITORY);
  return {
    prefix,
    accountId,
    domain,
    repository,
    apply: Boolean(options.apply),
    confirmation: readGitHubConfigValue(options.confirmation),
  };
}

export function expectedGitHubConfirmation({ repository, accountId, prefix }) {
  const suffix = accountId.length >= 6 ? accountId.slice(-6).toLowerCase() : 'unknown';
  return `github:${repository.toLowerCase()}:${suffix}:${prefix || 'missing-prefix'}`;
}

export function validateGitHubConfigurationOptions(config) {
  const errors = [];
  if (!REPOSITORY_PATTERN.test(config.repository) || config.repository.includes('..')) {
    errors.push('Use --repo with one GitHub owner/repository value.');
  }
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
  const confirmation = expectedGitHubConfirmation(config);
  if (config.apply && config.confirmation !== confirmation) {
    errors.push(`Apply mode requires the exact confirmation phrase: ${confirmation}`);
  }
  return { errors, confirmation };
}

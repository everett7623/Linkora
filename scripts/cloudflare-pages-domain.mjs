import { pathToFileURL } from 'node:url';

const ACCOUNT_ID_PATTERN = /^[a-f0-9]{32}$/i;
const PROJECT_NAME_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;
const HOSTNAME_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

function validateInput({ accountId, projectName, domain, apiToken }) {
  if (!ACCOUNT_ID_PATTERN.test(accountId)) throw new Error('Invalid Cloudflare account ID.');
  if (!PROJECT_NAME_PATTERN.test(projectName)) throw new Error('Invalid Pages project name.');
  if (!HOSTNAME_PATTERN.test(domain)) throw new Error('Invalid Pages custom domain.');
  if (!apiToken) throw new Error('Cloudflare API token is required.');
}

async function readPayload(response) {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function apiError(action, response, payload) {
  const message = Array.isArray(payload?.errors)
    ? payload.errors
        .map((error) => error?.message)
        .filter(Boolean)
        .join('; ')
    : '';
  return new Error(
    `Cloudflare Pages ${action} failed with HTTP ${response.status}${message ? `: ${message}` : '.'}`
  );
}

export async function ensurePagesDomain({
  accountId,
  projectName,
  domain,
  apiToken,
  fetchImpl = fetch,
}) {
  const normalizedAccountId = String(accountId ?? '')
    .trim()
    .toLowerCase();
  const normalizedDomain = String(domain ?? '')
    .trim()
    .toLowerCase();
  const normalizedProject = String(projectName ?? '')
    .trim()
    .toLowerCase();
  const normalizedToken = String(apiToken ?? '').trim();
  validateInput({
    accountId: normalizedAccountId,
    projectName: normalizedProject,
    domain: normalizedDomain,
    apiToken: normalizedToken,
  });

  const base = `https://api.cloudflare.com/client/v4/accounts/${normalizedAccountId}/pages/projects/${encodeURIComponent(normalizedProject)}/domains`;
  const headers = { Authorization: `Bearer ${normalizedToken}` };
  const existingResponse = await fetchImpl(`${base}/${encodeURIComponent(normalizedDomain)}`, {
    headers,
  });

  if (existingResponse.ok) {
    const payload = await readPayload(existingResponse);
    if (payload?.success !== true || payload?.result?.name !== normalizedDomain) {
      throw new Error('Cloudflare Pages returned an invalid custom-domain response.');
    }
    return { created: false, domain: normalizedDomain, status: payload.result.status };
  }
  if (existingResponse.status !== 404) {
    throw apiError('domain lookup', existingResponse, await readPayload(existingResponse));
  }

  const createResponse = await fetchImpl(base, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: normalizedDomain }),
  });
  const payload = await readPayload(createResponse);
  if (
    !createResponse.ok ||
    payload?.success !== true ||
    payload?.result?.name !== normalizedDomain
  ) {
    throw apiError('domain creation', createResponse, payload);
  }
  return { created: true, domain: normalizedDomain, status: payload.result.status };
}

function parseArgs(argv) {
  const options = { accountId: '', projectName: '', domain: '' };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--account-id') options.accountId = argv[++index] ?? '';
    else if (argument === '--project') options.projectName = argv[++index] ?? '';
    else if (argument === '--domain') options.domain = argv[++index] ?? '';
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
}

async function main() {
  const result = await ensurePagesDomain({
    ...parseArgs(process.argv.slice(2)),
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
  });
  console.log(
    `${result.domain} is ${result.status || 'registered'} on the Demo API Pages project (${result.created ? 'created' : 'already present'}).`
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

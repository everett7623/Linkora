import { pathToFileURL } from 'node:url';

function normalizeOrigin(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('Admin URL must be an HTTPS origin without credentials.');
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Admin URL must not contain a path, query, or fragment.');
  }
  return url.origin;
}

function readAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2] ?? '';
}

export function collectInitialAssets(html) {
  const assets = [];
  for (const tag of html.match(/<(?:script|link)\b[^>]*>/gi) ?? []) {
    if (tag.startsWith('<script')) {
      const source = readAttribute(tag, 'src');
      if (readAttribute(tag, 'type') === 'module' && source.startsWith('/assets/')) {
        assets.push({ path: source, kind: 'script' });
      }
      continue;
    }

    const source = readAttribute(tag, 'href');
    if (readAttribute(tag, 'rel') === 'stylesheet' && source.startsWith('/assets/')) {
      assets.push({ path: source, kind: 'style' });
    }
  }
  return assets;
}

async function fetchRequired(fetchImpl, url) {
  const response = await fetchImpl(url, {
    redirect: 'follow',
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}.`);
  return response;
}

function expectedContentType(kind) {
  return kind === 'script' ? /^(?:application|text)\/javascript\b/i : /^text\/css\b/i;
}

export async function verifyAdminLive({ adminUrl, version, fetchImpl = fetch }) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Version must use semantic versioning.');
  const adminOrigin = normalizeOrigin(adminUrl);
  const htmlResponse = await fetchRequired(
    fetchImpl,
    `${adminOrigin}/?linketry-admin-ready=${encodeURIComponent(version)}`
  );
  const html = await htmlResponse.text();
  const versionPattern = new RegExp(
    `<meta\\s+name=["']linketry-version["']\\s+content=["']${version.replaceAll('.', '\\.')}["']`
  );
  if (!versionPattern.test(html)) {
    throw new Error(`Admin does not advertise Linketry ${version}.`);
  }

  const assets = collectInitialAssets(html);
  if (!assets.some((asset) => asset.kind === 'script')) {
    throw new Error('Admin HTML does not reference an initial module script.');
  }
  if (!assets.some((asset) => asset.kind === 'style')) {
    throw new Error('Admin HTML does not reference an initial stylesheet.');
  }

  await Promise.all(
    assets.map(async (asset) => {
      const response = await fetchRequired(fetchImpl, new URL(asset.path, adminOrigin).href);
      const contentType = response.headers.get('content-type') ?? '';
      if (!expectedContentType(asset.kind).test(contentType)) {
        throw new Error(
          `Admin asset ${asset.path} returned ${contentType || 'no Content-Type'} instead of ${asset.kind}.`
        );
      }
    })
  );

  return { adminOrigin, version, assets: assets.map((asset) => asset.path) };
}

export async function waitForAdminLive(options, attempts = 30, delayMs = 10_000) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await verifyAdminLive(options);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        console.warn(
          `Admin readiness attempt ${attempt}/${attempts} is not ready: ${error instanceof Error ? error.message : String(error)}`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

function parseArgs(argv) {
  const result = { adminUrl: '', version: '' };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--admin-url') result.adminUrl = argv[++index] ?? '';
    else if (argument === '--version') result.version = argv[++index] ?? '';
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!result.adminUrl || !result.version) {
    throw new Error('Usage: admin-live-smoke --admin-url <url> --version <semver>');
  }
  return result;
}

async function main() {
  const report = await waitForAdminLive(parseArgs(process.argv.slice(2)));
  console.log(
    `Admin readiness verified: ${report.adminOrigin} serves Linketry ${report.version} with ${report.assets.length} initial assets.`
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

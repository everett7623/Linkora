import { normalizeVersion } from '../utils/versionCheck.ts';

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type AssetKind = 'script' | 'style';

interface InitialAsset {
  kind: AssetKind;
  url: string;
}

const ASSET_CONTENT_TYPES: Record<AssetKind, RegExp> = {
  script: /^(?:application|text)\/(?:java|ecma)script\b/i,
  style: /^text\/css\b/i,
};
const ADMIN_RELEASE_CHECK_TIMEOUT_MS = 8_000;

export async function isAdminReleaseReady(
  targetVersion: string,
  fetcher: Fetcher = globalThis.fetch,
  adminOrigin = window.location.origin,
  timeoutMs = ADMIN_RELEASE_CHECK_TIMEOUT_MS
): Promise<boolean> {
  const normalizedTarget = normalizeVersion(targetVersion);
  if (!normalizedTarget) return false;

  const origin = new URL(adminOrigin).origin;
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const documentResponse = await fetcher(
      `${origin}/?linketry-admin-ready=${encodeURIComponent(normalizedTarget)}&t=${Date.now()}`,
      noCacheRequest(controller.signal)
    );
    if (!documentResponse.ok) return false;

    const document = new DOMParser().parseFromString(await documentResponse.text(), 'text/html');
    const advertisedVersion = normalizeVersion(
      document.querySelector<HTMLMetaElement>('meta[name="linketry-version"]')?.content ?? ''
    );
    if (advertisedVersion !== normalizedTarget) return false;

    const assets = collectInitialAssets(document, origin);
    if (!assets.some((asset) => asset.kind === 'script')) return false;
    if (!assets.some((asset) => asset.kind === 'style')) return false;

    const results = await Promise.all(
      assets.map(async (asset) => {
        const response = await fetcher(asset.url, noCacheRequest(controller.signal));
        const contentType = response.headers.get('content-type') ?? '';
        return response.ok && ASSET_CONTENT_TYPES[asset.kind].test(contentType);
      })
    );
    return results.every(Boolean);
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

function collectInitialAssets(document: Document, origin: string): InitialAsset[] {
  const assets: InitialAsset[] = [];
  for (const element of document.querySelectorAll(
    'script[type="module"][src], link[rel~="stylesheet"][href]'
  )) {
    const kind: AssetKind = element.tagName === 'SCRIPT' ? 'script' : 'style';
    const value = element.getAttribute(kind === 'script' ? 'src' : 'href');
    if (!value) continue;
    const url = new URL(value, origin);
    if (url.origin === origin && url.pathname.startsWith('/assets/')) {
      assets.push({ kind, url: url.href });
    }
  }
  return assets;
}

function noCacheRequest(signal: AbortSignal): RequestInit {
  return {
    cache: 'no-store',
    credentials: 'same-origin',
    headers: { 'Cache-Control': 'no-cache' },
    redirect: 'follow',
    signal,
  };
}

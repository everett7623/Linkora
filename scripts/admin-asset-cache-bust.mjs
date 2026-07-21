import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const assetPattern = /(\/assets\/[^"'?]+\.(?:js|css))(?:\?[^"']*)?(?=["'])/g;

export function appendAssetCacheKey(html, version) {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error('Version must use semantic versioning.');
  }
  return html.replace(assetPattern, `$1?v=${encodeURIComponent(version)}`);
}

export async function cacheBustAdminIndex({ indexPath, version }) {
  const html = await readFile(indexPath, 'utf8');
  const updated = appendAssetCacheKey(html, version);
  if (!updated.includes(`?v=${encodeURIComponent(version)}`)) {
    throw new Error(`Admin index does not contain an initial Vite asset: ${indexPath}`);
  }
  await writeFile(indexPath, updated);
  return updated;
}

async function main() {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const indexPath = new URL('../apps/admin/dist/index.html', import.meta.url);
  await cacheBustAdminIndex({ indexPath, version: packageJson.version });
  console.log(`Admin asset cache key applied for Linketry ${packageJson.version}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

import { access, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { canonicalViteAssetPath, collectInitialAssets } from './admin-live-smoke.mjs';

export async function verifyAdminBuild(indexPath) {
  const indexUrl = indexPath instanceof URL ? indexPath : pathToFileURL(indexPath);
  const html = await readFile(indexUrl, 'utf8');
  const assets = collectInitialAssets(html);
  if (!assets.some((asset) => asset.kind === 'script')) {
    throw new Error('Admin build does not reference an initial module script.');
  }
  if (!assets.some((asset) => asset.kind === 'style')) {
    throw new Error('Admin build does not reference an initial stylesheet.');
  }

  await Promise.all(
    assets.map(async (asset) => {
      const pathname = canonicalViteAssetPath(asset.path);
      await access(new URL(`.${pathname}`, indexUrl));
    })
  );
  return assets.map((asset) => asset.path);
}

async function main() {
  const indexPath = new URL('../apps/admin/dist/index.html', import.meta.url);
  const assets = await verifyAdminBuild(indexPath);
  console.log(`Admin build integrity verified with ${assets.length} canonical initial assets.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

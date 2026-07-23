import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { verifyAdminBuild } from './admin-asset-integrity.mjs';

async function fixture(html) {
  const directory = await mkdtemp(join(tmpdir(), 'linketry-admin-assets-'));
  await mkdir(join(directory, 'assets'));
  await writeFile(join(directory, 'index.html'), html);
  await writeFile(join(directory, 'assets', 'index-AbCd1234.js'), 'export {};');
  await writeFile(join(directory, 'assets', 'index-EfGh5678.css'), 'body {}');
  return join(directory, 'index.html');
}

test('accepts canonical Vite entry assets that exist in the build', async () => {
  const indexPath = await fixture(`
    <script type="module" src="/assets/index-AbCd1234.js"></script>
    <link rel="stylesheet" href="/assets/index-EfGh5678.css">
  `);
  assert.deepEqual(await verifyAdminBuild(indexPath), [
    '/assets/index-AbCd1234.js',
    '/assets/index-EfGh5678.css',
  ]);
});

test('rejects query cache keys that create a second ES module identity', async () => {
  const indexPath = await fixture(`
    <script type="module" src="/assets/index-AbCd1234.js?v=0.29.10"></script>
    <link rel="stylesheet" href="/assets/index-EfGh5678.css">
  `);
  await assert.rejects(verifyAdminBuild(indexPath), /canonical Vite content-hashed path/);
});

test('rejects missing initial build assets', async () => {
  const indexPath = await fixture(
    '<script type="module" src="/assets/missing-AbCd1234.js"></script>'
  );
  await assert.rejects(verifyAdminBuild(indexPath), /initial stylesheet/);
});

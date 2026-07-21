import assert from 'node:assert/strict';
import test from 'node:test';
import { appendAssetCacheKey } from './admin-asset-cache-bust.mjs';

test('versions initial JavaScript and CSS asset URLs without touching unrelated URLs', () => {
  const html = `
    <script type="module" src="/assets/index-abc.js"></script>
    <link rel="stylesheet" href="/assets/index-def.css">
    <link rel="preload" href="/fonts/inter.woff2">
  `;

  assert.match(appendAssetCacheKey(html, '0.29.2'), /\/assets\/index-abc\.js\?v=0\.29\.2/);
  assert.match(appendAssetCacheKey(html, '0.29.2'), /\/assets\/index-def\.css\?v=0\.29\.2/);
  assert.doesNotMatch(appendAssetCacheKey(html, '0.29.2'), /inter\.woff2\?v=/);
});

test('replaces an existing asset query instead of stacking cache keys', () => {
  const html = '<script type="module" src="/assets/index-abc.js?old=1"></script>';
  assert.equal(
    appendAssetCacheKey(html, '0.29.2'),
    '<script type="module" src="/assets/index-abc.js?v=0.29.2"></script>'
  );
});

test('rejects non-semver release values', () => {
  assert.throws(() => appendAssetCacheKey('/assets/index.js', 'latest'), /semantic versioning/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');

test('project site publishes the complete public-launch content contract', () => {
  for (const content of [
    'Own every link.',
    'A complete link stack',
    'Preview of the Linketry Admin overview',
    'Built for the edge',
    'From clone to first link',
    'Docs for operators and builders',
    'Road to 1.0',
    'GPL-3.0',
  ]) {
    assert.match(page, new RegExp(content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('project site uses canonical Linketry identity and public links', () => {
  assert.match(page, /<link rel="canonical" href="https:\/\/linketry\.com\/"/);
  assert.match(page, /https:\/\/linketry\.com\/favicon\.svg/);
  assert.match(page, /\/favicon-light\.svg/);
  assert.match(page, /https:\/\/github\.com\/everett7623\/Linketry/);
  assert.match(page, /https:\/\/demo\.linketry\.com/);
  assert.match(page, /https:\/\/everettlabs\.dev\/coffee\//);
  assert.match(page, /No token required/);
  assert.match(page, /docs\/SELF_HOSTING\.md/);
  assert.match(page, /docs\/ROADMAP\.md/);
  assert.doesNotMatch(page, /Linkora/i);
});

test('external coffee links do not retain opener access', () => {
  assert.match(
    page,
    /href="https:\/\/everettlabs\.dev\/coffee\/" target="_blank" rel="noopener noreferrer"/
  );
});

test('project site includes accessible navigation and hardened static headers', () => {
  assert.match(page, /class="skip-link"/);
  assert.match(page, /aria-controls="site-navigation"/);
  assert.match(page, /aria-label="Linketry redirect architecture"/);
  assert.match(headers, /Content-Security-Policy:/);
  assert.match(headers, /frame-ancestors 'none'/);
});

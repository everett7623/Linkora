import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const deployPage = await readFile(new URL('../deploy/index.html', import.meta.url), 'utf8');
const headers = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../public/sitemap.xml', import.meta.url), 'utf8');
const script = await readFile(new URL('../src/main.ts', import.meta.url), 'utf8');
const localeScript = await readFile(new URL('../src/siteI18n.ts', import.meta.url), 'utf8');
const messages = await readFile(new URL('../src/siteMessages.ts', import.meta.url), 'utf8');
const visualMessages = await readFile(new URL('../src/siteVisualMessages.ts', import.meta.url), 'utf8');
const viteConfig = await readFile(new URL('../vite.config.ts', import.meta.url), 'utf8');

test('project site publishes the complete public-launch content contract', () => {
  for (const content of [
    'Own every link.',
    'A complete link stack',
    'Preview of the Linketry Admin overview',
    'Built for the edge',
    'A deployment path that stays understandable',
    'Docs for operators and builders',
    'Road to 1.0',
    'GPL-3.0',
  ]) {
    assert.match(page, new RegExp(content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('project site exposes a dedicated deployment route from primary actions', () => {
  assert.match(page, /href="\/deploy\/"/);
  assert.doesNotMatch(page, /id="deploy"/);
  assert.match(viteConfig, /deploy:\s*new URL\('\.\/deploy\/index\.html'/);
  assert.match(sitemap, /https:\/\/linketry\.com\/deploy\//);
});

test('deployment page presents a Cloudflare launch and guarded repository workflow', () => {
  for (const content of [
    'A · Cloudflare Quick Deploy',
    'Start from the Cloudflare dashboard',
    'B · Reviewed repository workflow',
    'Provision exactly what you approve',
    'A secure first install cannot be configuration-free',
    'docs/SELF_HOSTING.md',
    'UPGRADING_PRE_0_10.md',
  ]) {
    assert.match(deployPage, new RegExp(content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(deployPage, /https:\/\/deploy\.workers\.cloudflare\.com\/\?url=https:\/\/github\.com\/everett7623\/Linketry/);
  assert.match(deployPage, /data-copy-deploy-prompt="ai-deploy-prompt"/);
  assert.match(deployPage, /id="deploy-copy-status"[^>]*aria-live="polite"/);
  assert.match(script, /navigator\.clipboard\.writeText\(promptText\)/);
  assert.doesNotMatch(deployPage, /100% free|free forever|zero configuration/i);
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

test('primary navigation presents GitHub with a recognizable mark and label', () => {
  assert.match(page, /class="nav-source"[^>]*aria-label="GitHub repository"[^>]*title="GitHub repository"/);
  assert.match(page, /class="nav-source"[\s\S]*?<svg[\s\S]*?fill="currentColor"/);
  assert.match(page, /class="nav-source"[\s\S]*?<span data-i18n="nav\.github">GitHub<\/span>/);
});

test('site localization defaults to English and registers complete English and Simplified Chinese catalogs', () => {
  assert.match(messages, /DEFAULT_SITE_LOCALE: SiteLocale = 'en'/);
  assert.match(messages, /code: 'zh-CN', label: '简体中文'/);
  assert.match(localeScript, /SITE_LOCALE_STORAGE_KEY/);
  assert.match(localeScript, /new URLSearchParams\(window\.location\.search\)\.get\('lang'\)/);
  assert.match(localeScript, /window\.localStorage\.getItem/);
  assert.match(localeScript, /data-site-locale/);
  assert.match(page, /data-site-locale/);
  assert.match(deployPage, /data-site-locale/);

  const localizedKeys = [...`${page}\n${deployPage}`.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map(
    ([, key]) => key
  );
  for (const key of localizedKeys) {
    assert.match(
      `${messages}\n${visualMessages}`,
      new RegExp(`['"]${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`)
    );
  }
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

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  renderDisabledPage,
  renderExpiredPage,
  renderNotFoundPage,
  renderPasswordPage,
  renderWarningPage,
  resolvePublicLocale,
} from './publicPages.ts';
import { redirectResponse } from './redirectResponse.ts';

test('public pages default to English and honor language quality', () => {
  assert.equal(resolvePublicLocale(), 'en');
  assert.equal(resolvePublicLocale('en-US,en;q=0.9,zh-CN;q=0.8'), 'en');
  assert.equal(resolvePublicLocale('zh-CN,zh;q=0.9,en;q=0.5'), 'zh-CN');
  assert.equal(resolvePublicLocale('fr,zh;q=0.7,en;q=0.8'), 'en');
});

test('public pages render localized copy and escape user-controlled values', () => {
  assert.match(renderNotFoundPage('en'), /Link Not Found/);
  assert.match(renderNotFoundPage('zh-CN'), /未找到短链/);
  assert.match(renderDisabledPage('zh-CN'), /短链已停用/);
  assert.match(renderExpiredPage('zh-CN'), /短链已过期/);
  assert.match(renderDisabledPage('en'), /<html lang="en">/);
  assert.match(renderExpiredPage('zh-CN'), /<html lang="zh-CN">/);
  assert.match(renderPasswordPage('zh-CN', '<script>', true), /密码不正确/);
  assert.doesNotMatch(renderPasswordPage('en', '<script>', false), /<script>/);
  assert.match(
    renderWarningPage('zh-CN', 'go', 'https://example.com/?x=<tag>', false),
    /&lt;tag&gt;/
  );
});

test('normal redirect responses preserve status and Location without a body', async () => {
  for (const status of [301, 302]) {
    const response = redirectResponse('https://example.com/path', status);
    assert.equal(response.status, status);
    assert.equal(response.headers.get('Location'), 'https://example.com/path');
    assert.equal(await response.text(), '');
  }
});

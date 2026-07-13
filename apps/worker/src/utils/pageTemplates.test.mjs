import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePublicPageTemplate } from './pageTemplatePolicy.ts';

test('public page templates allow known variables and reject unsafe shape', () => {
  assert.equal(validatePublicPageTemplate('Link {{slug}} points to {{url}}'), undefined);
  assert.match(validatePublicPageTemplate('{{unknown}}'), /Unsupported/);
  assert.match(validatePublicPageTemplate('x'.repeat(501)), /500/);
});

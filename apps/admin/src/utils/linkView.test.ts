import assert from 'node:assert/strict';
import test from 'node:test';
import type { StorageLike } from './browserStorage.ts';
import { normalizeLinkView, readLinkViewPreference, writeLinkViewPreference } from './linkView.ts';

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test('Links view defaults to table and accepts only the cards preference', () => {
  assert.equal(normalizeLinkView(null), 'table');
  assert.equal(normalizeLinkView('grid'), 'table');
  assert.equal(normalizeLinkView('cards'), 'cards');
});

test('Links view preference round-trips through the canonical browser setting', () => {
  const storage = memoryStorage();
  writeLinkViewPreference('cards', storage);
  assert.equal(readLinkViewPreference(storage), 'cards');
});

test('Links view falls back safely when browser storage is unavailable', () => {
  const storage: StorageLike = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
    removeItem: () => undefined,
  };

  assert.equal(readLinkViewPreference(storage), 'table');
  assert.doesNotThrow(() => writeLinkViewPreference('cards', storage));
});

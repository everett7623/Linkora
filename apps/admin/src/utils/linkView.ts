import { readBrowserSetting, writeBrowserSetting, type StorageLike } from './browserStorage.ts';

export type LinkView = 'table' | 'cards';

export function normalizeLinkView(value: string | null | undefined): LinkView {
  return value === 'cards' ? 'cards' : 'table';
}

export function readLinkViewPreference(storage?: StorageLike): LinkView {
  try {
    return normalizeLinkView(readBrowserSetting('linkView', storage));
  } catch {
    return 'table';
  }
}

export function writeLinkViewPreference(view: LinkView, storage?: StorageLike): void {
  try {
    writeBrowserSetting('linkView', view, storage);
  } catch {
    // The in-memory view still changes when browser storage is unavailable.
  }
}

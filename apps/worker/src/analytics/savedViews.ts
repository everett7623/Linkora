import type { Env } from '../types';
import { getSettings, setSetting } from '../db/index';
import { generateId, now } from '../utils/id';
import { isSavedView, normalizeSavedViewFilters } from './savedViewPolicy';

const SETTING_KEY = 'analytics_saved_views';

export interface SavedAnalyticsView {
  id: string;
  name: string;
  filters: Record<string, string | number>;
  created_at: string;
}

export function parseSavedAnalyticsViews(value?: string): SavedAnalyticsView[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isSavedView).slice(0, 20) : [];
  } catch { return []; }
}

export async function listSavedAnalyticsViews(env: Env): Promise<SavedAnalyticsView[]> {
  return parseSavedAnalyticsViews((await getSettings(env))[SETTING_KEY]);
}

export async function createSavedAnalyticsView(env: Env, name: string, filters: unknown): Promise<SavedAnalyticsView> {
  const views = await listSavedAnalyticsViews(env);
  if (views.length >= 20) throw new Error('A maximum of 20 saved views is allowed');
  const cleanName = name.trim();
  if (!cleanName || cleanName.length > 50) throw new Error('View name must be between 1 and 50 characters');
  const view = { id: generateId(), name: cleanName, filters: normalizeSavedViewFilters(filters), created_at: now() };
  await setSetting(env, SETTING_KEY, JSON.stringify([...views, view]), view.created_at);
  return view;
}

export async function deleteSavedAnalyticsView(env: Env, id: string): Promise<boolean> {
  const views = await listSavedAnalyticsViews(env);
  const next = views.filter((view) => view.id !== id);
  if (next.length === views.length) return false;
  await setSetting(env, SETTING_KEY, JSON.stringify(next), now());
  return true;
}


import type { Env } from '../types';
import { getSettings } from '../db/index';

export type PublicPageKind = '404' | 'disabled' | 'expired' | 'warning';

export async function getPublicPageMessage(
  env: Env,
  kind: PublicPageKind,
  values: { slug?: string; url?: string } = {}
): Promise<string | undefined> {
  try {
    const settings = await getSettings(env);
    const template = settings[`public_page_${kind}_message`]?.trim();
    if (!template) return undefined;
    return template
      .replace(/\{\{slug\}\}/g, values.slug ?? '')
      .replace(/\{\{url\}\}/g, values.url ?? '');
  } catch {
    return undefined;
  }
}

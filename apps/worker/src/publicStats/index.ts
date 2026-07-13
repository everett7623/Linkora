import type { Env } from '../types';
import { getSettings, setSetting } from '../db/index';
import { generateSlug, now, sha256 } from '../utils/id';
import { isPublicStatsShare, normalizePublicStatsDays } from './policy';

const SETTING_KEY = 'public_stats_shares';

export interface PublicStatsShare {
  link_id: string;
  token_hash: string;
  days: number;
  show_countries: boolean;
  show_referrers: boolean;
  created_at: string;
}

export function parsePublicStatsShares(value?: string): PublicStatsShare[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isPublicStatsShare) : [];
  } catch {
    return [];
  }
}

export async function listPublicStatsShares(env: Env): Promise<PublicStatsShare[]> {
  const settings = await getSettings(env);
  return parsePublicStatsShares(settings[SETTING_KEY]);
}

export async function createPublicStatsShare(
  env: Env,
  linkId: string,
  options: { days: number; show_countries: boolean; show_referrers: boolean }
): Promise<{ share: PublicStatsShare; token: string }> {
  const token = generateSlug(32);
  const createdAt = now();
  const share: PublicStatsShare = {
    link_id: linkId,
    token_hash: await sha256(token),
    days: normalizePublicStatsDays(options.days),
    show_countries: options.show_countries,
    show_referrers: options.show_referrers,
    created_at: createdAt,
  };
  const shares = (await listPublicStatsShares(env)).filter((item) => item.link_id !== linkId);
  await setSetting(env, SETTING_KEY, JSON.stringify([...shares, share]), createdAt);
  return { share, token };
}

export async function deletePublicStatsShare(env: Env, linkId: string): Promise<void> {
  const shares = (await listPublicStatsShares(env)).filter((item) => item.link_id !== linkId);
  await setSetting(env, SETTING_KEY, JSON.stringify(shares), now());
}

export async function findPublicStatsShare(env: Env, token: string): Promise<PublicStatsShare | null> {
  const hash = await sha256(token);
  return (await listPublicStatsShares(env)).find((item) => item.token_hash === hash) ?? null;
}


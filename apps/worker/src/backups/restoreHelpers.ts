import type { Link, NormalizedImportItem, RedirectRule } from '@linkora/shared';
import type { Env } from '../types';
import { deleteCachedLink, setCachedLink } from '../cache/index';
import { createRedirectRule, deleteRedirectRulesForLink } from '../db/index';
import { generateId } from '../utils/id';

export function backupLinkIdFromItem(item: NormalizedImportItem): string | undefined {
  if (typeof item.raw === 'object' && item.raw !== null && !Array.isArray(item.raw)) {
    const rawId = (item.raw as { id?: unknown }).id;
    if (typeof rawId === 'string' && rawId.trim()) return rawId.trim();
  }
  return item.sourceId;
}

export function linkFromBackupItem(item: NormalizedImportItem, id: string, slug: string, domain: string, ts: string): Link {
  const createdAt = item.createdAt ?? ts;
  const updatedAt = item.updatedAt ?? createdAt;
  const restoredDomain = backupDomainFromItem(item) ?? domain;
  return {
    id,
    slug,
    domain: restoredDomain,
    long_url: item.longUrl,
    short_url: item.shortUrl ?? `https://${restoredDomain}/${slug}`,
    title: item.title ?? null,
    description: item.description ?? null,
    tags: itemTags(item).length > 0 ? JSON.stringify(itemTags(item)) : null,
    status: item.status ?? 'active',
    redirect_type: item.redirectType ?? 302,
    clicks: item.clicks ?? 0,
    source: item.source ?? 'linkora-backup',
    source_id: item.sourceId ?? null,
    created_at: createdAt,
    updated_at: updatedAt,
    last_clicked_at: item.lastClickedAt ?? null,
    expires_at: item.expiresAt ?? null,
    max_clicks: item.maxClicks ?? null,
    password_hash: item.passwordHash ?? null,
    warning_enabled: item.warningEnabled ? 1 : 0,
    fallback_url: item.fallbackUrl ?? null,
    archived: item.archived ?? 0,
  };
}

export function overwriteFieldsFromBackupItem(item: NormalizedImportItem, existing: Link, ts: string): Partial<Link> {
  return {
    domain: backupDomainFromItem(item) ?? existing.domain,
    long_url: item.longUrl,
    short_url: item.shortUrl ?? existing.short_url,
    title: item.title ?? null,
    description: item.description ?? null,
    tags: itemTags(item).length > 0 ? JSON.stringify(itemTags(item)) : null,
    status: item.status ?? existing.status,
    redirect_type: item.redirectType ?? existing.redirect_type,
    clicks: item.clicks ?? existing.clicks,
    source: item.source ?? existing.source,
    source_id: item.sourceId ?? existing.source_id,
    updated_at: item.updatedAt ?? ts,
    last_clicked_at: item.lastClickedAt ?? existing.last_clicked_at,
    expires_at: item.expiresAt ?? existing.expires_at,
    max_clicks: item.maxClicks ?? existing.max_clicks,
    password_hash: item.passwordHash ?? existing.password_hash,
    warning_enabled: item.warningEnabled === undefined ? existing.warning_enabled : item.warningEnabled ? 1 : 0,
    fallback_url: item.fallbackUrl ?? existing.fallback_url,
    archived: item.archived ?? existing.archived,
  };
}

export async function restoreBackupRedirectRules(
  env: Env,
  rules: RedirectRule[],
  linkIdByBackupId: Map<string, string>,
  replaceRuleLinkIds: Set<string>,
  ts: string
): Promise<number> {
  if (rules.length === 0 || linkIdByBackupId.size === 0) return 0;
  for (const linkId of replaceRuleLinkIds) await deleteRedirectRulesForLink(env, linkId);

  let restored = 0;
  for (const rule of rules) {
    const linkId = linkIdByBackupId.get(rule.link_id);
    if (!linkId) continue;
    await createRedirectRule(env, {
      ...rule,
      id: generateId(),
      link_id: linkId,
      created_at: rule.created_at || ts,
      updated_at: rule.updated_at || ts,
    });
    restored++;
  }
  return restored;
}

export async function deleteRestoredCache(env: Env, requestDomain: string, link: Link): Promise<void> {
  await deleteCachedLink(env, link.domain?.trim() || requestDomain, link.slug);
}

export async function syncRestoredCache(env: Env, requestDomain: string, link: Link): Promise<void> {
  const domain = link.domain?.trim() || requestDomain;
  const isExpired = !!link.expires_at && Date.parse(link.expires_at) < Date.now();
  const reachedMaxClicks = link.max_clicks !== null && link.max_clicks !== undefined && link.clicks >= link.max_clicks;
  if (link.status === 'active' && link.archived === 0 && !link.password_hash && !isExpired && !reachedMaxClicks) {
    await setCachedLink(env, domain, {
      id: link.id,
      slug: link.slug,
      domain: link.domain ?? undefined,
      longUrl: link.long_url,
      redirectType: link.redirect_type,
      status: link.status,
      expiresAt: link.expires_at ?? undefined,
      maxClicks: link.max_clicks ?? undefined,
      warningEnabled: link.warning_enabled === 1,
    });
  } else {
    await deleteCachedLink(env, domain, link.slug);
  }
}

export function csvRow(slug: string, action: string, status: string, reason: string): string {
  return [slug, action, status, reason].map(csv).join(',');
}

function itemTags(item: NormalizedImportItem): string[] {
  return [...new Set((item.tags ?? []).map((tag) => String(tag).trim()).filter(Boolean))];
}

function backupDomainFromItem(item: NormalizedImportItem): string | undefined {
  if (typeof item.raw !== 'object' || item.raw === null || Array.isArray(item.raw)) return undefined;
  const domain = (item.raw as { domain?: unknown }).domain;
  if (typeof domain !== 'string') return undefined;
  const normalized = domain.trim().toLowerCase();
  return normalized || undefined;
}

function csv(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

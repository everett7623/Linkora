import type { Link } from '@linkora/shared';

export function normalizeShortDomain(domain?: string | null): string {
  return (domain ?? '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/g, '');
}

export function buildShortUrl(link: Pick<Link, 'slug' | 'short_url'>, defaultDomain?: string | null): string {
  const domain = normalizeShortDomain(defaultDomain);
  if (domain) return `https://${domain}/${link.slug}`;
  return link.short_url ?? `/${link.slug}`;
}

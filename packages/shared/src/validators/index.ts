const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'health',
  'login',
  'settings',
  'assets',
  'static',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
]);

const SLUG_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug || slug.trim().length === 0) {
    return { valid: false, error: 'Slug cannot be empty' };
  }
  if (!SLUG_PATTERN.test(slug)) {
    return { valid: false, error: 'Slug can only contain letters, numbers, hyphens, and underscores' };
  }
  if (RESERVED_SLUGS.has(slug.toLowerCase())) {
    return { valid: false, error: `"${slug}" is a reserved path and cannot be used as a slug` };
  }
  if (slug.length > 100) {
    return { valid: false, error: 'Slug cannot exceed 100 characters' };
  }
  return { valid: true };
}

export function validateLongUrl(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim().length === 0) {
    return { valid: false, error: 'URL cannot be empty' };
  }
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:')) {
    return { valid: false, error: 'javascript: URLs are not allowed' };
  }
  if (trimmed.startsWith('data:')) {
    return { valid: false, error: 'data: URLs are not allowed' };
  }
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { valid: false, error: 'URL must start with http:// or https://' };
  }
  try {
    new URL(url);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
  return { valid: true };
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

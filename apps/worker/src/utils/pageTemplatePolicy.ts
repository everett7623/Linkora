export function validatePublicPageTemplate(value: string): string | undefined {
  if (value.length > 500) return 'Public page messages cannot exceed 500 characters';
  const unknown = [...value.matchAll(/\{\{([^}]+)\}\}/g)]
    .map((match) => match[1])
    .find((name) => name !== 'slug' && name !== 'url');
  return unknown ? `Unsupported public page variable: {{${unknown}}}` : undefined;
}


export function normalizeFallbackUrl(value: unknown): { value: string | null; error?: string } {
  if (value === undefined || value === null || value === '') return { value: null };
  if (typeof value !== 'string') {
    return { value: null, error: 'fallback_url must be a string' };
  }

  const url = value.trim();
  if (!url) return { value: null };

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { value: null, error: 'fallback_url must use http or https' };
    }
    return { value: parsed.toString() };
  } catch {
    return { value: null, error: 'fallback_url must be a valid URL' };
  }
}

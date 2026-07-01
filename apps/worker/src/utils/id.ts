/**
 * Generate a unique ID using crypto.randomUUID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a random short slug (6 chars, alphanumeric)
 */
export function generateSlug(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}

/**
 * Get current UTC ISO string
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Hash a string (for IP hashing and token storage)
 */
export async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

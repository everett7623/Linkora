import { ApiError, apiFetch } from './client';

export type AuthResult = 'authenticated' | 'unauthorized' | 'unreachable';

export async function login(token: string): Promise<AuthResult> {
  try {
    const res = await apiFetch<{ success: boolean; data: { authenticated: boolean } }>(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }
    );
    return res.success && res.data?.authenticated === true ? 'authenticated' : 'unauthorized';
  } catch (error) {
    return error instanceof ApiError && (error.status === 400 || error.status === 401)
      ? 'unauthorized'
      : 'unreachable';
  }
}

export async function checkMe(apiBase?: string): Promise<AuthResult> {
  try {
    const res = await apiFetch<{ success: boolean }>('/api/auth/me', {}, apiBase);
    return res.success ? 'authenticated' : 'unauthorized';
  } catch (error) {
    return error instanceof ApiError && (error.status === 401 || error.status === 403)
      ? 'unauthorized'
      : 'unreachable';
  }
}

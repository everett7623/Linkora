import { apiFetch } from './client';

export async function login(token: string): Promise<boolean> {
  try {
    const res = await apiFetch<{ success: boolean; data: { authenticated: boolean } }>(
      '/api/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }
    );
    return res.success && res.data?.authenticated === true;
  } catch {
    return false;
  }
}

export async function checkMe(): Promise<boolean> {
  try {
    const res = await apiFetch<{ success: boolean }>('/api/auth/me');
    return res.success;
  } catch {
    return false;
  }
}

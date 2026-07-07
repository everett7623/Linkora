import { apiGet, apiPut } from './client';

export function getSettings(): Promise<Record<string, string>> {
  return apiGet('/api/settings');
}

export function updateSettings(payload: Record<string, string>): Promise<{ message: string }> {
  return apiPut('/api/settings', payload);
}

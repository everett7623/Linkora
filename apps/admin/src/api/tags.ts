import { apiGet, apiPost, apiDelete } from './client';
import type { Tag } from '@linkora/shared';

export function listTags(): Promise<Tag[]> {
  return apiGet('/api/tags');
}

export function createTag(payload: { name: string; color?: string }): Promise<Tag> {
  return apiPost('/api/tags', payload);
}

export function deleteTag(id: string): Promise<{ message: string }> {
  return apiDelete(`/api/tags/${id}`);
}

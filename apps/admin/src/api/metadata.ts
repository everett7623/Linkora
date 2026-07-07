import { apiPost } from './client';

export interface PageTitleResult {
  title: string;
  final_url: string;
}

export function fetchPageTitle(url: string): Promise<PageTitleResult> {
  return apiPost('/api/metadata/title', { url });
}

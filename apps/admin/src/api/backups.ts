import { apiGet, apiPost, downloadFile } from './client';
import type { Backup } from '@linkora/shared';

export interface BackupsList {
  items: Backup[];
  total: number;
  r2Configured: boolean;
}

export function listBackups(): Promise<BackupsList> {
  return apiGet('/api/backups');
}

export function createBackup(): Promise<Backup> {
  return apiPost('/api/backups/create');
}

export function downloadBackup(backup: Backup): Promise<void> {
  return downloadFile(`/api/backups/${backup.id}/download`, backupFilename(backup.filename));
}

function backupFilename(filename: string): string {
  const parts = filename.split('/');
  return parts[parts.length - 1] || filename;
}

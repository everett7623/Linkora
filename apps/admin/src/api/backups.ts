import { apiGet, apiPost, downloadFile } from './client';
import type { Backup } from '@linkora/shared';

export type RestoreConflictStrategy = 'skip' | 'rename' | 'overwrite';

export interface BackupsList {
  items: Backup[];
  total: number;
  r2Configured: boolean;
}

export interface BackupRestorePreview {
  backupRecord: Backup;
  backup: {
    exportedAt?: string;
    version?: string;
    links: number;
    tags: number;
    redirectRules: number;
  };
  conflictStrategy: RestoreConflictStrategy;
  total: number;
  valid: number;
  invalid: number;
  conflicts: number;
  willCreate: number;
  willOverwrite: number;
  willRename: number;
  willSkip: number;
  redirectRulesToRestore: number;
  preview: Array<{
    slug: string;
    title?: string | null;
    longUrl: string;
    valid: boolean;
    errors: string[];
    conflict: boolean;
    action: 'create' | 'overwrite' | 'rename' | 'skip' | 'invalid';
    nextSlug?: string;
  }>;
}

export interface BackupRestoreResult extends BackupRestorePreview {
  mode: 'restore';
  preRestoreBackup?: Backup;
  restoredAt: string;
  created: number;
  overwritten: number;
  renamed: number;
  skipped: number;
  failed: number;
  redirectRulesRestored: number;
  report: string;
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

export function previewBackupRestore(
  backup: Backup,
  conflictStrategy: RestoreConflictStrategy
): Promise<BackupRestorePreview> {
  return apiPost(`/api/backups/${backup.id}/restore-preview`, { conflictStrategy });
}

export function restoreBackup(
  backup: Backup,
  conflictStrategy: RestoreConflictStrategy
): Promise<BackupRestoreResult> {
  return apiPost(`/api/backups/${backup.id}/restore`, { conflictStrategy, confirm: true });
}

function backupFilename(filename: string): string {
  const parts = filename.split('/');
  return parts[parts.length - 1] || filename;
}

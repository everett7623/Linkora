import { apiPost, apiGet, downloadFile } from './client';
import type { ImportJob } from '@linkora/shared';

export interface PreviewResult {
  source: string;
  total: number;
  valid: number;
  invalid: number;
  conflicts: number;
  preview: Array<{
    slug: string;
    longUrl: string;
    title?: string;
    _valid: boolean;
    _errors: string[];
    _conflict: boolean;
  }>;
}

export function previewImport(content: string, source?: string): Promise<PreviewResult> {
  return apiPost('/api/import/preview', { content, source });
}

export interface ConfirmResult {
  jobId: string;
  total: number;
  success: number;
  skipped: number;
  conflicts: number;
  failed: number;
  conflictStrategy: ImportConflictStrategy;
  completedAt: string;
}

export type ImportConflictStrategy = 'skip' | 'rename' | 'overwrite';

export function confirmImport(
  content: string,
  source?: string,
  filename?: string,
  conflictStrategy: ImportConflictStrategy = 'skip'
): Promise<ConfirmResult> {
  return apiPost('/api/import/confirm', { content, source, filename, conflictStrategy });
}

export function listImportJobs(): Promise<ImportJob[]> {
  return apiGet('/api/import/jobs');
}

export function getImportJob(id: string): Promise<ImportJob> {
  return apiGet(`/api/import/jobs/${id}`);
}

export function downloadImportReport(id: string, date: string): Promise<void> {
  return downloadFile(`/api/import/jobs/${id}/report.csv`, `import-report-${date}.csv`);
}

function timestampForFilename(): string {
  const iso = new Date().toISOString();
  return `${iso.slice(0, 10)}-${iso.slice(11, 19).replace(/:/g, '')}`;
}

export function exportLinksCSV(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  return downloadFile('/api/export/links.csv', `linkora-links-${today}.csv`);
}

export function exportLinksJSON(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  return downloadFile('/api/export/links.json', `linkora-links-${today}.json`);
}

export function exportVisitsCSV(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  return downloadFile('/api/export/visits.csv', `linkora-visits-${today}.csv`);
}

export function exportBackup(filename = `linkora-backup-${timestampForFilename()}.json`): Promise<void> {
  return downloadFile('/api/export/backup.json', filename);
}

export function exportPreImportBackup(): Promise<void> {
  return exportBackup(`linkora-pre-import-backup-${timestampForFilename()}.json`);
}

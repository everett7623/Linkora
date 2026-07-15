import type { Backup } from '@linketry/shared';
import type { Env } from '../types';
import { createR2Backup } from '../backups/index';
import { now } from '../utils/id';

export const RESET_CONFIRMATION = 'RESET LINKETRY';

export function isResetConfirmation(value: unknown): boolean {
  return value === RESET_CONFIRMATION;
}

const RESET_TABLES = [
  { name: 'visit_targets', optional: true },
  { name: 'conversion_events', optional: true },
  { name: 'visits', optional: false },
  { name: 'daily_stats', optional: false },
  { name: 'redirect_rules', optional: false },
  { name: 'links', optional: false },
  { name: 'tags', optional: false },
  { name: 'domains', optional: false },
  { name: 'import_jobs', optional: false },
  { name: 'api_tokens', optional: false },
  { name: 'audit_logs', optional: false },
  { name: 'settings', optional: false },
] as const;

const DEFAULT_SETTINGS: Record<string, string> = {
  default_redirect_type: '302',
  default_domain: '',
  site_name: 'Linketry',
  analytics_retention_days: '0',
  backup_retention_days: '30',
  health_monitoring_enabled: 'false',
  health_monitoring_limit: '20',
  health_failure_threshold: '2',
  health_alert_suppression_minutes: '1440',
};

export interface InstanceResetPreview {
  confirmationPhrase: typeof RESET_CONFIRMATION;
  tables: Record<string, number>;
  totalRows: number;
  kvPrefix: string;
  preservesBackups: boolean;
  preservesAdminToken: boolean;
}

export interface InstanceResetResult extends InstanceResetPreview {
  mode: 'reset';
  resetAt: string;
  kvDeleted: number;
  preResetBackup?: Backup;
}

export async function previewInstanceReset(env: Env): Promise<InstanceResetPreview> {
  const tables: Record<string, number> = {};
  for (const table of RESET_TABLES)
    tables[table.name] = await countRows(env, table.name, table.optional === true);
  return {
    confirmationPhrase: RESET_CONFIRMATION,
    tables,
    totalRows: Object.values(tables).reduce((sum, count) => sum + count, 0),
    kvPrefix: 'linketry:slug:',
    preservesBackups: true,
    preservesAdminToken: true,
  };
}

export async function resetInstance(env: Env, createBackup: boolean): Promise<InstanceResetResult> {
  const preview = await previewInstanceReset(env);
  const preResetBackup = createBackup ? await createR2Backup(env, 'pre-reset') : undefined;
  const kvDeleted = await clearSlugCaches(env);
  const resetAt = now();

  for (const table of RESET_TABLES) await deleteRows(env, table.name, table.optional === true);
  await restoreDefaultSettings(env, resetAt);

  return {
    ...preview,
    mode: 'reset',
    resetAt,
    kvDeleted,
    preResetBackup,
  };
}

async function countRows(env: Env, table: string, optional: boolean): Promise<number> {
  try {
    const row = await env.DB.prepare(`SELECT COUNT(*) as count FROM ${table}`).first<{
      count: number;
    }>();
    return row?.count ?? 0;
  } catch (error) {
    if (!optional) throw error;
    return 0;
  }
}

async function deleteRows(env: Env, table: string, optional: boolean): Promise<void> {
  try {
    await env.DB.prepare(`DELETE FROM ${table}`).run();
  } catch (error) {
    if (!optional) throw error;
  }
}

async function restoreDefaultSettings(env: Env, updatedAt: string): Promise<void> {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await env.DB.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)')
      .bind(key, value, updatedAt)
      .run();
  }
}

async function clearSlugCaches(env: Env): Promise<number> {
  return clearCachePrefix(env, 'linketry:slug:');
}

async function clearCachePrefix(env: Env, prefix: string): Promise<number> {
  let cursor: string | undefined;
  let deleted = 0;

  do {
    const page = await env.KV.list({ prefix, cursor });
    await Promise.all(page.keys.map((key) => env.KV.delete(key.name)));
    deleted += page.keys.length;
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return deleted;
}

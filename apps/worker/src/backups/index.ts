import { LINKORA_VERSION, type Backup } from '@linkora/shared';
import type { Env } from '../types';
import {
  createBackupRecord,
  getAllLinks,
  getAllRedirectRules,
  getAllTags,
  getSettings,
} from '../db/index';
import { generateId, now } from '../utils/id';

export interface LinkoraBackupPayload {
  name: 'Linkora Backup';
  version: string;
  exportedAt: string;
  links: Awaited<ReturnType<typeof getAllLinks>>;
  tags: Awaited<ReturnType<typeof getAllTags>>;
  redirectRules: Awaited<ReturnType<typeof getAllRedirectRules>>;
  settings: Record<string, string>;
}

export type BackupTrigger = 'manual' | 'scheduled' | 'pre-restore' | 'pre-reset';

export async function buildBackupPayload(env: Env): Promise<LinkoraBackupPayload> {
  const [links, tags, redirectRules, settings] = await Promise.all([
    getAllLinks(env),
    getAllTags(env),
    getAllRedirectRules(env),
    getSettings(env),
  ]);

  return {
    name: 'Linkora Backup',
    version: env.LINKORA_VERSION ?? LINKORA_VERSION,
    exportedAt: now(),
    links,
    tags,
    redirectRules,
    settings: redactBackupSettings(settings),
  };
}

export async function createR2Backup(
  env: Env,
  trigger: BackupTrigger = 'manual'
): Promise<Backup> {
  const createdAt = now();
  const objectKey = createBackupObjectKey(createdAt);
  const baseBackup: Backup = {
    id: generateId(),
    filename: objectKey,
    storage: 'r2',
    size: null,
    status: 'failed',
    created_at: createdAt,
  };

  if (!env.BACKUPS) {
    await createBackupRecord(env, baseBackup);
    throw new Error('R2 backup bucket is not configured');
  }

  const payload = await buildBackupPayload(env);
  const body = JSON.stringify(payload, null, 2);
  const size = new TextEncoder().encode(body).byteLength;

  try {
    await env.BACKUPS.put(objectKey, body, {
      httpMetadata: { contentType: 'application/json; charset=utf-8' },
      customMetadata: {
        trigger,
        created_at: createdAt,
        version: payload.version,
      },
    });

    const backup: Backup = {
      ...baseBackup,
      size,
      status: 'completed',
    };
    await createBackupRecord(env, backup);
    return backup;
  } catch (error) {
    await createBackupRecord(env, {
      ...baseBackup,
      size,
      status: 'failed',
    });
    throw error;
  }
}

export function backupDownloadName(filename: string): string {
  const parts = filename.split('/');
  return parts[parts.length - 1] || filename;
}

function createBackupObjectKey(createdAt: string): string {
  const stamp = createdAt.slice(0, 19).replace(/[-:T]/g, '');
  return `backups/linkora-backup-${stamp}.json`;
}

function redactBackupSettings(settings: Record<string, string>): Record<string, string> {
  const redacted = { ...settings };
  if ('webhook_secret' in redacted) {
    redacted.webhook_secret = '';
  }
  delete redacted.health_alert_state;
  delete redacted.health_check_history;
  delete redacted.public_stats_shares;
  delete redacted.health_monitoring_cursor;
  delete redacted.analytics_report_records;
  return redacted;
}

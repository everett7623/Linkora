import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { getBackupById, listBackups } from '../db/index';
import { backupDownloadName, createR2Backup } from '../backups/index';
import {
  parseRestoreConflictStrategy,
  previewBackupRestore,
  restoreBackupPayload,
} from '../backups/restore';
import { recordAudit } from '../audit/index';
import { emitWebhook } from '../webhooks/index';
import { jsonError, jsonOk } from '../utils/response';

const backupRoutes = new Hono<{ Bindings: Env }>();
const MAX_ONE_CLICK_RESTORE_BYTES = 25 * 1024 * 1024;

backupRoutes.use('*', async (c, next) => {
  const authError = await requireAuth(c);
  if (authError) return authError;
  await next();
});

backupRoutes.get('/', async (c) => {
  const items = await listBackups(c.env);
  return jsonOk({
    items,
    total: items.length,
    r2Configured: Boolean(c.env.BACKUPS),
  });
});

backupRoutes.post('/create', async (c) => {
  try {
    const backup = await createR2Backup(c.env, 'manual');
    await recordAudit(c.env, c.req.raw, 'backup.create', 'backup', backup.id, {
      filename: backup.filename,
      size: backup.size,
      storage: backup.storage,
    });
    c.executionCtx.waitUntil(emitWebhook(c.env, 'backup.completed', { backup, trigger: 'manual' }));
    return jsonOk(backup, 201);
  } catch (error) {
    c.executionCtx.waitUntil(emitWebhook(c.env, 'backup.failed', {
      trigger: 'manual',
      error: error instanceof Error ? error.message : String(error),
    }));
    return jsonError(error instanceof Error ? error.message : 'Backup failed', 503);
  }
});

backupRoutes.get('/:id/download', async (c) => {
  const backup = await getBackupById(c.env, c.req.param('id'));
  if (!backup) return jsonError('Backup not found', 404);
  if (backup.status !== 'completed') return jsonError('Backup is not available for download', 409);
  if (!c.env.BACKUPS) return jsonError('R2 backup bucket is not configured', 503);

  const object = await c.env.BACKUPS.get(backup.filename);
  if (!object) return jsonError('Backup object not found in R2', 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json; charset=utf-8');
  headers.set('Content-Length', String(object.size));
  headers.set('Content-Disposition', `attachment; filename="${backupDownloadName(backup.filename)}"`);

  return new Response(object.body, { headers });
});

backupRoutes.post('/:id/restore-preview', async (c) => {
  const payloadResult = await readBackupPayload(c.env, c.req.param('id'));
  if ('error' in payloadResult) return jsonError(payloadResult.error, payloadResult.status);

  let body: { conflictStrategy?: unknown } = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }

  try {
    const conflictStrategy = parseRestoreConflictStrategy(body.conflictStrategy);
    const preview = await previewBackupRestore(c.env, payloadResult.payload, conflictStrategy);
    return jsonOk({ backupRecord: payloadResult.backup, ...preview });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Backup restore preview failed', 400);
  }
});

backupRoutes.post('/:id/restore', async (c) => {
  let body: { conflictStrategy?: unknown; confirm?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  if (body.confirm !== true) return jsonError('confirm must be true before restoring a backup', 400);
  const payloadResult = await readBackupPayload(c.env, c.req.param('id'));
  if ('error' in payloadResult) return jsonError(payloadResult.error, payloadResult.status);

  const conflictStrategy = parseRestoreConflictStrategy(body.conflictStrategy);
  let preRestoreBackup;
  try {
    preRestoreBackup = await createR2Backup(c.env, 'pre-restore');
  } catch (error) {
    return jsonError(`Pre-restore backup failed: ${error instanceof Error ? error.message : String(error)}`, 503);
  }

  try {
    const requestDomain = new URL(c.req.url).hostname;
    const result = await restoreBackupPayload(
      c.env,
      payloadResult.payload,
      requestDomain,
      conflictStrategy,
      preRestoreBackup
    );
    await recordAudit(c.env, c.req.raw, 'backup.restore', 'backup', payloadResult.backup.id, {
      conflictStrategy,
      preRestoreBackupId: preRestoreBackup.id,
      created: result.created,
      overwritten: result.overwritten,
      renamed: result.renamed,
      skipped: result.skipped,
      failed: result.failed,
      redirectRulesRestored: result.redirectRulesRestored,
    });
    c.executionCtx.waitUntil(emitWebhook(c.env, 'backup.completed', {
      backup: payloadResult.backup,
      trigger: 'restore',
      result,
    }));
    return jsonOk({ backupRecord: payloadResult.backup, ...result });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Backup restore failed', 500);
  }
});

async function readBackupPayload(
  env: Env,
  id: string
): Promise<{ backup: NonNullable<Awaited<ReturnType<typeof getBackupById>>>; payload: unknown } | { error: string; status: 404 | 409 | 503 }> {
  const backup = await getBackupById(env, id);
  if (!backup) return { error: 'Backup not found', status: 404 };
  if (backup.status !== 'completed') return { error: 'Backup is not available for restore', status: 409 };
  if (!env.BACKUPS) return { error: 'R2 backup bucket is not configured', status: 503 };

  const object = await env.BACKUPS.get(backup.filename);
  if (!object) return { error: 'Backup object not found in R2', status: 404 };
  if (object.size > MAX_ONE_CLICK_RESTORE_BYTES) {
    return {
      error: 'Backup object is too large for one-click restore. Download it and restore manually.',
      status: 409,
    };
  }

  try {
    return { backup, payload: JSON.parse(await object.text()) as unknown };
  } catch {
    return { error: 'Backup object is not valid JSON', status: 409 };
  }
}

export default backupRoutes;

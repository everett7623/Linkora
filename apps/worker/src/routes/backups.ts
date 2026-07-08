import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { getBackupById, listBackups } from '../db/index';
import { backupDownloadName, createR2Backup } from '../backups/index';
import { recordAudit } from '../audit/index';
import { jsonError, jsonOk } from '../utils/response';

const backupRoutes = new Hono<{ Bindings: Env }>();

backupRoutes.use('*', async (c, next) => {
  const authError = requireAuth(c);
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
    return jsonOk(backup, 201);
  } catch (error) {
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

export default backupRoutes;

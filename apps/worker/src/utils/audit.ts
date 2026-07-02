import type { Context } from 'hono';
import type { Env } from '../types';
import { insertAuditLog } from '../db/index';
import { generateId, now, sha256 } from './id';

export type AuditAction =
  | 'link.create'
  | 'link.update'
  | 'link.delete'
  | 'link.disable'
  | 'link.enable'
  | 'link.archive'
  | 'link.restore'
  | 'link.bulk_delete'
  | 'link.bulk_disable'
  | 'link.bulk_enable'
  | 'link.bulk_tag'
  | 'link.bulk_archive'
  | 'tag.create'
  | 'tag.delete'
  | 'settings.update'
  | 'import.confirm';

export async function logAudit(
  c: Context<{ Bindings: Env }>,
  action: AuditAction,
  targetType?: string,
  targetId?: string,
  detail?: string
): Promise<void> {
  try {
    const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? '';
    const ua = c.req.header('User-Agent') ?? '';
    const ipHash = ip ? await sha256(ip) : undefined;

    await insertAuditLog(c.env, {
      id: generateId(),
      action,
      target_type: targetType,
      target_id: targetId,
      detail,
      ip_hash: ipHash,
      user_agent: ua,
      created_at: now(),
    });
  } catch {
    // Audit log failures must never block operations
  }
}

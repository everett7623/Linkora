import { Hono } from 'hono';
import type { Env } from '../types';
import { requireAuth } from '../auth/index';
import { getSettings, setSetting } from '../db/index';
import { jsonOk, jsonError } from '../utils/response';
import { now } from '../utils/id';
import { DEFAULT_BACKUP_RETENTION_DAYS } from '../backups/retentionPolicy';
import { DEFAULT_HEALTH_MONITORING_LIMIT } from '../health/monitoringPolicy';
import {
  DEFAULT_HEALTH_FAILURE_THRESHOLD,
  DEFAULT_HEALTH_SUPPRESSION_MINUTES,
} from '../health/alertPolicy';

const settings = new Hono<{ Bindings: Env }>();

settings.use('*', async (c, next) => {
  const authError = await requireAuth(c, 'admin');
  if (authError) return authError;
  await next();
});

settings.get('/', async (c) => {
  const allSettings = await getSettings(c.env);
  allSettings.backup_retention_days ??= String(DEFAULT_BACKUP_RETENTION_DAYS);
  allSettings.health_monitoring_enabled ??= 'false';
  allSettings.health_monitoring_limit ??= String(DEFAULT_HEALTH_MONITORING_LIMIT);
  allSettings.health_failure_threshold ??= String(DEFAULT_HEALTH_FAILURE_THRESHOLD);
  allSettings.health_alert_suppression_minutes ??= String(DEFAULT_HEALTH_SUPPRESSION_MINUTES);
  delete allSettings.health_alert_state;
  delete allSettings.health_monitoring_cursor;
  if ('webhook_secret' in allSettings) {
    allSettings.webhook_secret = '';
  }
  return jsonOk(allSettings);
});

settings.put('/', async (c) => {
  let body: Record<string, string>;
  try {
    body = await c.req.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  const ts = now();
  const updates: Promise<void>[] = [];
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      const normalized = normalizeSetting(key, value);
      if (normalized.error) return jsonError(normalized.error, 400);
      updates.push(setSetting(c.env, key, normalized.value, ts));
    }
  }
  await Promise.all(updates);

  return jsonOk({ message: 'Settings updated' });
});

function normalizeSetting(key: string, value: string): { value: string; error?: string } {
  if (key === 'health_monitoring_enabled') {
    if (value !== 'true' && value !== 'false') {
      return { value: 'false', error: 'health_monitoring_enabled must be true or false' };
    }
    return { value };
  }
  if (key === 'health_monitoring_limit') {
    const limit = parseInt(value, 10);
    if (!Number.isFinite(limit) || limit < 1 || limit > 50) {
      return {
        value: String(DEFAULT_HEALTH_MONITORING_LIMIT),
        error: 'health_monitoring_limit must be between 1 and 50',
      };
    }
    return { value: String(limit) };
  }
  if (key === 'health_failure_threshold') {
    const threshold = parseInt(value, 10);
    if (!Number.isFinite(threshold) || threshold < 1 || threshold > 10) {
      return {
        value: String(DEFAULT_HEALTH_FAILURE_THRESHOLD),
        error: 'health_failure_threshold must be between 1 and 10',
      };
    }
    return { value: String(threshold) };
  }
  if (key === 'health_alert_suppression_minutes') {
    const minutes = parseInt(value, 10);
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 10080) {
      return {
        value: String(DEFAULT_HEALTH_SUPPRESSION_MINUTES),
        error: 'health_alert_suppression_minutes must be between 0 and 10080',
      };
    }
    return { value: String(minutes) };
  }
  if (key === 'backup_retention_days') {
    const days = parseInt(value, 10);
    if (!Number.isFinite(days) || days < 1 || days > 3650) {
      return {
        value: String(DEFAULT_BACKUP_RETENTION_DAYS),
        error: 'backup_retention_days must be between 1 and 3650',
      };
    }
    return { value: String(days) };
  }
  if (key !== 'analytics_retention_days') return { value };
  const days = parseInt(value, 10);
  if (!Number.isFinite(days) || days < 0 || days > 3650) {
    return { value: '0', error: 'analytics_retention_days must be between 0 and 3650' };
  }
  return { value: String(days) };
}

export default settings;

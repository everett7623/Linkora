import { LINKETRY_VERSION } from '@linketry/shared';
import type { Env } from '../types';

function configured(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function getAdminToken(env: Env): string {
  return configured(env.LINKETRY_ADMIN_TOKEN) ?? '';
}

export function getRuntimeVersion(env: Env): string {
  return configured(env.LINKETRY_VERSION) ?? LINKETRY_VERSION;
}

export function getDailyCron(env: Env, fallback: string): string {
  return configured(env.LINKETRY_DAILY_CRON) ?? fallback;
}

export function getHealthCron(env: Env): string | undefined {
  return configured(env.LINKETRY_HEALTH_CRON);
}

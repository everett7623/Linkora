import type { VisitQueueMessage } from '@linketry/shared';

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ASSETS?: Fetcher;
  BACKUPS?: R2Bucket;
  VISITS_QUEUE?: Queue<VisitQueueMessage>;
  DEMO_RATE_LIMITER?: RateLimit;
  LINKETRY_ADMIN_TOKEN?: string;
  LINKETRY_VERSION?: string;
  LINKETRY_DAILY_CRON?: string;
  LINKETRY_HEALTH_CRON?: string;
  LINKETRY_DEMO_MODE?: string;
  LINKETRY_GITHUB_UPDATE_TOKEN?: string;
  LINKETRY_UPDATE_REPOSITORY?: string;
  LINKETRY_UPDATE_BRANCH?: string;
}

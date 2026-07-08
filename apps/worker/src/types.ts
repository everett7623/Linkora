export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  BACKUPS?: R2Bucket;
  ADMIN_TOKEN: string;
  LINKORA_VERSION: string;
}

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ADMIN_TOKEN: string;
  LINKORA_VERSION: string;
  /**
   * Comma-separated list of origins allowed to call the API via CORS.
   * Example: "https://admin.example.com,https://linkora.example.com".
   * If unset, cross-origin browser requests are not permitted.
   */
  CORS_ORIGINS?: string;
  /**
   * Optional secret salt mixed into visitor IP hashes so that stored
   * hashes cannot be trivially reversed via brute force of the IPv4 space.
   */
  IP_HASH_SALT?: string;
}

import { cors } from 'hono/cors';

export const healthCors = cors({
  origin: '*',
  allowMethods: ['GET', 'OPTIONS'],
});

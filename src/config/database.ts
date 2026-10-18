import { Pool } from 'pg';
import { env } from '@/config/env';
import { initSchema } from '@/db/initSchema';
import { logger } from '@/utils/logger';

export const pool = new Pool({ connectionString: env.DATABASE_URL });

pool.on('error', (error: Error) => {
  logger.error('Unexpected Postgres pool error', { message: error.message });
});

export const connectDatabase = async (): Promise<void> => {
  if (!env.DATABASE_URL) {
    logger.warn('DATABASE_URL not set — skipping database connection');
    return;
  }
  const client = await pool.connect();
  try {
    // Pre-release only: replace with real migrations before going to production.
    if (env.NODE_ENV !== 'production') {
      await initSchema(client);
    }
    logger.info('Connected to Postgres');
  } finally {
    client.release();
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await pool.end();
};

export const isDatabaseReady = async (): Promise<boolean> => {
  if (!env.DATABASE_URL) return false;
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
};

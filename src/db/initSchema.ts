import type { PoolClient } from 'pg';
import { schema } from '@/db/schema';

export const initSchema = async (client: PoolClient): Promise<void> => {
  await client.query('BEGIN');
  try {
    for (const sql of schema) {
      await client.query(sql);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
};

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import { logger } from '../lib/logger.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function createPool(connectionString: string): pg.Pool {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    logger.error({ error: err.message }, 'Unexpected database pool error');
  });

  pool.on('connect', () => {
    logger.debug('New database connection established');
  });

  return pool;
}

export function createDb(connectionString: string) {
  const poolInstance = createPool(connectionString);

  return drizzle(poolInstance, {
    schema,
    logger: process.env.NODE_ENV === 'development',
  });
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}

export type Database = ReturnType<typeof createDb>;

// Re-export schema for convenience
export * from './schema.js';

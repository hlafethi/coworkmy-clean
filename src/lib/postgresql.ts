import { Pool, PoolClient } from 'pg';
import { getCurrentDatabaseConfig } from '../config/database';

let pool: Pool | null = null;

export const getPostgreSQLPool = (): Pool => {
  if (!pool) {
    const config = getCurrentDatabaseConfig();
    
    if (config.type !== 'postgresql') {
      throw new Error('Configuration PostgreSQL requise');
    }
    
    pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Test de connexion
    pool.on('connect', () => {
      console.log('[PostgreSQL] Connecté à la base de données');
    });
    
    pool.on('error', (err) => {
      console.error('[PostgreSQL] Erreur de connexion:', err);
    });
  }
  
  return pool;
};

export const executeQuery = async <T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> => {
  const client = await getPostgreSQLPool().connect();
  
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
};

export const executeTransaction = async <T = any>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await getPostgreSQLPool().connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const closePostgreSQLPool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
}; 
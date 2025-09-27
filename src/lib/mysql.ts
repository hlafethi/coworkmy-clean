import mysql from 'mysql2/promise';
import { getCurrentDatabaseConfig } from '../config/database';

let pool: mysql.Pool | null = null;

export const getMySQLPool = (): mysql.Pool => {
  if (!pool) {
    const config = getCurrentDatabaseConfig();
    
    if (config.type !== 'mysql') {
      throw new Error('Configuration MySQL requise');
    }
    
    pool = mysql.createPool({
      host: config.host,
      port: config.port || 3306,
      database: config.database,
      user: config.username,
      password: config.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      acquireTimeout: 60000,
      timeout: 60000,
    });
    
    console.log('[MySQL] Pool de connexion créé');
  }
  
  return pool;
};

export const executeQuery = async <T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> => {
  const connection = await getMySQLPool().getConnection();
  
  try {
    const [rows] = await connection.execute(query, params);
    return rows as T[];
  } finally {
    connection.release();
  }
};

export const executeTransaction = async <T = any>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> => {
  const connection = await getMySQLPool().getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const closeMySQLPool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
}; 
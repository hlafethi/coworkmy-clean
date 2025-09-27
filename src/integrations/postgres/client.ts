// @ts-nocheck
import pg from 'pg';
const { Pool } = pg;

// Configuration de la connexion à la base de données PostgreSQL
const pgConfig = {
  host: import.meta.env.VITE_PG_HOST || '109.234.166.71',
  database: import.meta.env.VITE_PG_DATABASE || 'rafi0640_coworkmy',
  user: import.meta.env.VITE_PG_USER || 'rafi0640_coworkmyadmin',
  password: import.meta.env.VITE_PG_PASSWORD || 'Coworkmy2025!',
  port: parseInt(import.meta.env.VITE_PG_PORT || '5432', 10),
  ssl: import.meta.env.VITE_PG_SSL === 'true' || false
};

// Création du pool de connexions
const pool = new Pool(pgConfig);

// Fonction pour exécuter une requête SQL
export async function query(text: string, params: any[] = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Exécution de la requête', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la requête', { text, error });
    throw error;
  }
}

// Fonction pour obtenir un client du pool
export async function getClient() {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  
  // Remplacer la méthode query pour ajouter des logs
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };
  
  // Remplacer la méthode release pour ajouter des logs
  client.release = () => {
    client.query = query;
    client.release = release;
    return release.apply(client);
  };
  
  return client;
}

// Fonction pour exécuter une transaction
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await getClient();
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
}

// Fonction pour fermer le pool de connexions
export function closePool() {
  return pool.end();
}

// Exporter le pool pour un accès direct si nécessaire
export { pool };

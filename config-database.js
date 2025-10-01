// Configuration de la base de données PostgreSQL
// Ce fichier vous aide à configurer la connexion à votre VPS PostgreSQL

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuration de la connexion PostgreSQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coworkmy',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum de connexions dans le pool
  idleTimeoutMillis: 30000, // Fermer les connexions inactives après 30s
  connectionTimeoutMillis: 2000, // Timeout de connexion
};

// Création du pool de connexions
const pool = new Pool(dbConfig);

// Test de connexion
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Connexion PostgreSQL réussie');
    
    // Test de requête simple
    const result = await client.query('SELECT NOW() as current_time');
    console.log('🕐 Heure du serveur:', result.rows[0].current_time);
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion PostgreSQL:', error.message);
    console.log('\n🔧 Vérifiez votre configuration :');
    console.log('   - Host:', dbConfig.host);
    console.log('   - Port:', dbConfig.port);
    console.log('   - Database:', dbConfig.database);
    console.log('   - User:', dbConfig.user);
    console.log('   - SSL:', dbConfig.ssl);
    return false;
  }
}

// Fonction pour exécuter des requêtes
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Requête exécutée:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Erreur requête:', error.message);
    throw error;
  }
}

// Fonction pour fermer le pool
async function closePool() {
  try {
    await pool.end();
    console.log('🔒 Pool de connexions fermé');
  } catch (error) {
    console.error('❌ Erreur fermeture pool:', error.message);
  }
}

// Gestion des erreurs du pool
pool.on('error', (err) => {
  console.error('❌ Erreur pool PostgreSQL:', err);
});

// Gestion des connexions
pool.on('connect', (client) => {
  console.log('🔗 Nouvelle connexion établie');
});

pool.on('remove', (client) => {
  console.log('🔌 Connexion fermée');
});

export { pool, testConnection, query, closePool };
export default pool;

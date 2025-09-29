import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Test de connexion à la base de données PostgreSQL...');

// Test avec différents paramètres
const configs = [
  {
    name: 'Configuration par défaut',
    config: {
      user: 'postgres',
      host: 'localhost',
      database: 'postgres',
      password: 'postgres',
      port: 5432,
    }
  },
  {
    name: 'Configuration avec mot de passe vide',
    config: {
      user: 'postgres',
      host: 'localhost',
      database: 'postgres',
      password: '',
      port: 5432,
    }
  },
  {
    name: 'Configuration avec base de données par défaut',
    config: {
      user: 'postgres',
      host: 'localhost',
      database: 'defaultdb',
      password: 'postgres',
      port: 5432,
    }
  }
];

async function testConnection(config) {
  const pool = new Pool(config.config);
  
  try {
    console.log(`\n📊 Test: ${config.name}`);
    console.log(`   Host: ${config.config.host}:${config.config.port}`);
    console.log(`   Database: ${config.config.database}`);
    console.log(`   User: ${config.config.user}`);
    
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    console.log(`   ✅ Connexion réussie !`);
    console.log(`   ⏰ Heure: ${result.rows[0].current_time}`);
    console.log(`   🐘 Version: ${result.rows[0].version.split(' ')[0]}`);
    
    await pool.end();
    return true;
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
    await pool.end();
    return false;
  }
}

async function main() {
  for (const config of configs) {
    const success = await testConnection(config);
    if (success) {
      console.log(`\n🎉 Configuration fonctionnelle trouvée: ${config.name}`);
      break;
    }
  }
  
  console.log('\n🔍 Test terminé');
}

main().catch(console.error);
#!/usr/bin/env node

/**
 * Script de test pour vérifier la connexion MySQL
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

// Configuration MySQL
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'coworkmy',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function testMySQLConnection() {
  let connection = null;
  
  try {
    console.log('🔍 Test de connexion MySQL...');
    console.log('📋 Configuration:', {
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      user: mysqlConfig.user,
      database: mysqlConfig.database
    });
    
    // Test 1: Connexion sans base de données spécifique
    console.log('\n1️⃣ Test de connexion initiale...');
    const initialConfig = { ...mysqlConfig, database: undefined };
    connection = await mysql.createConnection(initialConfig);
    console.log('✅ Connexion initiale réussie');
    
    // Test 2: Vérification des bases de données existantes
    console.log('\n2️⃣ Vérification des bases de données...');
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('📋 Bases de données disponibles:');
    databases.forEach(db => {
      console.log(`  - ${Object.values(db)[0]}`);
    });
    
    // Test 3: Vérification de la base de données coworkmy
    const coworkmyExists = databases.some(db => Object.values(db)[0] === mysqlConfig.database);
    if (coworkmyExists) {
      console.log(`✅ Base de données '${mysqlConfig.database}' existe`);
      
      // Test 4: Connexion à la base de données coworkmy
      console.log('\n3️⃣ Test de connexion à la base de données coworkmy...');
      await connection.end();
      connection = await mysql.createConnection(mysqlConfig);
      console.log('✅ Connexion à la base de données réussie');
      
      // Test 5: Vérification des tables
      console.log('\n4️⃣ Vérification des tables...');
      const [tables] = await connection.execute('SHOW TABLES');
      if (tables.length > 0) {
        console.log('📋 Tables existantes:');
        tables.forEach(table => {
          console.log(`  - ${Object.values(table)[0]}`);
        });
      } else {
        console.log('⚠️  Aucune table trouvée');
      }
      
      // Test 6: Test de requête simple
      console.log('\n5️⃣ Test de requête simple...');
      const [result] = await connection.execute('SELECT 1 as test');
      console.log('✅ Requête de test réussie:', result[0]);
      
    } else {
      console.log(`⚠️  Base de données '${mysqlConfig.database}' n'existe pas`);
      console.log('💡 Exécutez le script d\'initialisation: node scripts/init-mysql-db.js');
    }
    
    console.log('\n🎉 Tests de connexion MySQL terminés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test de connexion:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solutions possibles:');
      console.log('  1. Vérifiez que MySQL est démarré');
      console.log('  2. Vérifiez les paramètres de connexion dans .env.local');
      console.log('  3. Vérifiez que le port 3306 est accessible');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Solutions possibles:');
      console.log('  1. Vérifiez le nom d\'utilisateur et le mot de passe');
      console.log('  2. Vérifiez les permissions de l\'utilisateur MySQL');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Solutions possibles:');
      console.log('  1. Créez la base de données: CREATE DATABASE coworkmy;');
      console.log('  2. Ou exécutez le script d\'initialisation: node scripts/init-mysql-db.js');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécution du script
if (import.meta.url === `file://${process.argv[1]}`) {
  testMySQLConnection();
}

export { testMySQLConnection };

#!/usr/bin/env node

/**
 * Script d'initialisation de la base de données MySQL pour CoWorkMy
 * Ce script crée la base de données et applique le schéma complet
 */

import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration de la base de données MySQL
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'coworkmy',
  charset: 'utf8mb4',
  timezone: '+00:00',
  ssl: process.env.MYSQL_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false
};

// Configuration pour la connexion initiale (sans base de données spécifique)
const initialConfig = {
  ...mysqlConfig,
  database: undefined
};

/**
 * Crée une connexion MySQL
 */
async function createConnection(config) {
  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Connexion MySQL établie');
    return connection;
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL:', error.message);
    throw error;
  }
}

/**
 * Vérifie si la base de données existe
 */
async function databaseExists(connection, databaseName) {
  try {
    const [rows] = await connection.execute(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [databaseName]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la base de données:', error.message);
    throw error;
  }
}

/**
 * Crée la base de données si elle n'existe pas
 */
async function createDatabase(connection, databaseName) {
  try {
    const exists = await databaseExists(connection, databaseName);
    
    if (!exists) {
      await connection.execute(`CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅ Base de données '${databaseName}' créée`);
    } else {
      console.log(`ℹ️  Base de données '${databaseName}' existe déjà`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création de la base de données:', error.message);
    throw error;
  }
}

/**
 * Lit et exécute le fichier SQL
 */
async function executeSqlFile(connection, filePath) {
  try {
    console.log(`📖 Lecture du fichier SQL: ${filePath}`);
    const sqlContent = await fs.readFile(filePath, 'utf8');
    
    // Divise le contenu SQL en requêtes individuelles
    const queries = sqlContent
      .split(';')
      .map(query => query.trim())
      .filter(query => query.length > 0 && !query.startsWith('--'));
    
    console.log(`🔧 Exécution de ${queries.length} requêtes SQL...`);
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      
      // Ignore les commandes DELIMITER et les blocs de triggers
      if (query.startsWith('DELIMITER') || query.includes('CREATE TRIGGER')) {
        continue;
      }
      
      try {
        await connection.execute(query);
        console.log(`  ✅ Requête ${i + 1}/${queries.length} exécutée`);
      } catch (error) {
        // Ignore les erreurs de tables/vues déjà existantes
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
            error.code === 'ER_DUP_KEYNAME' || 
            error.code === 'ER_DUP_FIELDNAME' ||
            error.message.includes('already exists')) {
          console.log(`  ⚠️  Requête ${i + 1}/${queries.length} ignorée (déjà existant)`);
        } else {
          console.error(`  ❌ Erreur requête ${i + 1}/${queries.length}:`, error.message);
          throw error;
        }
      }
    }
    
    console.log('✅ Toutes les requêtes SQL exécutées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du fichier SQL:', error.message);
    throw error;
  }
}

/**
 * Vérifie la structure de la base de données
 */
async function verifyDatabaseStructure(connection) {
  try {
    console.log('🔍 Vérification de la structure de la base de données...');
    
    // Liste des tables attendues
    const expectedTables = [
      'profiles', 'spaces', 'bookings', 'payments', 'reviews',
      'notifications', 'support_tickets', 'support_messages', 'faq', 'audit_logs'
    ];
    
    const [tables] = await connection.execute('SHOW TABLES');
    const existingTables = tables.map(row => Object.values(row)[0]);
    
    console.log('📋 Tables existantes:', existingTables);
    
    // Vérifie les tables manquantes
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.warn('⚠️  Tables manquantes:', missingTables);
    } else {
      console.log('✅ Toutes les tables principales sont présentes');
    }
    
    // Vérifie les vues
    const [views] = await connection.execute("SHOW FULL TABLES WHERE Table_type = 'VIEW'");
    console.log('📊 Vues créées:', views.map(row => Object.values(row)[0]));
    
    // Vérifie les triggers
    const [triggers] = await connection.execute('SHOW TRIGGERS');
    console.log('⚡ Triggers créés:', triggers.length);
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
    throw error;
  }
}

/**
 * Insère des données de test
 */
async function insertTestData(connection) {
  try {
    console.log('🧪 Insertion de données de test...');
    
    // Vérifie si des données existent déjà
    const [existingProfiles] = await connection.execute('SELECT COUNT(*) as count FROM profiles');
    
    if (existingProfiles[0].count > 0) {
      console.log('ℹ️  Des données existent déjà, insertion de test ignorée');
      return;
    }
    
    // Insertion d'un utilisateur de test
    const testUserId = 'test-user-' + Date.now();
    await connection.execute(`
      INSERT INTO profiles (id, user_id, email, full_name, is_admin, is_verified) 
      VALUES (UUID(), ?, 'test@coworkmy.fr', 'Utilisateur Test', FALSE, TRUE)
    `, [testUserId]);
    
    // Récupère l'ID du profil créé
    const [profiles] = await connection.execute('SELECT id FROM profiles WHERE user_id = ?', [testUserId]);
    const profileId = profiles[0].id;
    
    // Insertion d'un espace de test
    await connection.execute(`
      INSERT INTO spaces (id, name, description, address, city, postal_code, owner_id, capacity) 
      VALUES (UUID(), 'Espace Test', 'Un espace de coworking de test', '123 Rue de Test', 'Paris', '75001', ?, 20)
    `, [profileId]);
    
    console.log('✅ Données de test insérées');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données de test:', error.message);
    // Ne pas faire échouer le script pour cette erreur
  }
}

/**
 * Fonction principale
 */
async function main() {
  let initialConnection = null;
  let dbConnection = null;
  
  try {
    console.log('🚀 Initialisation de la base de données MySQL pour CoWorkMy...');
    console.log('📋 Configuration:', {
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      user: mysqlConfig.user,
      database: mysqlConfig.database
    });
    
    // Étape 1: Connexion initiale (sans base de données)
    initialConnection = await createConnection(initialConfig);
    
    // Étape 2: Création de la base de données
    await createDatabase(initialConnection, mysqlConfig.database);
    await initialConnection.end();
    
    // Étape 3: Connexion à la base de données créée
    dbConnection = await createConnection(mysqlConfig);
    
    // Étape 4: Exécution du schéma SQL
    const schemaPath = path.join(__dirname, 'mysql-schema.sql');
    await executeSqlFile(dbConnection, schemaPath);
    
    // Étape 5: Vérification de la structure
    await verifyDatabaseStructure(dbConnection);
    
    // Étape 6: Insertion de données de test
    await insertTestData(dbConnection);
    
    console.log('🎉 Initialisation de la base de données MySQL terminée avec succès !');
    console.log('📊 Base de données prête pour CoWorkMy');
    
  } catch (error) {
    console.error('💥 Erreur fatale lors de l\'initialisation:', error.message);
    process.exit(1);
  } finally {
    if (initialConnection) {
      await initialConnection.end();
    }
    if (dbConnection) {
      await dbConnection.end();
    }
  }
}

// Exécution du script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as initMySQLDatabase };

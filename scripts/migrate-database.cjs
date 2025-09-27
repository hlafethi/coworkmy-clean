const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const mysql = require('mysql2/promise');

// Configuration des bases de données
const databases = {
  supabase: {
    type: 'postgresql',
    host: 'db.supabase.co',
    port: 5432,
    database: 'postgres',
    username: process.env.SUPABASE_DB_USER || 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD || '',
    url: process.env.SUPABASE_URL || ''
  },
  o2switch: {
    type: 'postgresql',
    host: 'localhost', // O2Switch utilise localhost
    port: 5432,
    database: 'sc2rafi0640_coworkmy',
    username: 'sc2rafi0640_coworkmy',
    password: process.env.O2SWITCH_DB_PASSWORD || ''
  },
  mysql: {
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    database: 'sc2rafi0640_coworkmy',
    username: 'sc2rafi0640_coworkmy',
    password: process.env.MYSQL_DB_PASSWORD || ''
  }
};

class DatabaseMigrator {
  constructor() {
    this.sourceClient = null;
    this.targetClient = null;
  }

  async connectToDatabase(config) {
    if (config.type === 'postgresql') {
      const client = new Client({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password,
        ssl: config.host === 'db.supabase.co' ? { rejectUnauthorized: false } : false
      });
      
      await client.connect();
      return client;
    } else if (config.type === 'mysql') {
      return await mysql.createConnection({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.username,
        password: config.password
      });
    }
  }

  async migrateData(sourceConfig, targetConfig) {
    console.log(`🚀 Début de la migration de ${sourceConfig.type} vers ${targetConfig.type}`);
    
    try {
      // Connexion aux bases
      this.sourceClient = await this.connectToDatabase(sourceConfig);
      this.targetClient = await this.connectToDatabase(targetConfig);
      
      console.log('✅ Connexions établies');
      
      // Migration des tables
      await this.migrateTable('profiles');
      await this.migrateTable('spaces');
      await this.migrateTable('admin_settings');
      await this.migrateTable('time_slots');
      await this.migrateTable('bookings');
      await this.migrateTable('payments');
      await this.migrateTable('support_messages');
      await this.migrateTable('support_chat_sessions');
      
      console.log('🎉 Migration terminée avec succès !');
      
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async migrateTable(tableName) {
    console.log(`📦 Migration de la table: ${tableName}`);
    
    try {
      // Récupérer les données de la source
      let sourceData;
      if (this.sourceClient.constructor.name === 'Client') {
        // PostgreSQL
        const result = await this.sourceClient.query(`SELECT * FROM ${tableName}`);
        sourceData = result.rows;
      } else {
        // MySQL
        const [rows] = await this.sourceClient.execute(`SELECT * FROM ${tableName}`);
        sourceData = rows;
      }
      
      console.log(`   📊 ${sourceData.length} enregistrements trouvés`);
      
      if (sourceData.length === 0) {
        console.log(`   ⏭️  Table ${tableName} vide, ignorée`);
        return;
      }
      
      // Insérer dans la cible
      for (const row of sourceData) {
        await this.insertRow(tableName, row);
      }
      
      console.log(`   ✅ ${sourceData.length} enregistrements migrés`);
      
    } catch (error) {
      console.error(`   ❌ Erreur lors de la migration de ${tableName}:`, error);
      throw error;
    }
  }

  async insertRow(tableName, row) {
    const columns = Object.keys(row);
    const values = Object.values(row);
    
    if (this.targetClient.constructor.name === 'Client') {
      // PostgreSQL
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
      const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
      await this.targetClient.query(query, values);
    } else {
      // MySQL
      const placeholders = values.map(() => '?').join(', ');
      const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${columns.map(col => `${col} = VALUES(${col})`).join(', ')}`;
      await this.targetClient.execute(query, values);
    }
  }

  async cleanup() {
    if (this.sourceClient) {
      if (this.sourceClient.constructor.name === 'Client') {
        await this.sourceClient.end();
      } else {
        await this.sourceClient.end();
      }
    }
    
    if (this.targetClient) {
      if (this.targetClient.constructor.name === 'Client') {
        await this.targetClient.end();
      } else {
        await this.targetClient.end();
      }
    }
  }

  async testConnection(config) {
    try {
      const client = await this.connectToDatabase(config);
      console.log(`✅ Connexion réussie à ${config.type} (${config.host}:${config.port})`);
      
      if (client.constructor.name === 'Client') {
        await client.end();
      } else {
        await client.end();
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Échec de connexion à ${config.type}:`, error.message);
      return false;
    }
  }
}

// Script principal
async function main() {
  const migrator = new DatabaseMigrator();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'test':
      console.log('🧪 Test des connexions...');
      for (const [name, config] of Object.entries(databases)) {
        console.log(`\n📡 Test de ${name}:`);
        await migrator.testConnection(config);
      }
      break;
      
    case 'migrate':
      const source = args[1];
      const target = args[2];
      
      if (!source || !target || !databases[source] || !databases[target]) {
        console.error('❌ Usage: node migrate-database.js migrate <source> <target>');
        console.error('   Sources/Targets disponibles:', Object.keys(databases).join(', '));
        process.exit(1);
      }
      
      await migrator.migrateData(databases[source], databases[target]);
      break;
      
    default:
      console.log('📖 Usage:');
      console.log('   node migrate-database.js test');
      console.log('   node migrate-database.js migrate <source> <target>');
      console.log('\n📋 Bases disponibles:', Object.keys(databases).join(', '));
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DatabaseMigrator, databases }; 
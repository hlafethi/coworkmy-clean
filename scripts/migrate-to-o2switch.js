import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration O2Switch
const config = {
  host: '109.234.166.71',
  port: 5432,
  database: 'sc2rafi0640_coworkmy',
  user: 'sc2rafi0640_rafi0640',
  password: 'Hla2025Cowork*',
  ssl: false,
};

async function migrateToO2Switch() {
  const pool = new Pool(config);
  
  try {
    console.log('🚀 Début de la migration vers O2Switch PostgreSQL...');
    
    // Test de connexion
    console.log('📡 Test de connexion à la base de données...');
    const client = await pool.connect();
    console.log('✅ Connexion réussie !');
    
    // Lire le script SQL
    const sqlPath = path.join(__dirname, 'migrate-to-o2switch.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📖 Lecture du script de migration...');
    
    // Diviser le script en commandes individuelles
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Exécution de ${commands.length} commandes SQL...`);
    
    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`⏳ Exécution de la commande ${i + 1}/${commands.length}...`);
          await client.query(command);
          console.log(`✅ Commande ${i + 1} exécutée avec succès`);
        } catch (error) {
          console.error(`❌ Erreur lors de l'exécution de la commande ${i + 1}:`, error.message);
          // Continuer avec les autres commandes
        }
      }
    }
    
    // Vérifier que les tables ont été créées
    console.log('🔍 Vérification des tables créées...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Tables créées :');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Vérifier les données de base
    console.log('🔍 Vérification des données de base...');
    
    const adminSettingsResult = await client.query('SELECT key FROM admin_settings');
    console.log(`✅ ${adminSettingsResult.rows.length} paramètres admin créés`);
    
    const profilesResult = await client.query('SELECT email, role FROM profiles');
    console.log(`✅ ${profilesResult.rows.length} profils créés`);
    profilesResult.rows.forEach(profile => {
      console.log(`  - ${profile.email} (${profile.role})`);
    });
    
    const spacesResult = await client.query('SELECT name, capacity, price_per_hour FROM spaces');
    console.log(`✅ ${spacesResult.rows.length} espaces créés`);
    spacesResult.rows.forEach(space => {
      console.log(`  - ${space.name} (${space.capacity} pers., ${space.price_per_hour}€/h)`);
    });
    
    console.log('🎉 Migration terminée avec succès !');
    console.log('');
    console.log('📋 Prochaines étapes :');
    console.log('1. Configurer les clés Stripe dans la table admin_settings');
    console.log('2. Configurer les paramètres email dans la table admin_settings');
    console.log('3. Tester l\'application avec la nouvelle base de données');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter la migration
migrateToO2Switch(); 
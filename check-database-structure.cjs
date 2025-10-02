const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  database: 'coworkmy',
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  ssl: { rejectUnauthorized: false }
});

async function checkDatabase() {
  try {
    console.log('🔍 Vérification de la structure de la base de données...\n');
    
    // Vérifier la structure de la table profiles
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Structure de la table profiles:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Vérifier le nombre d'utilisateurs
    const count = await pool.query('SELECT COUNT(*) FROM profiles');
    console.log(`\n👥 Nombre d'utilisateurs: ${count.rows[0].count}`);
    
    // Vérifier les utilisateurs existants
    const users = await pool.query(`
      SELECT id, email, full_name, avatar_url, logo_url, updated_at 
      FROM profiles 
      ORDER BY updated_at DESC 
      LIMIT 5
    `);
    
    console.log('\n👤 Utilisateurs existants:');
    users.rows.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id})`);
      console.log(`    Nom: ${user.full_name || 'Non défini'}`);
      console.log(`    Avatar: ${user.avatar_url ? 'Oui' : 'Non'}`);
      console.log(`    Logo: ${user.logo_url ? 'Oui' : 'Non'}`);
      console.log(`    Dernière MAJ: ${user.updated_at}`);
      console.log('');
    });
    
    // Vérifier les tables existantes
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Tables existantes:');
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Détails:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();

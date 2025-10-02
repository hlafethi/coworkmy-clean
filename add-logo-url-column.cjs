const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  database: 'coworkmy',
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  ssl: { rejectUnauthorized: false }
});

async function addLogoUrlColumn() {
  try {
    console.log('🔧 Ajout de la colonne logo_url à la table profiles...\n');
    
    // Vérifier si la colonne existe déjà
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'logo_url'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ La colonne logo_url existe déjà');
      return;
    }
    
    // Ajouter la colonne logo_url
    await pool.query(`
      ALTER TABLE profiles 
      ADD COLUMN logo_url TEXT
    `);
    
    console.log('✅ Colonne logo_url ajoutée avec succès');
    
    // Vérifier la nouvelle structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Nouvelle structure de la table profiles:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Détails:', error);
  } finally {
    await pool.end();
  }
}

addLogoUrlColumn();

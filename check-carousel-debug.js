const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  database: 'coworkmy',
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  ssl: false
});

async function checkCarouselTable() {
  try {
    console.log('🔍 Vérification de la table carousel_images...');
    
    // Vérifier la structure de la table
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'carousel_images'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Structure de la table:');
    structure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });
    
    // Vérifier les données
    const data = await pool.query('SELECT * FROM carousel_images ORDER BY id DESC LIMIT 5');
    console.log(`\n📊 Données dans la table (${data.rows.length} lignes):`);
    data.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ID: ${row.id}, is_active: ${row.is_active}, order_index: ${row.order_index}`);
      console.log(`     URL: ${row.image_url ? row.image_url.substring(0, 50) + '...' : 'NULL'}`);
    });
    
    // Test de la requête utilisée par l'API
    const apiQuery = await pool.query('SELECT * FROM carousel_images WHERE is_active = true ORDER BY order_index ASC');
    console.log(`\n🔍 Requête API (is_active = true): ${apiQuery.rows.length} résultats`);
    
    // Test sans filtre is_active
    const allQuery = await pool.query('SELECT * FROM carousel_images ORDER BY order_index ASC');
    console.log(`🔍 Toutes les images: ${allQuery.rows.length} résultats`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

checkCarouselTable();

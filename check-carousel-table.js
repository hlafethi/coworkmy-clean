const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  database: 'coworkmy',
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  ssl: false
});

async function checkTable() {
  try {
    console.log('🔍 Vérification de la table carousel_images...');
    
    const result = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'carousel_images')");
    console.log('Table carousel_images existe:', result.rows[0].exists);
    
    if (!result.rows[0].exists) {
      console.log('📝 Création de la table carousel_images...');
      await pool.query(`
        CREATE TABLE carousel_images (
          id SERIAL PRIMARY KEY,
          image_url TEXT NOT NULL,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('✅ Table carousel_images créée avec succès');
    } else {
      console.log('✅ Table carousel_images existe déjà');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkTable();

const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  database: 'coworkmy',
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  ssl: { rejectUnauthorized: false }
});

async function testSettingsPersistence() {
  try {
    console.log('🔍 Test de persistance des paramètres...');
    
    // Vérifier la table admin_settings
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_settings'
      );
    `);
    
    if (!checkTable.rows[0].exists) {
      console.log('❌ Table admin_settings n\'existe pas');
      return;
    }
    
    console.log('✅ Table admin_settings existe');
    
    // Vérifier les données existantes
    const existingData = await pool.query(`
      SELECT key, value, created_at, updated_at 
      FROM admin_settings 
      ORDER BY updated_at DESC
    `);
    
    console.log('📊 Données existantes dans admin_settings:');
    existingData.rows.forEach(row => {
      console.log(`  - ${row.key}: ${JSON.stringify(row.value).substring(0, 100)}...`);
      console.log(`    Créé: ${row.created_at}, Modifié: ${row.updated_at}`);
    });
    
    // Tester l'insertion de données de test
    console.log('\n🧪 Test d\'insertion de données...');
    
    const testHomepageData = {
      title: "Test Titre",
      description: "Test Description",
      hero_title: "Test Hero Title",
      hero_subtitle: "Test Hero Subtitle",
      hero_background_image: "https://example.com/test.jpg",
      cta_text: "Test CTA",
      features_title: "Test Features",
      is_published: true
    };
    
    // Insérer ou mettre à jour les données de test
    const upsertResult = await pool.query(`
      INSERT INTO admin_settings (key, value, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT (key) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = NOW()
      RETURNING *
    `, ['homepage', JSON.stringify(testHomepageData)]);
    
    console.log('✅ Données de test insérées:', upsertResult.rows[0]);
    
    // Vérifier que les données sont bien là
    const verifyData = await pool.query(`
      SELECT value FROM admin_settings WHERE key = 'homepage'
    `);
    
    if (verifyData.rows.length > 0) {
      const savedData = JSON.parse(verifyData.rows[0].value);
      console.log('✅ Données vérifiées:', savedData);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

testSettingsPersistence();

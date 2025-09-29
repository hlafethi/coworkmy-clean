const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  database: 'coworkmy',
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  ssl: false,
});

async function testSpaceCreation() {
  try {
    console.log('🔍 Test de création d\'espace...');
    
    const client = await pool.connect();
    
    // Simuler les données d'un formulaire d'espace
    const spaceData = {
      name: 'Test Space API',
      description: 'Test Description',
      capacity: 10,
      hourly_price: 15.50,
      daily_price: 80.00,
      half_day_price: 40.00,
      image_url: null,
      is_active: true
    };
    
    console.log('📊 Données à insérer:', spaceData);
    
    // Test d'insertion avec la même requête que l'API
    const result = await client.query(`
      INSERT INTO spaces (name, description, capacity, price_per_hour, price_per_day, price_per_half_day, image_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      spaceData.name,
      spaceData.description,
      spaceData.capacity,
      spaceData.hourly_price,
      spaceData.daily_price,
      spaceData.half_day_price,
      spaceData.image_url,
      spaceData.is_active
    ]);
    
    console.log('✅ Espace créé avec succès:', result.rows[0]);
    
    // Nettoyer le test
    await client.query('DELETE FROM spaces WHERE name = $1', ['Test Space API']);
    console.log('🧹 Test nettoyé');
    
    client.release();
    console.log('✅ Test de création d\'espace réussi');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création d\'espace:', error.message);
    console.error('❌ Détails:', error);
  } finally {
    await pool.end();
  }
}

testSpaceCreation();

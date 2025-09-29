const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  database: 'coworkmy',
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  ssl: false,
});

async function createSpaceDirect() {
  try {
    console.log('🔍 Création directe d\'espace en base...');
    
    const client = await pool.connect();
    
    // Données d'exemple
    const spaceData = {
      name: 'Espace Test Direct',
      description: 'Créé directement en base',
      capacity: 10,
      hourly_price: 15.00,
      daily_price: 80.00,
      half_day_price: 40.00,
      image_url: null,
      is_active: true
    };
    
    console.log('📊 Données à insérer:', spaceData);
    
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
    console.log('🎉 L\'espace est maintenant disponible dans l\'interface admin !');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('❌ Détails:', error);
  } finally {
    await pool.end();
  }
}

createSpaceDirect();

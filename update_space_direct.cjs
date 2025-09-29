const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  database: 'coworkmy',
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  ssl: false,
});

async function updateSpaceDirect() {
  try {
    console.log('🔍 Modification directe d\'espace en base...');
    
    const client = await pool.connect();
    
    // ID de l'espace à modifier
    const spaceId = '5cdadf04-d1aa-4ab0-82b7-b68658b80b1b';
    
    // Nouvelles données
    const updatedData = {
      name: 'Espace Test Direct - MODIFIÉ',
      description: 'Modifié directement en base',
      capacity: 15,
      hourly_price: 20.00,
      daily_price: 100.00,
      half_day_price: 50.00,
      image_url: null,
      is_active: true
    };
    
    console.log('📊 Nouvelles données:', updatedData);
    
    const result = await client.query(`
      UPDATE spaces 
      SET name = $1, description = $2, capacity = $3, price_per_hour = $4, 
          price_per_day = $5, price_per_half_day = $6, image_url = $7, 
          is_active = $8, updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [
      updatedData.name,
      updatedData.description,
      updatedData.capacity,
      updatedData.hourly_price,
      updatedData.daily_price,
      updatedData.half_day_price,
      updatedData.image_url,
      updatedData.is_active,
      spaceId
    ]);
    
    if (result.rows.length > 0) {
      console.log('✅ Espace modifié avec succès:', result.rows[0]);
      console.log('🎉 L\'espace est maintenant modifié dans l\'interface admin !');
    } else {
      console.log('❌ Espace non trouvé');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('❌ Détails:', error);
  } finally {
    await pool.end();
  }
}

updateSpaceDirect();

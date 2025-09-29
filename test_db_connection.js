const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'postgres',
  database: 'coworkmy',
  port: 5432,
});

async function testConnection() {
  try {
    console.log('🔍 Test de connexion à la base de données...');
    
    // Test de connexion
    const client = await pool.connect();
    console.log('✅ Connexion réussie');
    
    // Vérifier la structure de la table spaces
    console.log('🔍 Vérification de la structure de la table spaces...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'spaces' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Colonnes de la table spaces:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Test d'insertion simple
    console.log('🔍 Test d\'insertion simple...');
    const insertResult = await client.query(`
      INSERT INTO spaces (name, description, capacity, price_per_hour, price_per_day, price_per_half_day, image_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name
    `, ['Test Space', 'Test Description', 5, 10.00, 50.00, 25.00, null, true]);
    
    console.log('✅ Insertion réussie:', insertResult.rows[0]);
    
    // Nettoyer le test
    await client.query('DELETE FROM spaces WHERE name = $1', ['Test Space']);
    console.log('🧹 Test nettoyé');
    
    client.release();
    console.log('✅ Tous les tests sont passés');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('❌ Détails:', error);
  } finally {
    await pool.end();
  }
}

testConnection();

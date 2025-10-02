import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  database: 'coworkmy',
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  ssl: { rejectUnauthorized: false }
});

async function fixSupportTables() {
  try {
    console.log('🔧 Correction de la structure des tables support...');

    // Vérifier la structure actuelle
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'support_tickets' AND column_name = 'user_id'
    `);
    
    console.log('📊 Structure actuelle user_id:', columns.rows);

    // Si user_id est de type UUID, le changer en INTEGER
    if (columns.rows.length > 0 && columns.rows[0].data_type === 'uuid') {
      console.log('🔄 Conversion de user_id de UUID vers INTEGER...');
      
      // Supprimer la contrainte de clé étrangère si elle existe
      await pool.query(`
        ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_user_id_fkey
      `);
      
      // Changer le type de colonne
      await pool.query(`
        ALTER TABLE support_tickets ALTER COLUMN user_id TYPE INTEGER USING user_id::text::integer
      `);
      
      console.log('✅ user_id converti en INTEGER');
    }

    // Vérifier la nouvelle structure
    const newColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'support_tickets' AND column_name = 'user_id'
    `);
    
    console.log('📊 Nouvelle structure user_id:', newColumns.rows);

    // Tester une requête
    const testResult = await pool.query(`
      SELECT * FROM support_tickets WHERE user_id = $1 LIMIT 1
    `, [2]);
    
    console.log('✅ Test de requête réussi:', testResult.rows.length, 'tickets trouvés');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

fixSupportTables();

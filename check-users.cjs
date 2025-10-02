const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  database: 'coworkmy',
  ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
  try {
    console.log('🔍 Vérification des utilisateurs...\n');
    
    // Vérifier les tables existantes
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tables disponibles:');
    tablesResult.rows.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // Chercher une table d'utilisateurs
    const userTables = tablesResult.rows.filter(t => 
      t.table_name.includes('user') || 
      t.table_name.includes('profile') ||
      t.table_name.includes('auth')
    );
    
    if (userTables.length > 0) {
      console.log('\n👥 Tables d\'utilisateurs trouvées:');
      userTables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
      
    // Essayer de récupérer des données de la table profiles
    if (userTables.some(t => t.table_name === 'profiles')) {
      console.log(`\n🔍 Contenu de la table profiles:`);
      
      const result = await pool.query(`SELECT id, email, first_name, last_name FROM profiles LIMIT 5`);
      console.log('Colonnes:', Object.keys(result.rows[0] || {}));
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}.`, {
          id: row.id,
          email: row.email,
          name: `${row.first_name} ${row.last_name}`
        });
      });
    }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
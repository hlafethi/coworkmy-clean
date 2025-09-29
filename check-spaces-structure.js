const { Client } = require('pg');

const client = new Client({
  host: '147.93.58.155',
  port: 5432,
  database: 'coworkmy',
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  ssl: false,
});

async function checkSpacesTable() {
  try {
    await client.connect();
    console.log('Connexion a la base de donnees...');
    
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'spaces' 
      ORDER BY ordinal_position
    `);
    
    console.log('Colonnes de la table spaces:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    await client.end();
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

checkSpacesTable();

const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  database: 'coworkmy',
  ssl: { rejectUnauthorized: false }
});

async function checkProfileDocumentsStructure() {
  let client;
  try {
    client = await pool.connect();
    console.log('🔍 Vérification de la structure de la table profile_documents...\n');

    // 1. Vérifier la structure de la table
    console.log('1️⃣ Structure de la table profile_documents:');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'profile_documents' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Colonnes trouvées:');
    columnsResult.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable === 'YES' ? 'YES' : 'NO'} - Default: ${col.column_default}`);
    });
    console.log('\n');

    // 2. Vérifier si la colonne document_type existe
    const documentTypeColumn = columnsResult.rows.find(col => col.column_name === 'document_type');
    if (documentTypeColumn) {
      console.log('✅ Colonne document_type trouvée:', documentTypeColumn);
    } else {
      console.log('❌ Colonne document_type NON trouvée !');
    }
    console.log('\n');

    // 3. Vérifier les données dans la table
    console.log('2️⃣ Données dans la table profile_documents:');
    const dataResult = await client.query(`
      SELECT id, file_name, document_type, upload_date
      FROM profile_documents
      ORDER BY upload_date DESC
      LIMIT 5
    `);
    
    console.log('📋 Derniers documents:');
    dataResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.file_name}`);
      console.log(`   - ID: ${row.id}`);
      console.log(`   - document_type: ${row.document_type} (${typeof row.document_type})`);
      console.log(`   - upload_date: ${row.upload_date}`);
      console.log('\n');
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

checkProfileDocumentsStructure();

const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  database: 'coworkmy',
  ssl: { rejectUnauthorized: false }
});

async function testSqlDebug() {
  try {
    console.log('🔍 Test de debug de la requête SQL...\n');
    
    const userId = 'f6682b18-7d10-4016-be08-885e989cffca';
    
    // Test 1: Requête exacte de l'API
    console.log('1️⃣ Test de la requête exacte de l\'API:');
    const apiResult = await pool.query(
      'SELECT id, file_name, file_type, file_size, upload_date, file_path, document_type FROM profile_documents WHERE user_id = $1 ORDER BY upload_date DESC',
      [userId]
    );
    
    console.log('📊 Résultats:', apiResult.rows.length);
    apiResult.rows.forEach((doc, index) => {
      console.log(`Document ${index}:`, {
        id: doc.id,
        file_name: doc.file_name,
        document_type: doc.document_type,
        has_document_type: 'document_type' in doc,
        keys: Object.keys(doc)
      });
    });
    
    // Test 2: Requête avec SELECT *
    console.log('\n2️⃣ Test avec SELECT *:');
    const allResult = await pool.query(
      'SELECT * FROM profile_documents WHERE user_id = $1 ORDER BY upload_date DESC LIMIT 1',
      [userId]
    );
    
    if (allResult.rows.length > 0) {
      const doc = allResult.rows[0];
      console.log('📋 Toutes les colonnes:', Object.keys(doc));
      console.log('🔍 document_type:', doc.document_type);
      console.log('🔍 Type de document_type:', typeof doc.document_type);
    }
    
    // Test 3: Vérifier spécifiquement la colonne document_type
    console.log('\n3️⃣ Test spécifique de la colonne document_type:');
    const typeResult = await pool.query(
      'SELECT document_type FROM profile_documents WHERE user_id = $1 ORDER BY upload_date DESC',
      [userId]
    );
    
    console.log('📊 Types de documents:');
    typeResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. document_type: ${row.document_type} (${typeof row.document_type})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

testSqlDebug();

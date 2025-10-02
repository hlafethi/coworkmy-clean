const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  database: 'coworkmy',
  ssl: { rejectUnauthorized: false }
});

async function testSqlDirect() {
  try {
    console.log('🔍 Test direct de la requête SQL utilisée par l\'API...\n');
    
    const userId = 'f6682b18-7d10-4016-be08-885e989cffca';
    
    // Utiliser exactement la même requête que l'API
    const result = await pool.query(
      'SELECT id, file_name, file_type, file_size, upload_date, file_path, document_type FROM profile_documents WHERE user_id = $1 ORDER BY upload_date DESC',
      [userId]
    );
    
    console.log('📊 Nombre de documents:', result.rows.length);
    console.log('📋 Documents retournés:');
    
    result.rows.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.file_name}`);
      console.log(`   - ID: ${doc.id}`);
      console.log(`   - document_type: ${doc.document_type} (${typeof doc.document_type})`);
      console.log(`   - upload_date: ${doc.upload_date}`);
      console.log(`   - file_path length: ${doc.file_path ? doc.file_path.length : 0}`);
      console.log('');
    });
    
    // Vérifier spécifiquement le document avec "identity"
    const identityDoc = result.rows.find(doc => doc.file_name === 'test-identity-manual.pdf');
    if (identityDoc) {
      console.log('✅ Document "identity" trouvé:');
      console.log(`   - document_type: ${identityDoc.document_type}`);
      console.log(`   - Type: ${typeof identityDoc.document_type}`);
    } else {
      console.log('❌ Document "identity" non trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

testSqlDirect();

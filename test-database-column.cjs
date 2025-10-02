const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  database: 'coworkmy',
  ssl: { rejectUnauthorized: false }
});

async function testDatabaseColumn() {
  try {
    console.log('🔍 Test de la colonne document_type...\n');
    
    // 1. Vérifier la structure de la table
    console.log('1️⃣ Structure de la table profile_documents:');
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'profile_documents'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colonnes trouvées:');
    structureResult.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable} - Default: ${col.column_default}`);
    });
    
    // 2. Tester la requête exacte utilisée par l'API
    console.log('\n2️⃣ Test de la requête API:');
    const apiResult = await pool.query(
      'SELECT id, file_name, file_type, file_size, upload_date, file_path, document_type FROM profile_documents WHERE user_id = $1 ORDER BY upload_date DESC',
      ['f6682b18-7d10-4016-be08-885e989cffca']
    );
    
    console.log('📋 Résultats de la requête API:');
    apiResult.rows.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.file_name} - document_type: ${doc.document_type} (${typeof doc.document_type})`);
    });
    
    // 3. Vérifier spécifiquement le document que nous avons inséré avec "identity"
    console.log('\n3️⃣ Vérification du document test:');
    const testDocResult = await pool.query(
      'SELECT id, file_name, document_type FROM profile_documents WHERE file_name = $1',
      ['test-identity-manual.pdf']
    );
    
    if (testDocResult.rows.length > 0) {
      const testDoc = testDocResult.rows[0];
      console.log('🔍 Document test trouvé:', {
        id: testDoc.id,
        file_name: testDoc.file_name,
        document_type: testDoc.document_type,
        document_type_type: typeof testDoc.document_type
      });
    } else {
      console.log('❌ Document test non trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabaseColumn();

const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  database: 'coworkmy',
  ssl: { rejectUnauthorized: false }
});

async function insertTestDocument() {
  try {
    console.log('🔍 Insertion d\'un document de test avec type "identity"...\n');
    
    // Utiliser l'ID de l'utilisateur existant
    const userId = 'f6682b18-7d10-4016-be08-885e989cffca';
    
    // Simuler un fichier PDF en base64 (très petit)
    const testBase64 = 'JVBERi0xLjQKJcOkw7zDtsO8CjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovVHlwZSAvUGFnZQo+PgpzdHJlYW0K';
    
    const result = await pool.query(`
      INSERT INTO profile_documents 
      (user_id, file_name, file_type, file_size, file_path, document_type, scan_status, scan_details)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, file_name, document_type, upload_date
    `, [
      userId,
      'test-identity-manual.pdf',
      'application/pdf',
      100,
      testBase64,
      'identity', // Type spécifique
      'clean',
      JSON.stringify({ status: 'clean', scanner: 'Manual' })
    ]);
    
    console.log('✅ Document inséré avec succès:');
    console.log('📄 ID:', result.rows[0].id);
    console.log('📄 Nom:', result.rows[0].file_name);
    console.log('📄 Type:', result.rows[0].document_type);
    console.log('📄 Date:', result.rows[0].upload_date);
    
    // Vérifier que le document a bien été inséré
    console.log('\n🔍 Vérification en base de données...');
    const checkResult = await pool.query(`
      SELECT id, file_name, document_type, upload_date 
      FROM profile_documents 
      WHERE user_id = $1 
      ORDER BY upload_date DESC 
      LIMIT 3
    `, [userId]);
    
    console.log('📋 Derniers documents:');
    checkResult.rows.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.file_name} - Type: ${doc.document_type}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

insertTestDocument();

const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  database: 'coworkmy',
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  ssl: { rejectUnauthorized: false }
});

async function testPersistence() {
  try {
    console.log('🧪 Test de persistance des données...\n');
    
    // Récupérer les utilisateurs avec leurs avatars et logos
    const users = await pool.query(`
      SELECT id, email, full_name, avatar_url, logo_url, updated_at 
      FROM profiles 
      ORDER BY updated_at DESC 
      LIMIT 5
    `);
    
    console.log('👤 Utilisateurs avec leurs données:');
    users.rows.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id})`);
      console.log(`    Nom: ${user.full_name || 'Non défini'}`);
      console.log(`    Avatar: ${user.avatar_url ? 'Oui (URL: ' + user.avatar_url.substring(0, 50) + '...)' : 'Non'}`);
      console.log(`    Logo: ${user.logo_url ? 'Oui (URL: ' + user.logo_url.substring(0, 50) + '...)' : 'Non'}`);
      console.log(`    Dernière MAJ: ${user.updated_at}`);
      console.log('');
    });
    
    // Test de mise à jour d'un utilisateur
    console.log('🔄 Test de mise à jour...');
    const testUserId = users.rows[0]?.id;
    if (testUserId) {
      const testAvatarUrl = 'data:image/png;base64,test-avatar-data';
      const testLogoUrl = 'data:image/png;base64,test-logo-data';
      
      await pool.query(`
        UPDATE profiles 
        SET avatar_url = $1, logo_url = $2, updated_at = NOW() 
        WHERE id = $3
      `, [testAvatarUrl, testLogoUrl, testUserId]);
      
      console.log(`✅ Mise à jour test effectuée pour l'utilisateur ${testUserId}`);
      
      // Vérifier la mise à jour
      const updatedUser = await pool.query(`
        SELECT avatar_url, logo_url, updated_at 
        FROM profiles 
        WHERE id = $1
      `, [testUserId]);
      
      if (updatedUser.rows.length > 0) {
        const user = updatedUser.rows[0];
        console.log(`✅ Vérification - Avatar: ${user.avatar_url ? 'Oui' : 'Non'}, Logo: ${user.logo_url ? 'Oui' : 'Non'}`);
        console.log(`✅ Dernière MAJ: ${user.updated_at}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Détails:', error);
  } finally {
    await pool.end();
  }
}

testPersistence();

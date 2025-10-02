const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  database: 'coworkmy',
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  ssl: { rejectUnauthorized: false }
});

async function checkProfileData() {
  try {
    console.log('🔍 Vérification des données de profil en base...\n');
    
    // Récupérer l'utilisateur user@heleam.com
    const result = await pool.query(`
      SELECT id, email, full_name, avatar_url, logo_url, updated_at 
      FROM profiles 
      WHERE email = 'user@heleam.com'
    `);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('👤 Utilisateur trouvé:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nom: ${user.full_name}`);
      console.log(`   Avatar: ${user.avatar_url || 'Non défini'}`);
      console.log(`   Logo: ${user.logo_url || 'Non défini'}`);
      console.log(`   Dernière MAJ: ${user.updated_at}`);
      
      // Test de mise à jour directe
      console.log('\n🧪 Test de mise à jour directe...');
      const testAvatarUrl = 'data:image/png;base64,test-direct-update';
      const testLogoUrl = 'data:image/png;base64,test-direct-logo';
      
      const updateResult = await pool.query(`
        UPDATE profiles 
        SET avatar_url = $1, logo_url = $2, updated_at = NOW() 
        WHERE id = $3 
        RETURNING avatar_url, logo_url, updated_at
      `, [testAvatarUrl, testLogoUrl, user.id]);
      
      if (updateResult.rows.length > 0) {
        const updated = updateResult.rows[0];
        console.log('✅ Mise à jour directe réussie:');
        console.log(`   Avatar: ${updated.avatar_url}`);
        console.log(`   Logo: ${updated.logo_url}`);
        console.log(`   Dernière MAJ: ${updated.updated_at}`);
        
        // Vérification finale
        const finalResult = await pool.query(`
          SELECT avatar_url, logo_url, updated_at 
          FROM profiles 
          WHERE id = $1
        `, [user.id]);
        
        if (finalResult.rows.length > 0) {
          const final = finalResult.rows[0];
          console.log('\n✅ Vérification finale:');
          console.log(`   Avatar: ${final.avatar_url}`);
          console.log(`   Logo: ${final.logo_url}`);
          console.log(`   Dernière MAJ: ${final.updated_at}`);
        }
      }
      
    } else {
      console.log('❌ Utilisateur non trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkProfileData();

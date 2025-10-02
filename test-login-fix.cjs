const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  database: 'coworkmy',
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  ssl: { rejectUnauthorized: false }
});

async function testLoginFix() {
  try {
    console.log('🧪 Test de la correction de connexion...\n');
    
    // Simuler la connexion de user@heleam.com
    const email = 'user@heleam.com';
    const password = 'user123';
    
    console.log(`🔍 Recherche de l'utilisateur: ${email}`);
    
    const result = await pool.query(
      'SELECT id, email, full_name, first_name, last_name, is_admin FROM profiles WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ Utilisateur non trouvé en base de données');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ Utilisateur trouvé:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nom: ${user.full_name}`);
    console.log(`   Admin: ${user.is_admin}`);
    
    // Test de l'endpoint /api/users/:id avec le bon UUID
    console.log('\n🔍 Test de l\'endpoint /api/users/:id...');
    
    const fetch = require('node-fetch');
    
    // D'abord, obtenir un token de connexion
    const loginResponse = await fetch('http://localhost:5000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (loginData.success) {
      console.log('✅ Connexion réussie');
      console.log(`   Token reçu: ${loginData.token ? 'Oui' : 'Non'}`);
      console.log(`   ID utilisateur: ${loginData.user.id}`);
      
      // Tester l'endpoint /api/users/:id
      const profileResponse = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });
      
      const profileData = await profileResponse.json();
      
      if (profileData.success) {
        console.log('✅ Profil utilisateur récupéré avec succès');
        console.log(`   Données: ${JSON.stringify(profileData.data, null, 2)}`);
      } else {
        console.log('❌ Erreur lors de la récupération du profil:', profileData.error);
      }
    } else {
      console.log('❌ Erreur de connexion:', loginData.error);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

testLoginFix();

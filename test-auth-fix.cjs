const http = require('http');

async function testAuth() {
  try {
    console.log('🧪 Test de la correction d\'authentification...\n');
    
    // Test de connexion
    const loginData = JSON.stringify({
      email: 'user@heleam.com',
      password: 'user123'
    });
    
    const loginOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/signin',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    console.log('🔍 Test de connexion...');
    
    const loginResponse = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.write(loginData);
      req.end();
    });
    
    if (loginResponse.success) {
      console.log('✅ Connexion réussie');
      console.log(`   Réponse complète:`, JSON.stringify(loginResponse, null, 2));
      
      const user = loginResponse.data.user;
      const token = loginResponse.data.token;
      
      if (user) {
        console.log(`   ID utilisateur: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Admin: ${user.is_admin}`);
      }
      console.log(`   Token: ${token ? 'Oui' : 'Non'}`);
      
      // Test de récupération du profil
      console.log('\n🔍 Test de récupération du profil...');
      
      const profileOptions = {
        hostname: 'localhost',
        port: 5000,
        path: `/api/users/${user.id}`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const profileResponse = await new Promise((resolve, reject) => {
        const req = http.request(profileOptions, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.end();
      });
      
      if (profileResponse.success) {
        console.log('✅ Profil récupéré avec succès');
        console.log(`   ID: ${profileResponse.data.id}`);
        console.log(`   Email: ${profileResponse.data.email}`);
        console.log(`   Nom: ${profileResponse.data.full_name}`);
        console.log(`   Avatar: ${profileResponse.data.avatar_url ? 'Oui' : 'Non'}`);
        console.log(`   Logo: ${profileResponse.data.logo_url ? 'Oui' : 'Non'}`);
      } else {
        console.log('❌ Erreur lors de la récupération du profil:', profileResponse.error);
      }
      
    } else {
      console.log('❌ Erreur de connexion:', loginResponse.error);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testAuth();

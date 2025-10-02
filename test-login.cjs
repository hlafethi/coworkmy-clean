const http = require('http');

// Fonction pour faire une requête HTTP
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testLogin() {
  try {
    console.log('🔍 Test de connexion...\n');

    const passwords = ['password123', 'password', '123456', 'admin', 'heleam'];
    
    for (const password of passwords) {
      console.log(`🔑 Test avec le mot de passe: ${password}`);
      
      const loginData = {
        email: 'user@heleam.com',
        password: password
      };

      const loginResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/signin',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, JSON.stringify(loginData));

      console.log('📥 Réponse:', {
        success: loginResponse.data.success,
        error: loginResponse.data.error
      });

      if (loginResponse.data.success) {
        console.log('✅ SUCCÈS! Mot de passe correct:', password);
        console.log('👤 Utilisateur:', loginResponse.data.data.user);
        return;
      }
    }
    
    console.log('❌ Aucun mot de passe ne fonctionne');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testLogin();

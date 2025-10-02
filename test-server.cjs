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

async function testServer() {
  try {
    console.log('🔍 Test du serveur...\n');

    // Test d'un endpoint simple
    console.log('1️⃣ Test endpoint de santé...');
    const healthResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });

    console.log('📥 Réponse santé:', {
      status: healthResponse.status,
      data: healthResponse.data
    });

    // Test de l'endpoint de connexion avec des données vides
    console.log('\n2️⃣ Test endpoint de connexion...');
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/signin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({}));

    console.log('📥 Réponse connexion:', {
      status: loginResponse.status,
      success: loginResponse.data.success,
      error: loginResponse.data.error
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testServer();

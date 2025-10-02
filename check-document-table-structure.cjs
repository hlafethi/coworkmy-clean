const http = require('http');

// Vérifier la structure de la table profile_documents
function checkTableStructure() {
  // 1. Se connecter en tant qu'admin
  const loginData = JSON.stringify({
    email: 'admin@heleam.com',
    password: 'admin123'
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

  console.log('🔑 Connexion admin...');

  const req = http.request(loginOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.success && response.data && response.data.token) {
          console.log('✅ Admin connecté');
          checkTableStructureWithToken(response.data.token);
        } else {
          console.log('❌ Échec de la connexion admin:', response.error);
        }
      } catch (e) {
        console.log('❌ Erreur parsing JSON:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Erreur requête login:', e.message);
  });

  req.write(loginData);
  req.end();
}

function checkTableStructureWithToken(token) {
  // Utiliser l'endpoint de debug pour vérifier la structure
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/debug/check-table-structure',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  console.log('\n🔍 Vérification de la structure de la table...');

  const req = http.request(options, (res) => {
    console.log(`📡 Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          console.log('✅ Structure de la table:');
          console.log(JSON.stringify(response, null, 2));
        } else {
          console.log('⚠️ Endpoint de debug non disponible, vérification manuelle...');
          console.log('📋 Vérifiez manuellement dans la base de données:');
          console.log('   SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = \'profile_documents\';');
        }
      } catch (e) {
        console.log('❌ Erreur parsing JSON:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Erreur requête:', e.message);
  });

  req.end();
}

checkTableStructure();

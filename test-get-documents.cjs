const http = require('http');

const API_BASE_URL = 'http://localhost:5000/api';
const USER_ID = 'f6682b18-7d10-4016-be08-885e989cffca';

async function makeApiRequest(method, path, token = null, body = null) {
  const url = new URL(`${API_BASE_URL}${path}`);
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  if (body) {
    options.body = JSON.stringify(body);
  }

  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ status: res.statusCode, ...parsedData });
        } catch (e) {
          reject(new Error(`Erreur de parsing JSON: ${e.message}, Data: ${data}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Erreur de connexion: ${e.message}`));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testGetDocuments() {
  try {
    console.log('🔍 Test de l\'endpoint GET /api/users/:id/documents...\n');

    // 1. D'abord, se connecter pour obtenir un token
    console.log('1️⃣ Connexion pour obtenir un token...');
    const loginResponse = await makeApiRequest('POST', '/auth/signin', null, {
      email: 'user@heleam.com',
      password: 'Fethi@2025!'
    });

    if (!loginResponse.success) {
      console.log('❌ Échec de la connexion:', loginResponse.error);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Connexion réussie, token obtenu');

    // 2. Tester l'endpoint GET /api/users/:id/documents
    console.log('\n2️⃣ Test de l\'endpoint GET /api/users/:id/documents...');
    const documentsResponse = await makeApiRequest('GET', `/users/${USER_ID}/documents`, token);

    console.log('📊 Statut de la réponse:', documentsResponse.status);
    console.log('📊 Succès:', documentsResponse.success);
    
    if (documentsResponse.success && Array.isArray(documentsResponse.data)) {
      console.log('📋 Nombre de documents:', documentsResponse.data.length);
      console.log('📋 Documents retournés:');
      documentsResponse.data.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.file_name}`);
        console.log(`   - ID: ${doc.id}`);
        console.log(`   - document_type: ${doc.document_type} (${typeof doc.document_type})`);
        console.log(`   - upload_date: ${doc.upload_date}`);
        console.log(`   - file_path length: ${doc.file_path ? doc.file_path.length : 0}`);
        console.log('\n');
      });
    } else {
      console.log('❌ Erreur ou format de réponse inattendu:', documentsResponse.error || documentsResponse);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testGetDocuments();

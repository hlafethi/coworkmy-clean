const http = require('http');

const API_BASE_URL = 'http://localhost:5000/api';
const USER_ID = 'f6682b18-7d10-4016-be08-885e989cffca';

// Token valide généré
const VALID_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImY2NjgyYjE4LTdkMTAtNDAxNi1iZTA4LTg4NWU5ODljZmZjYSIsImVtYWlsIjoidXNlckBoZWxlYW0uY29tIiwiaXNfYWRtaW4iOmZhbHNlLCJpYXQiOjE3NTk0MDA3NDIsImV4cCI6MTc1OTQ4NzE0Mn0.QgFuzk-QiFMNSk2_pqwzNi1Mw4pIxSxEVycYNDwstX0';

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

async function testEndpointDebug() {
  try {
    console.log('🔍 Test de l\'endpoint GET /api/users/:id/documents avec debug...\n');

    // Tester l'endpoint GET /api/users/:id/documents
    console.log('1️⃣ Test de l\'endpoint GET /api/users/:id/documents...');
    console.log('🔍 URL:', `${API_BASE_URL}/users/${USER_ID}/documents`);
    console.log('🔍 Token:', VALID_TOKEN.substring(0, 50) + '...');
    
    const documentsResponse = await makeApiRequest('GET', `/users/${USER_ID}/documents`, VALID_TOKEN);

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

testEndpointDebug();

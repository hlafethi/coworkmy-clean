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

async function testApiResponse() {
  try {
    console.log('🔍 Test de la réponse API pour les documents...\n');

    // Test direct de l'endpoint GET
    console.log('1️⃣ Test direct de l\'endpoint GET...');
    
    const getResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/users/f6682b18-7d10-4016-be08-885e989cffca/documents',
      method: 'GET',
      headers: { 
        'Authorization': 'Bearer test-token' // Token factice pour le test
      }
    });

    console.log('📥 Réponse GET:', {
      status: getResponse.status,
      success: getResponse.data.success,
      error: getResponse.data.error
    });

    if (getResponse.data.success && getResponse.data.data) {
      console.log('📋 Documents retournés:', getResponse.data.data.length);
      
      if (getResponse.data.data.length > 0) {
        const firstDoc = getResponse.data.data[0];
        console.log('🔍 Premier document:', {
          id: firstDoc.id,
          file_name: firstDoc.file_name,
          document_type: firstDoc.document_type,
          upload_date: firstDoc.upload_date
        });
        
        console.log('🔍 Toutes les propriétés:', Object.keys(firstDoc));
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testApiResponse();

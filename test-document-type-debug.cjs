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

async function testDocumentTypeDebug() {
  try {
    console.log('🔍 Test de debug du document_type...\n');

    // Test avec différents types de document_type
    const testCases = [
      { document_type: 'identity', description: 'Type identity' },
      { document_type: 'address_proof', description: 'Type address_proof' },
      { document_type: '', description: 'Chaîne vide' },
      { document_type: null, description: 'null' },
      { document_type: undefined, description: 'undefined' }
    ];

    for (const testCase of testCases) {
      console.log(`\n🧪 Test: ${testCase.description}`);
      
      const uploadData = {
        file_name: `test-${testCase.document_type || 'undefined'}.pdf`,
        file_type: 'application/pdf',
        file_size: 100,
        file_content: 'JVBERi0xLjQKJcOkw7zDtsO8CjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovVHlwZSAvUGFnZQo+PgpzdHJlYW0K',
        document_type: testCase.document_type
      };

      console.log('📤 Données envoyées:', {
        document_type: uploadData.document_type,
        document_type_type: typeof uploadData.document_type
      });

      const uploadResponse = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/users/f6682b18-7d10-4016-be08-885e989cffca/documents',
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // Token factice pour le test
        }
      }, JSON.stringify(uploadData));

      console.log('📥 Réponse:', {
        success: uploadResponse.data.success,
        document_type: uploadResponse.data.data?.document_type,
        error: uploadResponse.data.error
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testDocumentTypeDebug();

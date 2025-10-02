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

async function testDocumentTypeUpload() {
  try {
    console.log('🔍 Test du type de document lors de l\'upload...\n');

    // 1. Se connecter en tant qu'utilisateur
    console.log('1️⃣ Connexion utilisateur...');
    const loginData = {
      email: 'user@heleam.com',
      password: 'password123'
    };

    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/signin',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify(loginData));

    if (!loginResponse.data.success) {
      throw new Error('Échec de la connexion: ' + loginResponse.data.error);
    }

    const token = loginResponse.data.data.token;
    const userId = loginResponse.data.data.user.id;
    console.log('✅ Connecté en tant qu\'utilisateur:', userId);

    // 2. Créer un document de test avec un type spécifique
    console.log('\n2️⃣ Upload d\'un document avec type "identity"...');
    
    // Simuler un fichier PDF en base64 (très petit)
    const testBase64 = 'JVBERi0xLjQKJcOkw7zDtsO8CjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovVHlwZSAvUGFnZQo+PgpzdHJlYW0K';
    
    const uploadData = {
      file_name: 'test-identity.pdf',
      file_type: 'application/pdf',
      file_size: 100,
      file_content: testBase64,
      document_type: 'identity' // Type spécifique
    };

    console.log('📤 Données d\'upload:', {
      file_name: uploadData.file_name,
      file_type: uploadData.file_type,
      document_type: uploadData.document_type
    });

    const uploadResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/users/${userId}/documents`,
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, JSON.stringify(uploadData));

    console.log('📥 Réponse upload:', {
      success: uploadResponse.data.success,
      document_type: uploadResponse.data.data?.document_type,
      id: uploadResponse.data.data?.id
    });

    if (!uploadResponse.data.success) {
      throw new Error('Échec de l\'upload: ' + uploadResponse.data.error);
    }

    const documentId = uploadResponse.data.data.id;

    // 3. Récupérer les documents pour vérifier le type
    console.log('\n3️⃣ Vérification du type de document...');
    
    const getResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/users/${userId}/documents`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('📋 Documents récupérés:', getResponse.data.length);
    
    if (getResponse.data.length > 0) {
      const latestDoc = getResponse.data[0];
      console.log('🔍 Dernier document:', {
        id: latestDoc.id,
        file_name: latestDoc.file_name,
        document_type: latestDoc.document_type,
        upload_date: latestDoc.upload_date
      });

      if (latestDoc.document_type === 'identity') {
        console.log('✅ SUCCÈS: Le type de document est correctement sauvegardé!');
      } else {
        console.log('❌ PROBLÈME: Le type de document n\'est pas correct:', latestDoc.document_type);
      }
    } else {
      console.log('❌ Aucun document trouvé');
    }

    // 4. Nettoyer - supprimer le document de test
    console.log('\n4️⃣ Nettoyage...');
    const deleteResponse = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/users/${userId}/documents/${documentId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (deleteResponse.data.success) {
      console.log('✅ Document de test supprimé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testDocumentTypeUpload();

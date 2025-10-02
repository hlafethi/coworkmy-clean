const http = require('http');

// Test pour vérifier que la correction fonctionne après un nouvel upload
function testFixAfterUpload() {
  // 1. Se connecter en tant qu'utilisateur
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

  console.log('🔑 Connexion utilisateur...');

  const req = http.request(loginOptions, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.success && response.data && response.data.token) {
          console.log('✅ Utilisateur connecté');
          testUploadWithFix(response.data.token);
        } else {
          console.log('❌ Échec de la connexion utilisateur:', response.error);
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

function testUploadWithFix(token) {
  const userId = 'f6682b18-7d10-4016-be08-885e989cffca';
  
  // Créer un fichier de test simple
  const testContent = 'Test document après correction du document_type';
  const base64Content = Buffer.from(testContent).toString('base64');
  
  const uploadData = JSON.stringify({
    file_name: 'test-fix-document-type.txt',
    file_type: 'text/plain',
    file_size: testContent.length,
    file_content: base64Content,
    document_type: 'address_proof' // Type spécifique pour le test
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/users/${userId}/documents`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(uploadData)
    }
  };

  console.log('\n📤 Test d\'upload après correction...');
  console.log('📊 Données envoyées:', {
    file_name: 'test-fix-document-type.txt',
    file_type: 'text/plain',
    file_size: testContent.length,
    document_type: 'address_proof'
  });

  const req = http.request(options, (res) => {
    console.log(`📡 Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.success && response.data) {
          console.log('✅ Document uploadé avec succès !');
          console.log('📄 Document créé:', response.data);
          console.log(`🏷️ Type de document: "${response.data.document_type}"`);
          
          if (response.data.document_type === 'address_proof') {
            console.log('🎉 SUCCÈS: Le type de document est correctement sauvegardé !');
          } else {
            console.log('❌ PROBLÈME: Le type de document n\'est pas correctement sauvegardé');
            console.log(`   Attendu: "address_proof", Reçu: "${response.data.document_type}"`);
          }
          
          // Vérifier en récupérant tous les documents
          setTimeout(() => {
            verifyAllDocuments(token, userId);
          }, 1000);
        } else {
          console.log('❌ Échec de l\'upload:', response.error);
        }
      } catch (e) {
        console.log('❌ Erreur parsing JSON:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Erreur requête:', e.message);
  });

  req.write(uploadData);
  req.end();
}

function verifyAllDocuments(token, userId) {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/users/${userId}/documents`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  console.log('\n🔍 Vérification de tous les documents...');

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.success && response.data && response.data.length > 0) {
          console.log('✅ Documents récupérés !');
          console.log(`📄 Nombre de documents: ${response.data.length}`);
          
          console.log('\n🏷️ Test de tous les document_type:');
          let allHaveDocumentType = true;
          response.data.forEach((doc, index) => {
            const hasDocumentType = doc.document_type !== undefined && doc.document_type !== null;
            console.log(`   ${index + 1}. ${doc.file_name}: document_type = "${doc.document_type}" (${typeof doc.document_type}) ${hasDocumentType ? '✅' : '❌'}`);
            if (!hasDocumentType) {
              allHaveDocumentType = false;
            }
          });
          
          if (allHaveDocumentType) {
            console.log('\n🎉 SUCCÈS COMPLET: Tous les documents ont maintenant un document_type !');
            console.log('✅ Les types de document devraient maintenant s\'afficher correctement dans l\'interface admin');
            console.log('✅ Les boutons "Voir" et "Télécharger" devraient maintenant être activés');
            console.log('✅ Les dates devraient maintenant s\'afficher en heure française');
          } else {
            console.log('\n❌ PROBLÈME: Certains documents n\'ont toujours pas de document_type');
            console.log('💡 Solution: Redémarrer le serveur pour appliquer les corrections');
          }
        } else {
          console.log('⚠️ Aucun document trouvé');
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

testFixAfterUpload();

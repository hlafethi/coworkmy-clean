const http = require('http');

// Corriger le problème de la colonne document_type
function fixDocumentTypeColumn() {
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
          addDocumentTypeColumn(response.data.token);
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

function addDocumentTypeColumn(token) {
  // Utiliser l'endpoint de debug pour ajouter la colonne
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/debug/add-document-type-column',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  console.log('\n🔧 Tentative d\'ajout de la colonne document_type...');

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
          console.log('✅ Colonne ajoutée:', response);
        } else {
          console.log('⚠️ Endpoint de debug non disponible');
          console.log('📋 Correction manuelle nécessaire:');
          console.log('   ALTER TABLE profile_documents ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT \'other\';');
          console.log('   UPDATE profile_documents SET document_type = \'other\' WHERE document_type IS NULL;');
          
          // Test direct pour voir si la colonne existe
          testColumnExists(token);
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

function testColumnExists(token) {
  const userId = 'f6682b18-7d10-4016-be08-885e989cffca';
  
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

  console.log('\n🔍 Test de récupération après correction...');

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
          
          console.log('\n🏷️ Test du document_type après correction:');
          response.data.forEach((doc, index) => {
            console.log(`   ${index + 1}. ${doc.file_name}: document_type = "${doc.document_type}" (${typeof doc.document_type})`);
          });
          
          // Vérifier si le problème est résolu
          const hasDocumentType = response.data.some(doc => doc.document_type !== undefined);
          if (hasDocumentType) {
            console.log('🎉 SUCCÈS: Le document_type est maintenant disponible !');
          } else {
            console.log('❌ PROBLÈME: Le document_type n\'est toujours pas disponible');
            console.log('💡 Solution: Ajouter manuellement la colonne dans la base de données');
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

fixDocumentTypeColumn();

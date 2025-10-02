const http = require('http');

// Debug pour comprendre le problème du type de document
function debugDocumentType() {
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
          debugDocumentsData(response.data.token);
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

function debugDocumentsData(token) {
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

  console.log('\n🔍 Debug des données des documents...');

  const req = http.request(options, (res) => {
    console.log(`📡 Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.success && response.data && response.data.length > 0) {
          console.log('✅ Documents trouvés !');
          console.log(`📄 Nombre de documents: ${response.data.length}`);
          
          console.log('\n🔍 Analyse détaillée des documents:');
          response.data.forEach((doc, index) => {
            console.log(`\n📄 Document ${index + 1}: ${doc.file_name}`);
            console.log('   📊 Toutes les propriétés:');
            Object.keys(doc).forEach(key => {
              const value = doc[key];
              console.log(`     - ${key}: ${value}`);
            });
            
            console.log('\n   🏷️ Test du type de document:');
            console.log(`     - document_type: "${doc.document_type}"`);
            console.log(`     - Type affiché: ${getDocumentTypeDisplay(doc.document_type)}`);
          });
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

function getDocumentTypeDisplay(documentType) {
  const DOCUMENT_TYPES = {
    identity: 'Pièce d\'identité',
    address_proof: 'Justificatif de domicile',
    income_proof: 'Justificatif de revenus',
    bank_statement: 'Relevé bancaire',
    insurance: 'Assurance',
    contract: 'Contrat',
    invoice: 'Facture',
    other: 'Autre'
  };
  
  return DOCUMENT_TYPES[documentType] || 'Autre';
}

debugDocumentType();

const http = require('http');

// Exécuter le script SQL de correction
function executeSqlFix() {
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
          executeSqlScript(response.data.token);
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

function executeSqlScript(token) {
  // Utiliser l'endpoint de debug pour exécuter le SQL
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/debug/execute-sql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const sqlScript = `
    -- Vérifier si la colonne document_type existe et l'ajouter si nécessaire
    DO $$
    BEGIN
        -- Vérifier si la colonne document_type existe
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'profile_documents' 
            AND column_name = 'document_type'
        ) THEN
            -- Ajouter la colonne document_type
            ALTER TABLE profile_documents 
            ADD COLUMN document_type VARCHAR(50) DEFAULT 'other';
            
            RAISE NOTICE 'Colonne document_type ajoutée à la table profile_documents';
        ELSE
            RAISE NOTICE 'Colonne document_type existe déjà';
        END IF;
    END $$;

    -- Mettre à jour les documents existants qui ont document_type NULL
    UPDATE profile_documents 
    SET document_type = 'other' 
    WHERE document_type IS NULL;
  `;

  const requestData = JSON.stringify({
    sql: sqlScript
  });

  console.log('\n🔧 Exécution du script SQL de correction...');

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
          console.log('✅ Script SQL exécuté:', response);
        } else {
          console.log('⚠️ Endpoint de debug non disponible');
          console.log('📋 Correction manuelle nécessaire:');
          console.log('   Exécuter le fichier fix-document-type-table.sql dans la base de données');
        }
        
        // Tester après correction
        testAfterFix(token);
      } catch (e) {
        console.log('❌ Erreur parsing JSON:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Erreur requête:', e.message);
  });

  req.write(requestData);
  req.end();
}

function testAfterFix(token) {
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

  console.log('\n🔍 Test après correction...');

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
            console.log('✅ Les types de document devraient maintenant s\'afficher correctement dans l\'interface admin');
          } else {
            console.log('❌ PROBLÈME: Le document_type n\'est toujours pas disponible');
            console.log('💡 Solution: Exécuter manuellement le script SQL dans la base de données');
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

executeSqlFix();

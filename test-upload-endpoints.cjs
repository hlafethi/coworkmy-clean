const http = require('http');

async function testUploadEndpoints() {
  try {
    console.log('🧪 Test des endpoints d\'upload...\n');
    
    // 1. Connexion pour obtenir un token
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
    
    console.log('🔍 Connexion...');
    const loginResponse = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.write(loginData);
      req.end();
    });
    
    if (!loginResponse.success) {
      console.log('❌ Erreur de connexion:', loginResponse.error);
      return;
    }
    
    const user = loginResponse.data.user;
    const token = loginResponse.data.token;
    console.log('✅ Connexion réussie, ID:', user.id);
    
    // 2. Test upload avatar
    console.log('\n🔍 Test upload avatar...');
    const avatarData = JSON.stringify({
      avatar_url: 'data:image/png;base64,test-avatar-data-123'
    });
    
    const avatarOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/upload/avatar',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(avatarData)
      }
    };
    
    const avatarResponse = await new Promise((resolve, reject) => {
      const req = http.request(avatarOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.write(avatarData);
      req.end();
    });
    
    if (avatarResponse.success) {
      console.log('✅ Avatar uploadé avec succès');
      console.log(`   Avatar URL: ${avatarResponse.data.avatar_url}`);
    } else {
      console.log('❌ Erreur upload avatar:', avatarResponse.error);
    }
    
    // 3. Test upload logo
    console.log('\n🔍 Test upload logo...');
    const logoData = JSON.stringify({
      logo_url: 'data:image/png;base64,test-logo-data-456'
    });
    
    const logoOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/upload/logo',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(logoData)
      }
    };
    
    const logoResponse = await new Promise((resolve, reject) => {
      const req = http.request(logoOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.write(logoData);
      req.end();
    });
    
    if (logoResponse.success) {
      console.log('✅ Logo uploadé avec succès');
      console.log(`   Logo URL: ${logoResponse.data.logo_url}`);
    } else {
      console.log('❌ Erreur upload logo:', logoResponse.error);
    }
    
    // 4. Vérification du profil final
    console.log('\n🔍 Vérification du profil final...');
    const profileOptions = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/users/${user.id}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const profileResponse = await new Promise((resolve, reject) => {
      const req = http.request(profileOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.end();
    });
    
    if (profileResponse.success) {
      console.log('✅ Profil récupéré avec succès');
      console.log(`   Avatar: ${profileResponse.data.avatar_url ? 'Oui' : 'Non'}`);
      console.log(`   Logo: ${profileResponse.data.logo_url ? 'Oui' : 'Non'}`);
    } else {
      console.log('❌ Erreur récupération profil:', profileResponse.error);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testUploadEndpoints();

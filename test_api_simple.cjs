const http = require('http');

const postData = JSON.stringify({
  name: 'Test API Space',
  description: 'Test Description',
  capacity: 5,
  hourly_price: 10,
  daily_price: 50,
  half_day_price: 25,
  image_url: null,
  is_active: true
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/spaces',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImIxNGE2YzhmLWFhN2ItNGNlOC1hMjViLTZkMWQyM2VlNGM2MyIsImlhdCI6MTczNTQ2NzQ5MywiZXhwIjoxNzM1NTUzODkzfQ.8K8Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q'
  }
};

console.log('🔍 Test de l\'endpoint POST /api/spaces...');
console.log('📊 Données envoyées:', postData);

const req = http.request(options, (res) => {
  console.log('📊 Status:', res.statusCode);
  console.log('📊 Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📊 Response:', data);
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Endpoint fonctionne');
    } else {
      console.log('❌ Erreur endpoint:', res.statusCode);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erreur requête:', e.message);
});

req.write(postData);
req.end();

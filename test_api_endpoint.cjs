const fetch = require('node-fetch');

async function testAPIEndpoint() {
  try {
    console.log('🔍 Test de l\'endpoint POST /api/spaces...');
    
    // Simuler une requête POST vers l'API
    const response = await fetch('http://localhost:5000/api/spaces', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImIxNGE2YzhmLWFhN2ItNGNlOC1hMjViLTZkMWQyM2VlNGM2MyIsImlhdCI6MTczNTQ2NzQ5MywiZXhwIjoxNzM1NTUzODkzfQ.8K8Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q9Q' // Token d'exemple
      },
      body: JSON.stringify({
        name: 'Test API Space',
        description: 'Test Description',
        capacity: 5,
        hourly_price: 10.00,
        daily_price: 50.00,
        half_day_price: 25.00,
        image_url: null,
        is_active: true
      })
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', response.headers.raw());
    
    const data = await response.text();
    console.log('📊 Response:', data);
    
    if (response.ok) {
      console.log('✅ Endpoint fonctionne');
    } else {
      console.log('❌ Erreur endpoint:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test de l\'endpoint:', error.message);
  }
}

testAPIEndpoint();

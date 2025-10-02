// Script pour tester l'API des espaces
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testSpacesAPI() {
  try {
    console.log('🧪 Test de l\'API des espaces...');
    
    // 1. Tester l'endpoint /api/spaces/active
    console.log('\n1. Test GET /api/spaces/active...');
    const activeResponse = await fetch(`${API_BASE}/api/spaces/active`);
    const activeData = await activeResponse.json();
    
    console.log('📊 Statut:', activeResponse.status);
    console.log('📊 Réponse:', JSON.stringify(activeData, null, 2));
    
    if (activeData.success && activeData.data) {
      console.log(`✅ ${activeData.data.length} espace(s) actif(s) trouvé(s)`);
      activeData.data.forEach((space, index) => {
        console.log(`  ${index + 1}. ${space.name}`);
        console.log(`     - ID: ${space.id}`);
        console.log(`     - Actif: ${space.is_active}`);
        console.log(`     - Type de tarif: ${space.pricing_type}`);
        console.log(`     - Prix horaire: ${space.hourly_price}€`);
        console.log(`     - Prix journalier: ${space.daily_price}€`);
        console.log(`     - Prix mensuel: ${space.monthly_price}€`);
      });
    } else {
      console.log('❌ Erreur ou pas de données');
    }
    
    // 2. Tester l'endpoint /api/spaces (admin)
    console.log('\n2. Test GET /api/spaces (admin)...');
    const allResponse = await fetch(`${API_BASE}/api/spaces`);
    const allData = await allResponse.json();
    
    console.log('📊 Statut:', allResponse.status);
    console.log('📊 Réponse:', JSON.stringify(allData, null, 2));
    
    if (allData.success && allData.data) {
      console.log(`✅ ${allData.data.length} espace(s) total trouvé(s)`);
    } else {
      console.log('❌ Erreur ou pas de données');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testSpacesAPI();

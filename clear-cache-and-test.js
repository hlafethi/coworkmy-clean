// Script pour tester les espaces après nettoyage du cache
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testSpacesAfterCacheClear() {
  try {
    console.log('🧹 Test des espaces après nettoyage du cache...');
    
    // 1. Tester l'endpoint /api/spaces/active
    console.log('\n1. Test GET /api/spaces/active...');
    const activeResponse = await fetch(`${API_BASE}/api/spaces/active`);
    const activeData = await activeResponse.json();
    
    console.log('📊 Statut:', activeResponse.status);
    console.log('📊 Nombre d\'espaces actifs:', activeData.data?.length || 0);
    
    if (activeData.success && activeData.data) {
      console.log('✅ Espaces actifs trouvés:');
      activeData.data.forEach((space, index) => {
        console.log(`  ${index + 1}. ${space.name}`);
        console.log(`     - Actif: ${space.is_active}`);
        console.log(`     - Type: ${space.pricing_type}`);
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
    console.log('📊 Nombre total d\'espaces:', allData.data?.length || 0);
    
    if (allData.success && allData.data) {
      const activeCount = allData.data.filter(s => s.is_active).length;
      const inactiveCount = allData.data.filter(s => !s.is_active).length;
      console.log(`✅ Espaces actifs: ${activeCount}, Inactifs: ${inactiveCount}`);
    }
    
    console.log('\n🎯 Résumé:');
    console.log(`- Espaces actifs disponibles: ${activeData.data?.length || 0}`);
    console.log(`- Total des espaces: ${allData.data?.length || 0}`);
    console.log(`- Différence: ${(allData.data?.length || 0) - (activeData.data?.length || 0)} espaces inactifs`);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testSpacesAfterCacheClear();

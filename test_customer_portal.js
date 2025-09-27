// Test direct de la fonction Edge create-customer-portal
async function testCustomerPortal() {
  console.log('🧪 Test direct de la fonction create-customer-portal...\n');

  try {
    const response = await fetch('https://exffryodynkyizbeesbt.functions.supabase.co/create-customer-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerEmail: 'contact@evengard.fr',
        returnUrl: 'http://localhost:5173/dashboard',
        isAdmin: false
      })
    });

    console.log(`📊 Statut HTTP: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Fonction Edge fonctionne correctement:');
      console.log('📋 Données reçues:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Erreur de la fonction Edge:');
      console.log('📋 Erreur:', errorText);
    }
  } catch (error) {
    console.log('❌ Erreur lors du test:', error.message);
  }
}

testCustomerPortal(); 
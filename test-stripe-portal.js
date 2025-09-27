// Script de test pour le portail client Stripe
// À exécuter dans la console du navigateur sur la page dashboard

console.log('🧪 Test du portail client Stripe...');

// Récupérer le token d'authentification
const token = localStorage.getItem('coworkmy-auth-token');
if (!token) {
  console.error('❌ Token d\'authentification non trouvé');
  console.log('💡 Assure-toi d\'être connecté à l\'application');
} else {
  console.log('✅ Token d\'authentification trouvé');
}

// Test de la fonction Edge
async function testStripePortal() {
  try {
    console.log('🚀 Appel de la fonction Edge create-customer-portal...');
    
    const response = await fetch('https://exffryodynkyizbeesbt.functions.supabase.co/create-customer-portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        customerEmail: 'contact@evengard.fr',
        returnUrl: window.location.origin + '/dashboard',
        isAdmin: false
      })
    });

    console.log('📊 Statut de la réponse:', response.status);
    console.log('📋 Headers de la réponse:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Succès ! Données reçues:', data);
      
      if (data.url) {
        console.log('🔗 URL du portail:', data.url);
        console.log('💡 Tu peux maintenant ouvrir le portail client Stripe');
        
        // Optionnel : ouvrir automatiquement le portail
        const shouldOpen = confirm('Voulez-vous ouvrir le portail client Stripe maintenant ?');
        if (shouldOpen) {
          window.open(data.url, '_blank');
        }
      }
    } else {
      const errorData = await response.json();
      console.error('❌ Erreur:', errorData);
      console.log('🔍 Détails de l\'erreur:', errorData.details || 'Aucun détail');
    }
  } catch (error) {
    console.error('💥 Erreur lors du test:', error);
  }
}

// Exécuter le test
testStripePortal();

console.log('📝 Instructions:');
console.log('1. Vérifie les logs ci-dessus pour voir le résultat du test');
console.log('2. Si le test réussit, le portail client Stripe fonctionne correctement');
console.log('3. Si il y a une erreur, vérifie les détails dans les logs'); 
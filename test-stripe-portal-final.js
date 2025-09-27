// Script de test final pour le portail Stripe
// Copie dans la console du navigateur

const SUPABASE_URL = 'https://exffryodynkyizbeesbt.functions.supabase.co';

async function testStripePortalFinal() {
  console.log('🧪 Test final du portail Stripe');
  console.log('================================');
  
  // Récupérer le token d'authentification avec la même logique que l'application
  let authToken = null;
  const possibleKeys = [
    'coworkmy-auth-token',
    'coworkmy-auth-session',
    'sb-exffryodynkyizbeesbt-auth-token',
    'supabase.auth.token',
    'supabase.auth.session'
  ];
  
  console.log('🔍 Recherche du token d\'authentification...');
  
  for (const key of possibleKeys) {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        let parsed = JSON.parse(data);
        
        // Si c'est un tableau (caractères), essayer de parser une deuxième fois
        if (Array.isArray(parsed)) {
          const jsonString = parsed.join('');
          parsed = JSON.parse(jsonString);
        }
        // Si c'est une chaîne, essayer de parser une deuxième fois
        else if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        
        if (parsed.access_token) {
          authToken = parsed.access_token;
          console.log('✅ Token trouvé avec la clé:', key);
          break;
        }
      } catch (e) {
        console.log('❌ Erreur parsing pour la clé:', key);
      }
    }
  }
  
  if (!authToken) {
    console.log('❌ Aucun token d\'authentification trouvé');
    console.log('💡 Assurez-vous d\'être connecté à l\'application');
    return;
  }
  
  console.log('🔐 Token d\'authentification récupéré');
  console.log('Token (premiers caractères):', authToken.substring(0, 20) + '...');
  
  try {
    console.log('📡 Appel de la fonction Edge...');
    
    const response = await fetch(`${SUPABASE_URL}/create-customer-portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        customerEmail: 'contact@evengard.fr',
        returnUrl: 'http://localhost:5173/dashboard',
        isAdmin: false
      })
    });

    console.log('📊 Status HTTP:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📄 Réponse complète:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('🎉 SUCCÈS ! Portail Stripe fonctionne parfaitement !');
      console.log('🔗 URL du portail:', data.url);
      console.log('🎯 Mode:', data.mode);
      console.log('👤 Customer ID:', data.customerId);
      
      // Optionnel : ouvrir le portail
      if (confirm('Voulez-vous ouvrir le portail client Stripe ?')) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      }
    } else {
      console.log('❌ ERREUR:', data.error);
      if (data.details) {
        console.log('📝 Détails:', data.details);
      }
    }
  } catch (error) {
    console.error('💥 Erreur réseau:', error.message);
  }
  
  console.log('\n✅ Test terminé');
}

// Instructions
console.log('📋 Instructions:');
console.log('1. Assurez-vous d\'être connecté à l\'application');
console.log('2. Exécutez: testStripePortalFinal()');
console.log('3. Vérifiez les résultats ci-dessus');
console.log('');

// Exposer la fonction globalement
if (typeof window !== 'undefined') {
  window.testStripePortalFinal = testStripePortalFinal;
  console.log('🚀 Fonction testStripePortalFinal() disponible dans la console');
} 
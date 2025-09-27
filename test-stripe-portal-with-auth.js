// Script de test avec authentification pour la fonction Edge Stripe
const SUPABASE_URL = 'https://exffryodynkyizbeesbt.functions.supabase.co';
const FUNCTION_NAME = 'create-customer-portal';

// Fonction pour récupérer le token depuis localStorage (simulation du navigateur)
function getAuthToken() {
  const possibleKeys = [
    'coworkmy-auth-token',
    'coworkmy-auth-session',
    'sb-exffryodynkyizbeesbt-auth-token',
    'supabase.auth.token',
    'supabase.auth.session'
  ];
  
  for (const key of possibleKeys) {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        let parsed = JSON.parse(data);
        
        if (Array.isArray(parsed)) {
          const jsonString = parsed.join('');
          parsed = JSON.parse(jsonString);
        } else if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        
        if (parsed.access_token) {
          return parsed.access_token;
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    }
  }
  
  return null;
}

async function testStripePortalWithAuth() {
  console.log('🧪 Test de la fonction Edge Stripe avec authentification');
  console.log('=====================================================');

  // Récupérer le token d'authentification
  const authToken = getAuthToken();
  
  if (!authToken) {
    console.log('❌ Aucun token d\'authentification trouvé dans localStorage');
    console.log('💡 Connectez-vous d\'abord à l\'application pour obtenir un token');
    return;
  }

  console.log('✅ Token d\'authentification trouvé');
  console.log('Token (premiers caractères):', authToken.substring(0, 20) + '...');

  // Test avec authentification
  console.log('\n🔐 Test avec authentification:');
  try {
    const response = await fetch(`${SUPABASE_URL}/${FUNCTION_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        customerEmail: 'test@example.com',
        returnUrl: 'https://canard-cowork.space/dashboard',
        isAdmin: false
      })
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response:', text);
    
    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log('✅ Réponse JSON valide:', data);
      } catch (parseError) {
        console.error('❌ Réponse non-JSON:', text);
      }
    } else {
      console.error('❌ Erreur HTTP:', response.status);
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
  }

  console.log('\n✅ Test terminé');
}

// Instructions pour l'utilisateur
console.log('📋 Instructions:');
console.log('1. Ouvrez votre application React dans le navigateur');
console.log('2. Connectez-vous avec un compte utilisateur');
console.log('3. Ouvrez la console développeur (F12)');
console.log('4. Copiez et collez ce script dans la console');
console.log('5. Ou exécutez: testStripePortalWithAuth()');
console.log('');

// Exposer la fonction globalement pour l'exécution manuelle
if (typeof window !== 'undefined') {
  window.testStripePortalWithAuth = testStripePortalWithAuth;
  console.log('🚀 Fonction testStripePortalWithAuth() disponible dans la console');
}

// Exécuter automatiquement si pas dans un navigateur
if (typeof window === 'undefined') {
  console.log('⚠️ Ce script doit être exécuté dans un navigateur avec localStorage');
  console.log('💡 Copiez ce script dans la console de votre navigateur');
} 
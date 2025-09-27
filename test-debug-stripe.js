// Script pour tester la fonction de debug Stripe
const SUPABASE_URL = 'https://exffryodynkyizbeesbt.functions.supabase.co';

async function debugStripeConfig() {
  console.log('🔧 Debug de la configuration Stripe');
  console.log('==================================');

  try {
    const response = await fetch(`${SUPABASE_URL}/debug-stripe-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Status:', response.status);
    
    const data = await response.json();
    console.log('Réponse complète:', JSON.stringify(data, null, 2));

    // Analyse des résultats
    if (data.jsonStatus === 'VALID_JSON') {
      console.log('✅ Configuration Stripe valide');
      console.log('Mode:', data.parsedConfig?.mode);
      console.log('Test key présente:', !!data.parsedConfig?.test_secret_key);
    } else if (data.fixAttempted && data.fixResult?.success) {
      console.log('✅ Configuration Stripe corrigée automatiquement');
      console.log('Nouvelle configuration:', data.fixResult.data);
    } else {
      console.log('❌ Configuration Stripe nécessite une correction manuelle');
      console.log('Status JSON:', data.jsonStatus);
      console.log('Erreur parsing:', data.parseError);
    }

  } catch (error) {
    console.error('❌ Erreur lors du debug:', error.message);
  }

  console.log('\n✅ Debug terminé');
}

// Instructions
console.log('📋 Instructions:');
console.log('1. Exécutez: debugStripeConfig()');
console.log('2. Vérifiez les résultats ci-dessus');
console.log('3. Si la configuration est corrigée, testez le portail Stripe');
console.log('');

// Exposer la fonction globalement
if (typeof window !== 'undefined') {
  window.debugStripeConfig = debugStripeConfig;
  console.log('🚀 Fonction debugStripeConfig() disponible dans la console');
}

// Exécuter automatiquement si pas dans un navigateur
if (typeof window === 'undefined') {
  console.log('⚠️ Ce script doit être exécuté dans un navigateur');
  console.log('💡 Copiez ce script dans la console de votre navigateur');
} 
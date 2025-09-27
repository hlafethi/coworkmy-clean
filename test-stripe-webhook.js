// Script de test pour vérifier le webhook Stripe
// À exécuter dans la console du navigateur

console.log('🧪 Test du webhook Stripe...');

// Test de l'endpoint webhook sans authentification
async function testStripeWebhook() {
  try {
    console.log('🚀 Test de l\'endpoint webhook Stripe...');
    
    // Test 1: Appel OPTIONS (CORS preflight)
    console.log('1️⃣ Test CORS preflight (OPTIONS)...');
    const optionsResponse = await fetch('https://exffryodynkyizbeesbt.functions.supabase.co/stripe-webhook', {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Statut OPTIONS:', optionsResponse.status);
    console.log('📋 Headers OPTIONS:', Object.fromEntries(optionsResponse.headers.entries()));
    
    // Test 2: Appel POST sans signature (doit retourner 400)
    console.log('\n2️⃣ Test POST sans signature Stripe...');
    const postResponse = await fetch('https://exffryodynkyizbeesbt.functions.supabase.co/stripe-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'test.event',
        data: { object: { id: 'test' } }
      })
    });
    
    console.log('📊 Statut POST sans signature:', postResponse.status);
    const postText = await postResponse.text();
    console.log('📋 Réponse POST sans signature:', postText);
    
    // Test 3: Appel POST avec signature invalide (doit retourner 400)
    console.log('\n3️⃣ Test POST avec signature invalide...');
    const invalidSignatureResponse = await fetch('https://exffryodynkyizbeesbt.functions.supabase.co/stripe-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'invalid_signature'
      },
      body: JSON.stringify({
        type: 'test.event',
        data: { object: { id: 'test' } }
      })
    });
    
    console.log('📊 Statut POST signature invalide:', invalidSignatureResponse.status);
    const invalidSignatureText = await invalidSignatureResponse.text();
    console.log('📋 Réponse POST signature invalide:', invalidSignatureText);
    
    // Analyse des résultats
    console.log('\n📊 Analyse des résultats:');
    
    if (optionsResponse.status === 200) {
      console.log('✅ CORS preflight fonctionne correctement');
    } else {
      console.log('❌ CORS preflight ne fonctionne pas');
    }
    
    if (postResponse.status === 400) {
      console.log('✅ Rejet correct des requêtes sans signature Stripe');
    } else {
      console.log('❌ Problème: requête sans signature acceptée');
    }
    
    if (invalidSignatureResponse.status === 400) {
      console.log('✅ Rejet correct des signatures invalides');
    } else {
      console.log('❌ Problème: signature invalide acceptée');
    }
    
    console.log('\n🎯 Conclusion:');
    if (optionsResponse.status === 200 && postResponse.status === 400 && invalidSignatureResponse.status === 400) {
      console.log('✅ Le webhook Stripe est correctement configuré !');
      console.log('💡 Stripe peut maintenant envoyer des webhooks sans erreur 401');
    } else {
      console.log('❌ Il y a encore des problèmes avec la configuration du webhook');
    }
    
  } catch (error) {
    console.error('💥 Erreur lors du test:', error);
  }
}

// Test de simulation d'un webhook Stripe valide
function simulateStripeWebhook() {
  console.log('\n🔧 Simulation d\'un webhook Stripe valide...');
  
  const webhookEvent = {
    id: 'evt_test_' + Date.now(),
    object: 'event',
    api_version: '2023-10-16',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_test_' + Date.now(),
        object: 'checkout.session',
        amount_total: 5000,
        currency: 'eur',
        customer_email: 'test@example.com',
        metadata: {
          booking_id: 'test-booking-' + Date.now()
        },
        payment_status: 'paid',
        status: 'complete'
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: 'req_test_' + Date.now(),
      idempotency_key: null
    },
    type: 'checkout.session.completed'
  };
  
  console.log('📋 Événement simulé:', webhookEvent);
  console.log('💡 Note: Ceci est juste une simulation. Seul Stripe peut envoyer des webhooks valides.');
}

// Instructions pour tester dans Stripe Dashboard
function showStripeDashboardInstructions() {
  console.log('\n📋 Instructions pour tester dans le Dashboard Stripe:');
  console.log('1. Va sur dashboard.stripe.com');
  console.log('2. Développeurs > Webhooks');
  console.log('3. Clique sur ton endpoint /stripe-webhook');
  console.log('4. Clique sur "Renvoyer l\'événement"');
  console.log('5. Vérifie que le statut passe à "Success"');
  console.log('6. Vérifie les logs dans Supabase Dashboard > Functions > stripe-webhook');
}

// Exécuter les tests
console.log('🧪 Démarrage des tests du webhook Stripe...');
console.log('==========================================');

testStripeWebhook();
simulateStripeWebhook();
showStripeDashboardInstructions();

console.log('\n📝 Résumé:');
console.log('- Le webhook ne doit plus retourner d\'erreur 401');
console.log('- Il doit accepter les requêtes avec signature Stripe valide');
console.log('- Il doit rejeter les requêtes sans signature ou avec signature invalide');
console.log('- Teste maintenant dans le Dashboard Stripe pour confirmer'); 
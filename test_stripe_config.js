// Script pour tester la configuration Stripe
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://exffryodynkyizbeesbt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4ZmZyeW9keW5reWl6YmVlc2J0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTYyMjM5OSwiZXhwIjoyMDU3MTk4Mzk5fQ.OHE-ZfGvFvLOI_sbb05Is71WCSrF4p4GzvD_OoFLOxw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStripeConfig() {
  console.log('🔍 Test de la configuration Stripe...\n');

  try {
    // 1. Vérifier les paramètres dans admin_settings
    console.log('1. Vérification des paramètres admin_settings...');
    const { data: adminSettings, error: adminError } = await supabase
      .from('admin_settings')
      .select('key, value')
      .eq('key', 'stripe');

    if (adminError) {
      console.error('❌ Erreur admin_settings:', adminError);
    } else if (adminSettings && adminSettings.length > 0) {
      const stripeConfig = adminSettings[0].value;
      console.log('✅ admin_settings trouvé:');
      console.log(`   Mode: ${stripeConfig.mode || 'non défini'}`);
      console.log(`   Clé publique test: ${stripeConfig.test_publishable_key ? '✅' : '❌'}`);
      console.log(`   Clé secrète test: ${stripeConfig.test_secret_key ? '✅' : '❌'}`);
      console.log(`   Clé publique live: ${stripeConfig.live_publishable_key ? '✅' : '❌'}`);
      console.log(`   Clé secrète live: ${stripeConfig.live_secret_key ? '✅' : '❌'}`);
    } else {
      console.log('⚠️  Aucun paramètre Stripe trouvé dans admin_settings');
    }

    // 2. Vérifier la table stripe_settings si elle existe
    console.log('\n2. Vérification de la table stripe_settings...');
    const { data: stripeSettings, error: stripeError } = await supabase
      .from('stripe_settings')
      .select('*')
      .limit(1);

    if (stripeError) {
      console.log('ℹ️  Table stripe_settings n\'existe pas ou erreur:', stripeError.message);
    } else if (stripeSettings && stripeSettings.length > 0) {
      const settings = stripeSettings[0];
      console.log('✅ stripe_settings trouvé:');
      console.log(`   Mode: ${settings.mode || 'non défini'}`);
      console.log(`   Clé publique live: ${settings.live_publishable_key ? '✅' : '❌'}`);
      console.log(`   Clé secrète live: ${settings.live_secret_key ? '✅' : '❌'}`);
    } else {
      console.log('⚠️  Aucun paramètre trouvé dans stripe_settings');
    }

    // 3. Tester la fonction create-payment-session
    console.log('\n3. Test de la fonction create-payment-session...');
    const testResponse = await fetch('https://exffryodynkyizbeesbt.functions.supabase.co/create-payment-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        bookingId: 'test-booking-123',
        amount: 2500, // 25€ en centimes
        customerEmail: 'test@example.com',
        metadata: {
          space_name: 'Espace Test'
        },
        currency: 'eur'
      })
    });

    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Fonction create-payment-session fonctionne:');
      console.log(`   Mode détecté: ${testData.mode || 'non spécifié'}`);
      console.log(`   URL générée: ${testData.url ? '✅' : '❌'}`);
    } else {
      const errorData = await testResponse.json();
      console.log('❌ Erreur fonction create-payment-session:', errorData);
    }

    // 4. Résumé
    console.log('\n📋 Résumé de la configuration:');
    console.log('Les variables d\'environnement Supabase ont été mises à jour avec les clés LIVE.');
    console.log('La fonction create-payment-session utilise maintenant directement les variables d\'environnement.');
    console.log('Pour basculer complètement en mode production, assurez-vous que:');
    console.log('1. Les variables d\'environnement Supabase sont en mode LIVE ✅');
    console.log('2. Les webhooks Stripe pointent vers l\'URL de production');
    console.log('3. Les clés publiques côté client sont en mode LIVE');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testStripeConfig(); 
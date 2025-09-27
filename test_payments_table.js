const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase
const supabaseUrl = 'https://exffryodynkyizbeesbt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4ZmZyeW9keW5reWl6YmVlc2J0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzE5NzI5MCwiZXhwIjoyMDUyNzczMjkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPaymentsTable() {
  console.log('🔍 Test de la table payments...\n');

  try {
    // 1. Vérifier la structure de la table
    console.log('1️⃣ Vérification de la structure de la table payments...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('payments')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('❌ Erreur lors de l\'accès à la table payments:', tableError);
      return;
    }

    console.log('✅ Table payments accessible');
    if (tableInfo && tableInfo.length > 0) {
      console.log('📋 Colonnes disponibles:', Object.keys(tableInfo[0]));
    }

    // 2. Rechercher les paiements pour l'email
    console.log('\n2️⃣ Recherche des paiements pour contact@evengard.fr...');
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_email', 'contact@evengard.fr')
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.log('❌ Erreur lors de la recherche des paiements:', paymentsError);
      return;
    }

    console.log(`📊 ${payments?.length || 0} paiement(s) trouvé(s) pour contact@evengard.fr`);
    
    if (payments && payments.length > 0) {
      payments.forEach((payment, index) => {
        console.log(`\n💰 Paiement ${index + 1}:`);
        console.log(`   ID: ${payment.id}`);
        console.log(`   Montant: ${payment.amount} ${payment.currency}`);
        console.log(`   Statut: ${payment.status}`);
        console.log(`   Mode: ${payment.mode}`);
        console.log(`   Session Stripe: ${payment.stripe_session_id || 'Non renseigné'}`);
        console.log(`   Client Stripe: ${payment.stripe_customer_id || 'Non renseigné'}`);
        console.log(`   Date: ${payment.created_at}`);
      });
    } else {
      console.log('⚠️  Aucun paiement trouvé pour cet email');
    }

    // 3. Lister tous les paiements récents
    console.log('\n3️⃣ Liste des 5 derniers paiements...');
    const { data: recentPayments, error: recentError } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.log('❌ Erreur lors de la récupération des paiements récents:', recentError);
      return;
    }

    console.log(`📊 ${recentPayments?.length || 0} paiement(s) récent(s) trouvé(s)`);
    
    if (recentPayments && recentPayments.length > 0) {
      recentPayments.forEach((payment, index) => {
        console.log(`\n💰 Paiement récent ${index + 1}:`);
        console.log(`   Email: ${payment.user_email}`);
        console.log(`   Montant: ${payment.amount} ${payment.currency}`);
        console.log(`   Mode: ${payment.mode}`);
        console.log(`   Session: ${payment.stripe_session_id || 'Non renseigné'}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

testPaymentsTable(); 
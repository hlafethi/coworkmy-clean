// =====================================================
// DEBUG REACT UPSERT - TEST MANUEL
// =====================================================

// Copie ce code dans la console du navigateur (F12)
// pour tester l'upsert manuellement

async function testUpsert() {
  console.log('🧪 Test d\'upsert manuel...');
  
  try {
    // Récupérer le client Supabase
    const { supabase } = await import('/src/integrations/supabase/client.ts');
    
    // Données de test pour l'espace "test"
    const testData = {
      space_id: 'f5259ce9-0f7c-407f-a730-88b9820c60a9',
      event_type: 'MANUAL_SYNC',
      payload: {
        space_id: 'f5259ce9-0f7c-407f-a730-88b9820c60a9',
        space_name: 'test',
        pricing_type: 'hourly',
        manual_sync: true,
        timestamp: new Date().toISOString()
      },
      status: 'pending'
    };
    
    console.log('📤 Tentative d\'upsert avec:', testData);
    
    // Test 1: Upsert simple
    const { data, error } = await supabase
      .from('stripe_sync_queue')
      .upsert(testData, { onConflict: ['space_id', 'event_type'] });
    
    if (error) {
      console.error('❌ Erreur upsert:', error);
      return { success: false, error };
    }
    
    console.log('✅ Upsert réussi:', data);
    return { success: true, data };
    
  } catch (err) {
    console.error('❌ Erreur générale:', err);
    return { success: false, error: err };
  }
}

// Fonction pour vérifier l'état actuel de la table
async function checkCurrentState() {
  console.log('🔍 Vérification de l\'état actuel...');
  
  try {
    const { supabase } = await import('/src/integrations/supabase/client.ts');
    
    // Vérifier les jobs pour l'espace test
    const { data: jobs, error } = await supabase
      .from('stripe_sync_queue')
      .select('*')
      .eq('space_id', 'f5259ce9-0f7c-407f-a730-88b9820c60a9');
    
    if (error) {
      console.error('❌ Erreur récupération jobs:', error);
      return;
    }
    
    console.log('📋 Jobs actuels pour l\'espace test:', jobs);
    console.log('📊 Nombre de jobs:', jobs?.length || 0);
    
    // Vérifier les doublons
    const jobCounts = {};
    jobs?.forEach(job => {
      const key = `${job.space_id}-${job.event_type}`;
      jobCounts[key] = (jobCounts[key] || 0) + 1;
    });
    
    console.log('🔍 Comptage par clé:', jobCounts);
    
  } catch (err) {
    console.error('❌ Erreur vérification:', err);
  }
}

// Fonction pour nettoyer et retester
async function cleanAndTest() {
  console.log('🧹 Nettoyage et test...');
  
  try {
    const { supabase } = await import('/src/integrations/supabase/client.ts');
    
    // 1. Nettoyer
    const { error: deleteError } = await supabase
      .from('stripe_sync_queue')
      .delete()
      .eq('space_id', 'f5259ce9-0f7c-407f-a730-88b9820c60a9')
      .eq('status', 'pending');
    
    if (deleteError) {
      console.error('❌ Erreur nettoyage:', deleteError);
      return;
    }
    
    console.log('✅ Nettoyage effectué');
    
    // 2. Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Tester l'upsert
    const result = await testUpsert();
    console.log('🎯 Résultat test:', result);
    
  } catch (err) {
    console.error('❌ Erreur cleanAndTest:', err);
  }
}

// Instructions d'utilisation
console.log(`
🚀 DEBUG REACT UPSERT - INSTRUCTIONS

1. Vérifier l'état actuel:
   checkCurrentState()

2. Tester l'upsert:
   testUpsert()

3. Nettoyer et retester:
   cleanAndTest()

4. Exécuter dans l'ordre:
   checkCurrentState().then(() => testUpsert())
`);

// Exporter les fonctions pour utilisation
window.debugUpsert = {
  testUpsert,
  checkCurrentState,
  cleanAndTest
}; 
const { DatabaseMigrator, databases } = require('./migrate-database.js');

async function testMultiDatabase() {
  console.log('🧪 Test du système multi-base de données\n');

  const migrator = new DatabaseMigrator();

  // Test 1: Vérifier les configurations
  console.log('📋 1. Vérification des configurations...');
  for (const [name, config] of Object.entries(databases)) {
    console.log(`   ${name}: ${config.type} - ${config.host}:${config.port}`);
  }

  // Test 2: Tester les connexions
  console.log('\n🔌 2. Test des connexions...');
  const connectionResults = {};
  
  for (const [name, config] of Object.entries(databases)) {
    console.log(`\n   Test de ${name}...`);
    const isConnected = await migrator.testConnection(config);
    connectionResults[name] = isConnected;
  }

  // Test 3: Afficher le résumé
  console.log('\n📊 3. Résumé des connexions:');
  for (const [name, isConnected] of Object.entries(connectionResults)) {
    const status = isConnected ? '✅ Connecté' : '❌ Échec';
    console.log(`   ${name}: ${status}`);
  }

  // Test 4: Recommandations
  console.log('\n💡 4. Recommandations:');
  
  if (connectionResults.supabase) {
    console.log('   ✅ Supabase: Fonctionnel - Idéal pour le développement');
  } else {
    console.log('   ❌ Supabase: Problème de connexion - Vérifiez les variables d\'environnement');
  }

  if (connectionResults.o2switch) {
    console.log('   ✅ O2Switch PostgreSQL: Fonctionnel - Bonne alternative gratuite');
  } else {
    console.log('   ⚠️  O2Switch PostgreSQL: Port 5432 fermé - Utilisez phpPgAdmin');
  }

  if (connectionResults.mysql) {
    console.log('   ✅ MySQL: Fonctionnel - Alternative classique');
  } else {
    console.log('   ⚠️  MySQL: Port 3306 fermé - Utilisez phpMyAdmin');
  }

  // Test 5: Instructions de migration
  console.log('\n📝 5. Instructions de migration:');
  
  if (connectionResults.supabase && (connectionResults.o2switch || connectionResults.mysql)) {
    console.log('   🚀 Migration possible:');
    if (connectionResults.o2switch) {
      console.log('      node scripts/migrate-database.js migrate supabase o2switch');
    }
    if (connectionResults.mysql) {
      console.log('      node scripts/migrate-database.js migrate supabase mysql');
    }
  } else {
    console.log('   ⚠️  Migration manuelle requise:');
    console.log('      1. Utilisez phpPgAdmin pour O2Switch');
    console.log('      2. Utilisez phpMyAdmin pour MySQL');
    console.log('      3. Exécutez les scripts SQL fournis');
  }

  // Test 6: Vérification des scripts
  console.log('\n📄 6. Vérification des scripts SQL:');
  
  const fs = require('fs');
  const scripts = [
    'scripts/migrate-o2switch-simple.sql',
    'scripts/migrate-to-mysql.sql'
  ];

  for (const script of scripts) {
    if (fs.existsSync(script)) {
      console.log(`   ✅ ${script} - Disponible`);
    } else {
      console.log(`   ❌ ${script} - Manquant`);
    }
  }

  console.log('\n🎯 7. Prochaines étapes:');
  console.log('   1. Configurez vos variables d\'environnement');
  console.log('   2. Exécutez les scripts SQL dans phpPgAdmin/phpMyAdmin');
  console.log('   3. Testez l\'interface de sélection de base');
  console.log('   4. Migrez vos données si nécessaire');

  console.log('\n✨ Test terminé !');
}

// Exécuter le test
if (require.main === module) {
  testMultiDatabase().catch(console.error);
}

module.exports = { testMultiDatabase }; 
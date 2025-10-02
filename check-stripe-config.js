const { Pool } = require('pg');

const pool = new Pool({
  host: '147.93.58.155',
  port: 5432,
  user: 'vpshostinger',
  password: 'Fethi@2025!',
  database: 'coworkmy',
  ssl: { rejectUnauthorized: false }
});

async function checkStripeConfig() {
  try {
    console.log('🔍 Vérification de la configuration Stripe...\n');
    
    const result = await pool.query("SELECT value FROM admin_settings WHERE key = 'stripe'");
    
    if (result.rows.length > 0) {
      const config = result.rows[0].value;
      console.log('📊 Configuration Stripe actuelle:');
      console.log(`Mode: ${config.mode || 'non défini'}`);
      console.log(`Test Secret Key: ${config.test_secret_key ? '✅ Présente' : '❌ Manquante'}`);
      console.log(`Test Publishable Key: ${config.test_publishable_key ? '✅ Présente' : '❌ Manquante'}`);
      console.log(`Live Secret Key: ${config.live_secret_key ? '✅ Présente' : '❌ Manquante'}`);
      console.log(`Live Publishable Key: ${config.live_publishable_key ? '✅ Présente' : '❌ Manquante'}`);
      
      console.log('\n🔧 Configuration complète:');
      console.log(JSON.stringify(config, null, 2));
    } else {
      console.log('❌ Aucune configuration Stripe trouvée dans admin_settings');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

checkStripeConfig();

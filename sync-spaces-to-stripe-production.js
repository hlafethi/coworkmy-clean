const { Pool } = require('pg');
const Stripe = require('stripe');
require('dotenv').config();

// Configuration de la base de données
const pool = new Pool({
  host: process.env.VITE_DATABASE_HOST,
  port: process.env.VITE_DATABASE_PORT,
  database: process.env.VITE_DATABASE_NAME,
  user: process.env.VITE_DATABASE_USER,
  password: process.env.VITE_DATABASE_PASSWORD,
  ssl: process.env.VITE_DATABASE_SSL === 'true'
});

// Configuration Stripe en mode production
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

async function syncSpacesToStripe() {
  try {
    console.log('🚀 Début de la synchronisation des espaces vers Stripe (mode production)');
    
    // Récupérer tous les espaces actifs
    const spacesResult = await pool.query(`
      SELECT id, name, description, price_per_hour, price_per_day, price_per_month, 
             is_active, image_url, created_at
      FROM spaces 
      WHERE is_active = true
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 ${spacesResult.rows.length} espaces trouvés`);
    
    if (spacesResult.rows.length === 0) {
      console.log('⚠️ Aucun espace actif trouvé');
      return;
    }
    
    // Synchroniser chaque espace
    for (const space of spacesResult.rows) {
      try {
        console.log(`\n🔄 Synchronisation de l'espace: ${space.name}`);
        
        // Créer le produit Stripe
        const product = await stripe.products.create({
          name: space.name,
          description: space.description || `Espace de coworking: ${space.name}`,
          images: space.image_url ? [space.image_url] : [],
          metadata: {
            space_id: space.id.toString(),
            sync_date: new Date().toISOString()
          }
        });
        
        console.log(`✅ Produit créé: ${product.id}`);
        
        // Créer les prix selon les tarifs disponibles
        const prices = [];
        
        if (space.price_per_hour) {
          const hourlyPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(space.price_per_hour * 100), // Convertir en centimes
            currency: 'eur',
            nickname: 'Tarif horaire',
            metadata: {
              space_id: space.id.toString(),
              pricing_type: 'hourly'
            }
          });
          prices.push({ type: 'hourly', price: hourlyPrice });
          console.log(`  💰 Prix horaire: ${space.price_per_hour}€/h`);
        }
        
        if (space.price_per_day) {
          const dailyPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(space.price_per_day * 100),
            currency: 'eur',
            nickname: 'Tarif journalier',
            metadata: {
              space_id: space.id.toString(),
              pricing_type: 'daily'
            }
          });
          prices.push({ type: 'daily', price: dailyPrice });
          console.log(`  💰 Prix journalier: ${space.price_per_day}€/jour`);
        }
        
        if (space.price_per_month) {
          const monthlyPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(space.price_per_month * 100),
            currency: 'eur',
            nickname: 'Tarif mensuel',
            metadata: {
              space_id: space.id.toString(),
              pricing_type: 'monthly'
            }
          });
          prices.push({ type: 'monthly', price: monthlyPrice });
          console.log(`  💰 Prix mensuel: ${space.price_per_month}€/mois`);
        }
        
        // Mettre à jour la base de données avec les IDs Stripe
        await pool.query(`
          UPDATE spaces 
          SET stripe_product_id = $1,
              stripe_hourly_price_id = $2,
              stripe_daily_price_id = $3,
              stripe_monthly_price_id = $4,
              updated_at = NOW()
          WHERE id = $5
        `, [
          product.id,
          prices.find(p => p.type === 'hourly')?.price.id || null,
          prices.find(p => p.type === 'daily')?.price.id || null,
          prices.find(p => p.type === 'monthly')?.price.id || null,
          space.id
        ]);
        
        console.log(`✅ Espace ${space.name} synchronisé avec succès`);
        
      } catch (spaceError) {
        console.error(`❌ Erreur pour l'espace ${space.name}:`, spaceError.message);
      }
    }
    
    console.log('\n🎉 Synchronisation terminée !');
    console.log('📋 Vérifiez votre catalogue Stripe: https://dashboard.stripe.com/products');
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
  } finally {
    await pool.end();
  }
}

// Vérifier que nous sommes en mode production
if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
  console.error('❌ ERREUR: Vous devez utiliser une clé secrète Stripe LIVE (sk_live_...)');
  console.log('💡 Vérifiez votre fichier .env et assurez-vous que STRIPE_SECRET_KEY contient une clé de production');
  process.exit(1);
}

console.log('🔧 Mode: PRODUCTION');
console.log('🔑 Clé Stripe:', process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...');

// Demander confirmation
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('⚠️  ATTENTION: Vous êtes sur le point de synchroniser vers Stripe PRODUCTION. Continuer ? (oui/non): ', (answer) => {
  if (answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'o') {
    syncSpacesToStripe();
  } else {
    console.log('❌ Synchronisation annulée');
  }
  rl.close();
});

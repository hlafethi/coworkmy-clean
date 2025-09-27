import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || process.env.SUPABASE_STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Clé secrète Stripe non trouvée !');
  console.log('📋 Solutions :');
  console.log('1. Ajoute STRIPE_SECRET_KEY=sk_test_... dans ton fichier .env');
  console.log('2. Ou modifie directement le script avec ta clé');
  console.log('3. Ou exporte la variable : export STRIPE_SECRET_KEY=sk_test_...');
  process.exit(1);
}

async function listStripeProducts() {
  try {
    console.log('📋 Liste des produits Stripe...');
    console.log(`🔑 Clé utilisée: ${STRIPE_SECRET_KEY.substring(0, 20)}...`);
    
    const productsResponse = await fetch('https://api.stripe.com/v1/products?limit=100', {
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      }
    });
    
    if (!productsResponse.ok) {
      const errorText = await productsResponse.text();
      console.error(`❌ Erreur API Stripe: ${productsResponse.status} - ${errorText}`);
      return;
    }
    
    const products = await productsResponse.json();
    console.log(`📊 ${products.data.length} produits trouvés dans Stripe\n`);
    
    // Afficher tous les produits
    products.data.forEach((product, index) => {
      const status = product.active ? '✅' : '❌';
      const isUndefined = product.name === 'undefined' || !product.name || product.name.trim() === '';
      const warning = isUndefined ? '⚠️ À SUPPRIMER' : '';
      
      console.log(`${index + 1}. ${status} ${product.id} - "${product.name}" ${warning}`);
      if (product.description) {
        console.log(`   Description: ${product.description}`);
      }
      console.log(`   Créé: ${new Date(product.created * 1000).toLocaleString()}`);
      console.log('');
    });
    
    // Compter les produits problématiques
    const undefinedProducts = products.data.filter(p => 
      p.name === 'undefined' || 
      p.name === 'Undefined' || 
      p.name === 'UNDEFINED' ||
      !p.name ||
      p.name.trim() === ''
    );
    
    console.log(`\n📊 RÉSUMÉ:`);
    console.log(`- Total: ${products.data.length} produits`);
    console.log(`- À supprimer: ${undefinedProducts.length} produits "undefined"`);
    console.log(`- Valides: ${products.data.length - undefinedProducts.length} produits`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

listStripeProducts(); 
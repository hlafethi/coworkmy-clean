import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { Database } from '@/types/supabase';

// Chargement des variables d'environnement
dotenv.config();

// Types
interface Space {
  id: string;
  name: string;
  description: string;
  image_url: string;
  capacity: number;
  type: string;
  pricing_type: string; // 'hourly' | 'daily' | 'monthly' | 'yearly'
  price_ht: number;
  price_ttc: number;
  stripe_product_id?: string;
  stripe_price_id?: string;
  created_at: string;
  updated_at: string;
  min_duration?: number; // en heures
  max_duration?: number; // en heures
}

// Configuration
const PROTECTED_FILES = [
  'src/config/stripe.ts',
  'src/api/paymentHandlers.ts'
];

// Vérification de sécurité
if (PROTECTED_FILES.some(file => __filename.includes(file))) {
  throw new Error('Accès interdit aux fichiers protégés');
}

// Initialisation des clients
const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Fonction de synchronisation
async function syncSpaces() {
  console.log('🚀 Démarrage de la synchronisation des espaces...');

  // 1. Récupération des espaces depuis Supabase
  const { data: spaces, error } = await supabase
    .from('spaces')
    .select('*');

  if (error) throw error;
  if (!spaces) throw new Error('Aucun espace trouvé');

  console.log(`📦 ${spaces.length} espaces trouvés dans Supabase`);

  // 2. Nettoyage des produits Stripe orphelins
  const allStripeProducts = await stripe.products.list({ limit: 100 });
  const supabaseIds = spaces.map(s => s.id);
  for (const product of allStripeProducts.data) {
    const externalId = product.metadata?.external_id;
    if (externalId && !supabaseIds.includes(externalId)) {
      // Suppression du produit orphelin
      await stripe.products.update(product.id, { active: false });
      console.log(`🗑️ Produit Stripe orphelin désactivé : ${product.name} (${product.id})`);
    }
  }

  // 3. Synchronisation avec Stripe
  for (const space of spaces) {
    try {
      // Vérification de l'existence dans Stripe
      const existing = await stripe.products.search({
        query: `metadata['external_id']:"${space.id}"`,
      });

      // Préparation des métadonnées
      const metadata = {
        external_id: space.id,
        supabase_id: space.id,
        type: space.type || '',
        capacity: space.capacity ? space.capacity.toString() : '',
        pricing_type: space.pricing_type || '',
        price_ht: Number.isFinite(space.price_ht) ? space.price_ht.toString() : '0',
        price_ttc: Number.isFinite(space.price_ttc) ? space.price_ttc.toString() : '0',
        min_duration: space.min_duration ? space.min_duration.toString() : '',
        max_duration: space.max_duration ? space.max_duration.toString() : '',
        updated_at: new Date().toISOString()
      };

      // Vérification stricte des montants
      const validHT = Number.isFinite(space.price_ht) && space.price_ht > 0;
      const validTTC = Number.isFinite(space.price_ttc) && space.price_ttc > 0;
      const isRecurring = space.pricing_type === 'monthly' || space.pricing_type === 'yearly';
      const images = space.image_url ? [space.image_url] : undefined;

      // Fonction utilitaire pour créer un prix Stripe
      async function createStripePrice(productId: string, amount: number, taxType: 'HT' | 'TTC') {
        const priceParams: any = {
          product: productId,
          unit_amount: Math.round(amount * 100),
          currency: 'eur',
          active: true,
          metadata: {
            space_id: space.id,
            type: space.type,
            pricing_type: space.pricing_type,
            tax_type: taxType
          }
        };
        if (isRecurring) {
          priceParams.recurring = { interval: space.pricing_type === 'monthly' ? 'month' : 'year' };
          priceParams.tax_behavior = 'inclusive';
        }
        return await stripe.prices.create(priceParams);
      }

      if (existing.data.length === 0) {
        // Création du produit dans Stripe
        const stripeProduct = await stripe.products.create({
          name: space.name,
          description: space.description,
          images,
          metadata,
          active: true
        });

        // Création du prix (TTC prioritaire, sinon HT)
        let stripePriceId = '';
        let stripePriceUrl = '';
        if (validTTC) {
          const price = await createStripePrice(stripeProduct.id, space.price_ttc, 'TTC');
          stripePriceId = price.id;
          stripePriceUrl = `https://dashboard.stripe.com/test/products/${stripeProduct.id}/prices/${price.id}`;
          // Définir le prix par défaut sur le produit
          await stripe.products.update(stripeProduct.id, { default_price: price.id, active: true });
        } else if (validHT) {
          const price = await createStripePrice(stripeProduct.id, space.price_ht, 'HT');
          stripePriceId = price.id;
          stripePriceUrl = `https://dashboard.stripe.com/test/products/${stripeProduct.id}/prices/${price.id}`;
          await stripe.products.update(stripeProduct.id, { default_price: price.id, active: true });
        }

        // Mise à jour dans Supabase
        await supabase
          .from('spaces')
          .update({
            stripe_product_id: stripeProduct.id,
            stripe_price_id: stripePriceId,
            updated_at: new Date().toISOString()
          })
          .eq('id', space.id);

        console.log(`✅ Espace ${space.id} (${space.name}) créé dans Stripe avec tarif : ${stripePriceUrl}`);
      } else {
        // Mise à jour du produit existant
        const stripeProduct = existing.data[0];
        await stripe.products.update(stripeProduct.id, {
          name: space.name,
          description: space.description,
          images,
          metadata,
          active: true
        });

        // Désactiver tous les anciens prix
        const prices = await stripe.prices.list({ product: stripeProduct.id, active: true });
        for (const price of prices.data) {
          await stripe.prices.update(price.id, { active: false });
        }

        // Création du nouveau prix (TTC prioritaire, sinon HT)
        let stripePriceId = '';
        let stripePriceUrl = '';
        if (validTTC) {
          const price = await createStripePrice(stripeProduct.id, space.price_ttc, 'TTC');
          stripePriceId = price.id;
          stripePriceUrl = `https://dashboard.stripe.com/test/products/${stripeProduct.id}/prices/${price.id}`;
          await stripe.products.update(stripeProduct.id, { default_price: price.id, active: true });
        } else if (validHT) {
          const price = await createStripePrice(stripeProduct.id, space.price_ht, 'HT');
          stripePriceId = price.id;
          stripePriceUrl = `https://dashboard.stripe.com/test/products/${stripeProduct.id}/prices/${price.id}`;
          await stripe.products.update(stripeProduct.id, { default_price: price.id, active: true });
        }

        // Mise à jour dans Supabase
        await supabase
          .from('spaces')
          .update({
            stripe_product_id: stripeProduct.id,
            stripe_price_id: stripePriceId,
            updated_at: new Date().toISOString()
          })
          .eq('id', space.id);

        console.log(`🔄 Espace ${space.id} (${space.name}) mis à jour dans Stripe avec tarif : ${stripePriceUrl}`);
      }
    } catch (err: any) {
      console.error(`❌ Erreur sur l'espace ${space.id}:`, {
        message: err.message,
        code: err.code,
        param: err.param,
        stack: err.stack
      });
    }
  }

  console.log('✨ Synchronisation terminée avec succès');
}

// Exécution
syncSpaces().catch(console.error); 
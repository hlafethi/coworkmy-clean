// @ts-ignore: Deno module resolution
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
// @ts-ignore: Deno module resolution
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore: Deno module resolution
import Stripe from "https://esm.sh/stripe@12.4.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Récupérer les clés depuis les variables d'environnement Supabase
// @ts-ignore: Deno est disponible dans l'environnement d'exécution Supabase Edge Functions
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
// @ts-ignore: Deno est disponible dans l'environnement d'exécution Supabase Edge Functions
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
// @ts-ignore: Deno est disponible dans l'environnement d'exécution Supabase Edge Functions
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Vérifier que les clés sont définies
if (!STRIPE_SECRET_KEY) {
  console.error("La clé secrète Stripe n'est pas définie dans les variables d'environnement Supabase");
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Les clés Supabase ne sont pas définies dans les variables d'environnement");
}

// Initialiser les clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

interface Space {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  hourly_price: number | null;
  daily_price: number | null;
  monthly_price: number | null;
  yearly_price: number | null;
  half_day_price: number | null;
  quarter_price: number | null;
  custom_price: number | null;
  custom_label: string | null;
  pricing_type: 'hourly' | 'daily' | 'monthly' | 'yearly' | 'half_day' | 'quarter' | 'custom';
  image_url: string | null;
  is_active: boolean;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
}

// Fonction pour obtenir le prix principal selon le type de tarification
function getMainPrice(space: Space): number {
  switch (space.pricing_type) {
    case 'hourly':
      return space.hourly_price || 0;
    case 'daily':
      return space.daily_price || 0;
    case 'monthly':
      return space.monthly_price || 0;
    case 'yearly':
      return space.yearly_price || 0;
    case 'half_day':
      return space.half_day_price || 0;
    case 'quarter':
      return space.quarter_price || 0;
    case 'custom':
      return space.custom_price || 0;
    default:
      return space.hourly_price || 0;
  }
}

// Fonction pour créer ou mettre à jour un produit Stripe
async function syncSpaceWithStripe(space: Space) {
  try {
    console.log(`🔄 Synchronisation de l'espace: ${space.name} (${space.id})`);

    // Obtenir le prix principal
    const mainPrice = getMainPrice(space);
    if (mainPrice <= 0) {
      console.log(`⚠️ Prix invalide pour l'espace ${space.name}, synchronisation ignorée`);
      return;
    }

    // Préparer les métadonnées
    const metadata = {
      external_id: space.id,
      supabase_id: space.id,
      capacity: space.capacity.toString(),
      pricing_type: space.pricing_type,
      main_price: mainPrice.toString(),
      is_active: space.is_active.toString(),
      updated_at: new Date().toISOString()
    };

    // Vérifier si le produit existe déjà dans Stripe
    let stripeProduct;
    if (space.stripe_product_id) {
      try {
        stripeProduct = await stripe.products.retrieve(space.stripe_product_id);
        console.log(`📦 Produit Stripe existant trouvé: ${stripeProduct.name}`);
      } catch (error) {
        console.log(`⚠️ Produit Stripe non trouvé, création d'un nouveau produit`);
        stripeProduct = null;
      }
    }

    if (!stripeProduct) {
      // Créer un nouveau produit
      stripeProduct = await stripe.products.create({
        name: space.name,
        description: space.description || '',
        images: space.image_url ? [space.image_url] : undefined,
        metadata,
        active: space.is_active
      });
      console.log(`✅ Nouveau produit Stripe créé: ${stripeProduct.id}`);
    } else {
      // Mettre à jour le produit existant
      stripeProduct = await stripe.products.update(space.stripe_product_id, {
        name: space.name,
        description: space.description || '',
        images: space.image_url ? [space.image_url] : undefined,
        metadata,
        active: space.is_active
      });
      console.log(`🔄 Produit Stripe mis à jour: ${stripeProduct.id}`);
    }

    // Désactiver les anciens prix
    const existingPrices = await stripe.prices.list({ product: stripeProduct.id, active: true });
    for (const price of existingPrices.data) {
      await stripe.prices.update(price.id, { active: false });
      console.log(`🗑️ Prix désactivé: ${price.id}`);
    }

    // Créer le nouveau prix
    const isRecurring = space.pricing_type === 'monthly' || space.pricing_type === 'yearly';
    const priceParams: any = {
      product: stripeProduct.id,
      unit_amount: Math.round(mainPrice * 100), // Stripe utilise les centimes
      currency: 'eur',
      active: true,
      metadata: {
        space_id: space.id,
        pricing_type: space.pricing_type,
        capacity: space.capacity.toString()
      }
    };

    if (isRecurring) {
      priceParams.recurring = { 
        interval: space.pricing_type === 'monthly' ? 'month' : 'year' 
      };
      priceParams.tax_behavior = 'inclusive';
    }

    const stripePrice = await stripe.prices.create(priceParams);
    console.log(`💰 Nouveau prix créé: ${stripePrice.id}`);

    // Définir le prix par défaut sur le produit
    await stripe.products.update(stripeProduct.id, { 
      default_price: stripePrice.id 
    });

    // Mettre à jour l'espace dans Supabase avec les IDs Stripe
    const { error: updateError } = await supabase
      .from('spaces')
      .update({
        stripe_product_id: stripeProduct.id,
        stripe_price_id: stripePrice.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', space.id);

    if (updateError) {
      console.error(`❌ Erreur lors de la mise à jour de l'espace:`, updateError);
      throw updateError;
    }

    console.log(`✅ Synchronisation réussie pour l'espace: ${space.name}`);
    return {
      product_id: stripeProduct.id,
      price_id: stripePrice.id
    };

  } catch (error) {
    console.error(`❌ Erreur lors de la synchronisation de l'espace ${space.name}:`, error);
    throw error;
  }
}

// Fonction principale de synchronisation
async function syncAllSpaces() {
  try {
    console.log('🚀 Démarrage de la synchronisation complète des espaces...');

    // Récupérer tous les espaces actifs
    const { data: spaces, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    if (!spaces || spaces.length === 0) {
      console.log('📭 Aucun espace actif trouvé');
      return { message: 'Aucun espace actif trouvé' };
    }

    console.log(`📦 ${spaces.length} espaces actifs trouvés`);

    const results = [];
    for (const space of spaces) {
      try {
        const result = await syncSpaceWithStripe(space);
        if (result) {
          results.push({
            space_id: space.id,
            space_name: space.name,
            product_id: result.product_id,
            price_id: result.price_id
          });
        }
      } catch (error) {
        console.error(`❌ Erreur sur l'espace ${space.name}:`, error);
        results.push({
          space_id: space.id,
          space_name: space.name,
          error: error.message
        });
      }
    }

    console.log('✨ Synchronisation terminée');
    return {
      message: 'Synchronisation terminée',
      results,
      total_spaces: spaces.length,
      successful_syncs: results.filter(r => !r.error).length,
      failed_syncs: results.filter(r => r.error).length
    };

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    throw error;
  }
}

// Handler principal
serve(async (req) => {
  // Gestion CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier l'authentification
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token d\'authentification manquant' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Vérifier que l'utilisateur est admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token invalide' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Vérifier le statut admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Accès réservé aux administrateurs' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Exécuter la synchronisation
    const result = await syncAllSpaces();

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erreur dans la fonction:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erreur lors de la synchronisation',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 
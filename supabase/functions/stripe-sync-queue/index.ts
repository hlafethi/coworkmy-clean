// @ts-ignore: Deno gère dynamiquement les modules externes
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @ts-ignore: Deno gère dynamiquement les modules externes
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Interface pour le typage fort des données d'espace
interface SpaceData {
  id: string;
  name: string;
  description?: string;
  pricing_type: string;
  hourly_price: number;
  daily_price: number;
  half_day_price?: number;
  monthly_price?: number;
  quarter_price?: number;
  yearly_price?: number;
  custom_price?: number;
  stripe_product_id?: string;
  stripe_price_id?: string;
}

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-verify-key, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SERVICE_ROLE_KEY')!
);
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

// Configuration pour éviter les timeouts
const MAX_JOBS_PER_REQUEST = 5; // Limite le nombre de jobs traités par requête
const REQUEST_TIMEOUT = 25000; // 25 secondes max

// Fonction pour tester la connexion Stripe
async function testStripeConnection() {
  try {
    console.log('🔑 Test de connexion à l\'API Stripe...');
    const response = await fetch('https://api.stripe.com/v1/account', {
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur de connexion Stripe: ${response.status} - ${errorText}`);
      return { success: false, error: `Erreur ${response.status}: ${errorText}` };
    }

    const account = await response.json();
    console.log(`✅ Connexion Stripe réussie - Mode: ${account.charges_enabled ? 'Live' : 'Test'}`);
    return { success: true, account };
  } catch (error) {
    console.error('❌ Erreur lors du test de connexion Stripe:', error);
    return { success: false, error: String(error) };
  }
}

function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Fonction pour créer ou mettre à jour un produit Stripe (éviter les doublons)
async function createOrUpdateStripeProduct(space: any) {
  try {
    const params = new URLSearchParams();
    params.append('name', space.name);
    params.append('active', 'true');
    if (space.description && space.description.trim() !== '') {
      params.append('description', space.description);
    }
    if (space.image_url && isValidUrl(space.image_url)) {
      params.append('images[]', space.image_url);
      console.log(`🖼️ Image ajoutée au produit: ${space.image_url}`);
    }
    params.append('metadata[supabase_id]', space.id);
    params.append('metadata[space_type]', 'coworking');
    params.append('metadata[created_at]', new Date().toISOString());

    let productResponse;
    if (space.stripe_product_id) {
      // Mise à jour du produit existant
      productResponse = await fetch(`https://api.stripe.com/v1/products/${space.stripe_product_id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
        });
    } else {
      // Création d'un nouveau produit
      productResponse = await fetch('https://api.stripe.com/v1/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });
    }
    const product = await productResponse.json();
    if (product.error) throw new Error(product.error.message);
    console.log(`✅ Produit Stripe synchronisé: ${product.id} - ${product.name}`);
    return product;
  } catch (error) {
    console.error('❌ Erreur lors de la création/mise à jour du produit Stripe:', error);
    throw error;
  }
}

// Fonction pour créer ou réutiliser un prix existant
async function updateOrCreateStripePrice(productId: string, amount: number, currency = 'eur') {
  try {
    // Validation stricte du montant
    if (amount <= 0) {
      throw new Error(`Prix invalide: ${amount} doit être supérieur à 0`);
    }

    console.log(`🔍 Recherche de prix existants pour le produit: ${productId} (${amount} ${currency})`);
    
    // Récupérer les prix existants
    const existingPricesResponse = await fetch(`https://api.stripe.com/v1/prices?product=${productId}&active=true`, {
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      }
    });
    
    if (!existingPricesResponse.ok) {
      const errorText = await existingPricesResponse.text();
      console.error(`❌ Erreur lors de la récupération des prix Stripe: ${existingPricesResponse.status} - ${errorText}`);
      throw new Error(`Erreur API Stripe prix: ${existingPricesResponse.status} - ${errorText}`);
    }
    
    const existingPrices = await existingPricesResponse.json();
    console.log(`📊 ${existingPrices.data.length} prix trouvés pour le produit ${productId}`);

    // Chercher un prix existant avec le même montant
    const existingPrice = existingPrices.data.find(
      (p: any) => p.unit_amount === Math.round(amount * 100) && p.currency === currency
    );

    if (existingPrice) {
      console.log(`💰 Réutilisation du prix existant: ${existingPrice.id} - ${existingPrice.unit_amount / 100} ${existingPrice.currency}`);
      return existingPrice;
    }

    console.log(`💳 Création d'un nouveau prix: ${amount} ${currency} pour le produit ${productId}`);
    
    // Créer un nouveau prix
    const createPriceResponse = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        product: productId,
        unit_amount: Math.round(amount * 100).toString(),
        currency: currency,
        'metadata[created_at]': new Date().toISOString()
      }),
    });
    
    if (!createPriceResponse.ok) {
      const errorText = await createPriceResponse.text();
      console.error(`❌ Erreur lors de la création du prix: ${createPriceResponse.status} - ${errorText}`);
      throw new Error(`Erreur création prix: ${createPriceResponse.status} - ${errorText}`);
    }
    
    const newPrice = await createPriceResponse.json();
    console.log(`✅ Nouveau prix créé avec succès: ${newPrice.id} - ${newPrice.unit_amount / 100} ${newPrice.currency}`);
    return newPrice;
  } catch (error) {
    console.error('❌ Erreur lors de la création/mise à jour du prix Stripe:', error);
    throw error;
  }
}

async function getSpaceDataFromPayload(job: any) {
  // Si le payload contient déjà toutes les données (nouveau format)
  if (job.payload.name && job.payload.monthly_price !== undefined) {
    console.log(`✅ Nouveau format détecté pour ${job.payload.name}`);
    return job.payload;
  }
  
  // Si c'est l'ancien format avec space_name, récupérer depuis la table spaces
  if (job.payload.space_name && job.payload.space_id) {
    console.log(`🔄 Ancien format détecté, récupération depuis la table spaces pour ${job.payload.space_id}`);
    const { data: spaceData, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', job.payload.space_id)
      .single();
    if (error || !spaceData) {
      throw new Error(`Espace non trouvé: ${job.payload.space_id}`);
    }
    console.log(`✅ Données récupérées depuis la table: ${spaceData.name}`);
    return spaceData;
  }
  
  // Fallback pour tout autre format
  console.log(`⚠️ Format non reconnu, fallback pour ${job.payload.space_id || job.space_id}`);
  const { data: spaceData, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('id', job.payload.space_id || job.space_id)
    .single();
  if (error || !spaceData) {
    throw new Error(`Espace non trouvé: ${job.payload.space_id || job.space_id}`);
  }
  return spaceData;
}

// Fonction principale avec timeout et limite de jobs
serve(async (req) => {
  // Gestion CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log(`🚀 Fonction stripe-sync-queue appelée - Méthode: ${req.method}`);

  // Authentification
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Header Authorization manquant');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new Error('Token Bearer manquant');
    }

    console.log('🔐 Authentification validée');
  } catch (error) {
    console.error('❌ Erreur d\'authentification:', error);
    return new Response(JSON.stringify({ 
      error: "Unauthorized",
      message: "Authentication failed"
    }), { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  // Vérification temporaire de la clé Stripe
  if (req.headers.get('x-verify-key') === 'true') {
    console.log('🔑 Vérification de la clé Stripe demandée');
    const stripeTest = await testStripeConnection();
    return new Response(JSON.stringify({
      stripeKey: STRIPE_SECRET_KEY ? 'PRESENT' : 'MISSING',
      stripeConnection: stripeTest
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  try {
    // Vérifier que la clé Stripe est configurée
    if (!STRIPE_SECRET_KEY) {
      console.error('❌ Clé secrète Stripe non configurée');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Clé secrète Stripe non configurée' 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log('🔑 Clé Stripe configurée, test de connexion...');
    
    // Tester la connexion Stripe
    const stripeTest = await testStripeConnection();
    if (!stripeTest.success) {
      console.error('❌ Échec du test de connexion Stripe:', stripeTest.error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Échec de la connexion Stripe: ${stripeTest.error}` 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    console.log('✅ Connexion Stripe validée, début du traitement...');
    
    // Vérifier si c'est un appel de synchronisation directe
    const body = await req.json().catch(() => ({}));
    console.log('📨 Corps de la requête:', body);
    
    if (body.action === 'sync_all') {
      console.log('🔄 Synchronisation directe de tous les espaces demandée');
      
      // Récupérer tous les espaces
      const { data: spaces, error: spacesError } = await supabase
        .from('spaces')
        .select('*')
        .not('name', 'is', null);
        
      if (spacesError) {
        console.error('❌ Erreur lors de la récupération des espaces:', spacesError);
        throw spacesError;
      }
      
      if (!spaces || spaces.length === 0) {
        console.log('ℹ️ Aucun espace à synchroniser');
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Aucun espace à synchroniser.' 
        }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      console.log(`🚀 Synchronisation directe de ${spaces.length} espace(s)`);
      
      let successCount = 0;
      let errorCount = 0;
      let spaceErrors = [];
      
      // Limiter le nombre d'espaces traités pour éviter le timeout
      const spacesToProcess = spaces.slice(0, MAX_JOBS_PER_REQUEST);
      
      for (const space of spacesToProcess) {
        try {
          console.log(`\n📋 Synchronisation directe de l'espace: ${space.name}`);
          
          // Validation stricte du nom
          if (!space.name || space.name.trim() === '') {
            throw new Error(`Nom d'espace manquant pour l'id: ${space.id}`);
          }
          
          // Sélection stricte du prix
          let priceAmount = 0;
          let priceType = '';
          switch (space.pricing_type) {
            case 'hourly':
              priceAmount = space.hourly_price;
              priceType = 'horaire';
              break;
            case 'daily':
              priceAmount = space.daily_price;
              priceType = 'journalier';
              break;
            case 'monthly':
              priceAmount = space.monthly_price;
              priceType = 'mensuel';
              break;
            case 'half_day':
              priceAmount = space.half_day_price;
              priceType = 'demi-journée';
              break;
            // Ajoute les autres types si besoin
          }
          if (priceAmount <= 0) {
            throw new Error(`Prix invalide pour ${space.name}: ${priceAmount} EUR (${priceType})`);
          }
          
          // Traiter l'espace directement
          const spaceData: SpaceData = {
            id: space.id,
            name: space.name,
            description: space.description,
            pricing_type: space.pricing_type,
            hourly_price: space.hourly_price || 0,
            daily_price: space.daily_price || 0,
            half_day_price: space.half_day_price || 0,
            monthly_price: space.monthly_price || 0,
            quarter_price: space.quarter_price || 0,
            yearly_price: space.yearly_price || 0,
            custom_price: space.custom_price || 0,
            stripe_product_id: space.stripe_product_id,
            stripe_price_id: space.stripe_price_id
          };
          
          // Créer ou mettre à jour le produit Stripe
          const product = await createOrUpdateStripeProduct(spaceData);
          if (!product.id) {
            throw new Error(`Erreur lors de la création/mise à jour du produit Stripe`);
          }
          
          // Créer ou réutiliser le prix
          const price = await updateOrCreateStripePrice(product.id, priceAmount, 'eur');
          if (!price.id) {
            throw new Error(`Erreur lors de la création/mise à jour du prix Stripe`);
          }
          
          // Mettre à jour l'espace
          const { error: updateError } = await supabase
            .from('spaces')
            .update({
              stripe_product_id: product.id,
              stripe_price_id: price.id,
              last_stripe_sync: new Date().toISOString()
            })
            .eq('id', space.id);

          if (updateError) {
            throw new Error(`Erreur lors de la mise à jour de l'espace: ${updateError.message}`);
          }

          console.log(`✅ Espace ${space.name} synchronisé avec succès`);
          successCount++;

        } catch (error) {
          console.error(`❌ Erreur lors de la synchronisation de ${space.name}:`, error);
          errorCount++;
          spaceErrors.push({
            space_id: space.id,
            space_name: space.name,
            error_message: String(error)
          });
        }
      }
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Synchronisation directe terminée: ${successCount} succès, ${errorCount} erreurs`,
        details: {
          total: spacesToProcess.length,
          success: successCount,
          errors: errorCount,
          space_errors: spaceErrors,
          remaining: spaces.length - spacesToProcess.length
        }
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Traitement de la file d'attente
    console.log('📋 Traitement de la file d\'attente Stripe...');
    
    // Récupérer les jobs en attente (limité pour éviter le timeout)
    const { data: jobs, error: jobsError } = await supabase
      .from('stripe_sync_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(MAX_JOBS_PER_REQUEST);

    if (jobsError) {
      console.error('❌ Erreur lors de la récupération des jobs:', jobsError);
      throw jobsError;
    }

    if (!jobs || jobs.length === 0) {
      console.log('ℹ️ Aucun job en attente');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Aucun job en attente.' 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`🚀 Traitement de ${jobs.length} job(s)`);

    let successCount = 0;
    let errorCount = 0;
    let jobErrors = [];

    for (const job of jobs) {
      try {
        console.log(`\n📋 Traitement du job ${job.id} pour l'espace ${job.space_id}`);
        console.log(`🔍 Type d'événement: ${job.event_type}`);
        
        // Log spécifique pour les INSERT
        if (job.event_type === 'INSERT') {
          console.log(`🆕 NOUVEL ESPACE DÉTECTÉ - Création dans Stripe`);
        } else if (job.event_type === 'UPDATE') {
          console.log(`🔄 ESPACE MODIFIÉ - Mise à jour dans Stripe`);
        } else if (job.event_type === 'DELETE') {
          console.log(`🗑️ ESPACE SUPPRIMÉ - Suppression dans Stripe`);
        }
        
        // Log du payload brut
        console.log('PAYLOAD BRUT:', JSON.stringify(job.payload, null, 2));

        // Utiliser getSpaceDataFromPayload pour gérer les deux formats
        const space = await getSpaceDataFromPayload(job);

        // Log du mapping
        console.log('SPACE MAPPÉ:', JSON.stringify(space, null, 2));

        // Validation stricte
        if (!space.name || space.name.trim() === '') {
          throw new Error(`Nom d'espace manquant pour l'id: ${space.id} | PAYLOAD: ${JSON.stringify(job.payload)}`);
        }
        
        // Extraction explicite des données avec validation
        const spaceData: SpaceData = {
          id: space.id,
          name: space.name,
          description: space.description && space.description.trim() !== '' ? space.description : null,
          pricing_type: space.pricing_type,
          hourly_price: space.hourly_price || 0,
          daily_price: space.daily_price || 0,
          half_day_price: space.half_day_price || 0,
          monthly_price: space.monthly_price || 0,
          quarter_price: space.quarter_price || 0,
          yearly_price: space.yearly_price || 0,
          custom_price: space.custom_price || 0,
          stripe_product_id: space.stripe_product_id,
          stripe_price_id: space.stripe_price_id
        };
        
        console.log(`🏢 Espace extrait du payload: ${space.name} (${space.pricing_type})`);
        
        // Diagnostic spécifique pour le prix mensuel
        console.log(`🔍 DIAGNOSTIC PRIX MENSUEL:`);
        console.log(`  - payload.monthly_price (brut):`, job.payload.monthly_price);
        console.log(`  - typeof payload.monthly_price:`, typeof job.payload.monthly_price);
        console.log(`  - space.monthly_price (traité):`, space.monthly_price);
        console.log(`  - pricing_type:`, space.pricing_type);

        let stripeProductId: string;
        let stripePriceId: string;

        // Créer ou mettre à jour le produit Stripe
        console.log(`🔄 Synchronisation du produit: ${space.name}`);
        const product = await createOrUpdateStripeProduct(space);
        
        if (!product.id) {
          throw new Error(`Erreur lors de la création/mise à jour du produit Stripe`);
        }
        stripeProductId = product.id;

        // Déterminer le prix à utiliser selon le type de tarification
        let priceAmount = 0;
        let priceType = '';
        
        console.log(`💰 SÉLECTION DU PRIX POUR ${space.name}:`);
        console.log(`  - Type de tarification: ${space.pricing_type}`);
        
        switch (space.pricing_type) {
          case 'hourly':
            priceAmount = space.hourly_price || 0;
            priceType = 'horaire';
            console.log(`  - Prix horaire: ${space.hourly_price} EUR`);
            break;
          case 'daily':
            priceAmount = space.daily_price || 0;
            priceType = 'journalier';
            console.log(`  - Prix journalier: ${space.daily_price} EUR`);
            break;
          case 'half_day':
            priceAmount = space.half_day_price || 0;
            priceType = 'demi-journée';
            console.log(`  - Prix demi-journée: ${space.half_day_price} EUR`);
            break;
          case 'monthly':
            priceAmount = space.monthly_price || 0;
            priceType = 'mensuel';
            console.log(`  - Prix mensuel: ${space.monthly_price} EUR`);
            break;
          case 'quarter':
            priceAmount = space.quarter_price || 0;
            priceType = 'trimestriel';
            console.log(`  - Prix trimestriel: ${space.quarter_price} EUR`);
            break;
          case 'yearly':
            priceAmount = space.yearly_price || 0;
            priceType = 'annuel';
            console.log(`  - Prix annuel: ${space.yearly_price} EUR`);
            break;
          case 'custom':
            priceAmount = space.custom_price || 0;
            priceType = 'personnalisé';
            console.log(`  - Prix personnalisé: ${space.custom_price} EUR`);
            break;
          default:
            priceAmount = space.hourly_price || 0;
            priceType = 'horaire (défaut)';
            console.log(`  - Prix horaire (défaut): ${space.hourly_price} EUR`);
        }

        console.log(`💰 Prix ${priceType} sélectionné pour ${space.name}: ${priceAmount} EUR`);

        // Validation stricte du prix - Stripe interdit les prix à 0
        if (priceAmount <= 0) {
          throw new Error(`Prix invalide pour ${space.name}: ${priceAmount} EUR (${priceType}). Le prix doit être supérieur à 0. Vérifiez que le champ ${priceType} est bien renseigné dans la base de données.`);
        }

        // Créer ou réutiliser un prix existant
        console.log(`💳 Synchronisation du prix: ${priceAmount} EUR`);
        const price = await updateOrCreateStripePrice(stripeProductId, priceAmount, 'eur');
        
        if (!price.id) {
          throw new Error(`Erreur lors de la création/mise à jour du prix Stripe`);
        }
        stripePriceId = price.id;

        // Mettre à jour la table spaces avec les IDs Stripe
        console.log(`💾 Mise à jour de l'espace ${space.id} avec les IDs Stripe`);
        
        // Log détaillé de l'objet à mettre à jour
        const updateData = {
          stripe_product_id: stripeProductId,
          stripe_price_id: stripePriceId,
          last_stripe_sync: new Date().toISOString()
        };
        console.log(`📝 Données de mise à jour:`, JSON.stringify(updateData, null, 2));
        
        // Vérifier que l'objet ne contient que les champs autorisés
        const allowedFields = ['stripe_product_id', 'stripe_price_id', 'last_stripe_sync'];
        const hasOnlyAllowedFields = Object.keys(updateData).every(key => allowedFields.includes(key));
        console.log(`✅ Vérification champs autorisés:`, hasOnlyAllowedFields);
        
        if (!hasOnlyAllowedFields) {
          throw new Error(`Champs non autorisés détectés dans updateData: ${Object.keys(updateData).filter(key => !allowedFields.includes(key)).join(', ')}`);
        }
        
        console.log(`🚀 Exécution de l'update avec:`, JSON.stringify(updateData, null, 2));
        const { error: updateError } = await supabase.from('spaces').update(updateData).eq('id', job.space_id);

        if (updateError) {
          throw new Error(`Erreur lors de la mise à jour de l'espace: ${updateError.message}`);
        }

        // Marquer la tâche comme traitée
        console.log(`✅ Job ${job.id} traité avec succès`);
        await supabase.from('stripe_sync_queue').update({ 
          status: 'done', 
          processed_at: new Date().toISOString() 
        }).eq('id', job.id);

        successCount++;

      } catch (error) {
        console.error(`❌ Erreur lors du traitement du job ${job.id}:`, error);
        // Marquer le job en erreur
        await supabase.from('stripe_sync_queue').update({ 
          status: 'error', 
          error_message: String(error) 
        }).eq('id', job.id);
        errorCount++;
        jobErrors.push({
          job_id: job.id,
          space_id: job.space_id,
          error_message: String(error)
        });
      }
    }

    console.log(`\n📊 RÉSUMÉ: ${successCount} succès, ${errorCount} erreurs`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${successCount} job(s) traité(s) avec succès, ${errorCount} erreur(s).`,
      details: {
        total: jobs.length,
        success: successCount,
        errors: errorCount,
        job_errors: jobErrors
      }
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(error) 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
// @ts-ignore: Deno module resolution
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno module resolution
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore: Deno module resolution
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  customerEmail: string;
  returnUrl?: string;
  isAdmin?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[Edge] Fonction create-customer-portal appelée');
  console.log('[Edge] Méthode:', req.method);
  console.log('[Edge] Headers:', Object.fromEntries(req.headers.entries()));

  // Vérifier l'authentification
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    console.log('[Edge] Aucun token d\'authentification fourni');
    return new Response(
      JSON.stringify({ error: 'Token d\'authentification requis' }),
      { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    console.log('[Edge] Début du traitement de la requête');
    
    // Vérifier que le body est valide
    let body;
    try {
      const bodyText = await req.text();
      console.log('[Edge] Body brut reçu:', bodyText);
      
      if (!bodyText || bodyText.trim() === '') {
        console.error('[Edge] Body vide reçu');
        return new Response(
          JSON.stringify({ error: 'Body vide' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      body = JSON.parse(bodyText);
      console.log('[Edge] Body parsé avec succès:', JSON.stringify(body));
    } catch (parseError) {
      console.error('[Edge] Erreur parsing JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Body JSON invalide', 
          details: parseError instanceof Error ? parseError.message : String(parseError),
          receivedBody: bodyText || 'null'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Validation des données
    if (!body.customerEmail) {
      console.error('[Edge] customerEmail manquant dans le body');
      return new Response(
        JSON.stringify({ error: 'customerEmail est requis' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const { customerEmail, returnUrl, isAdmin = false } = body;

    console.log('[Edge] Création du portail client pour:', { customerEmail, returnUrl, isAdmin });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Edge] Variables d\'environnement Supabase manquantes');
      return new Response(
        JSON.stringify({ error: 'Configuration Supabase manquante' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Stripe configuration from database
    console.log('[Edge] Récupération de la configuration Stripe...');
    const { data: stripeConfig, error: configError } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe')
      .single();

    console.log('[Edge] Résultat config:', { 
      hasConfig: !!stripeConfig, 
      configError: configError ? configError.message : null 
    });

    if (configError || !stripeConfig) {
      console.error('[Edge] Erreur configuration Stripe:', configError);
      return new Response(
        JSON.stringify({ 
          error: 'Configuration Stripe non trouvée',
          details: configError ? configError.message : 'Aucune configuration trouvée'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let stripeSettings;
    try {
      if (typeof stripeConfig.value === "string") {
        stripeSettings = JSON.parse(stripeConfig.value);
      } else if (typeof stripeConfig.value === "object" && stripeConfig.value !== null) {
        // La valeur est déjà un objet, pas besoin de parser
        stripeSettings = stripeConfig.value;
      } else {
        throw new Error("Format inattendu pour la configuration Stripe");
      }
      console.log('[Edge] Configuration Stripe parsée:', { 
        mode: stripeSettings.mode,
        hasTestKey: !!stripeSettings.test_secret_key,
        hasLiveKey: !!stripeSettings.live_secret_key
      });
    } catch (parseError) {
      console.error('[Edge] Erreur parsing configuration Stripe:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Configuration Stripe invalide',
          details: parseError instanceof Error ? parseError.message : String(parseError)
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const stripeSecretKey = stripeSettings.mode === 'live' 
      ? stripeSettings.live_secret_key 
      : stripeSettings.test_secret_key;

    if (!stripeSecretKey) {
      console.error('[Edge] Clé secrète Stripe manquante pour le mode:', stripeSettings.mode);
      return new Response(
        JSON.stringify({ 
          error: 'Clé secrète Stripe manquante',
          details: `Mode: ${stripeSettings.mode}`
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    console.log('[Edge] Client Stripe initialisé avec le mode:', stripeSettings.mode);

    // Find or create customer
    let customer;
    try {
      const customers = await stripe.customers.list({
        email: customerEmail,
        limit: 1
      });

      if (customers.data.length > 0) {
        customer = customers.data[0];
        console.log('[Edge] Client existant trouvé:', customer.id);
      } else {
        // Create new customer
        customer = await stripe.customers.create({
          email: customerEmail,
          metadata: {
            source: 'canard-cowork-space',
            created_via: 'customer_portal'
          }
        });
        console.log('[Edge] Nouveau client créé:', customer.id);
      }
    } catch (stripeError) {
      console.error('[Edge] Erreur Stripe lors de la gestion du client:', stripeError);
      return new Response(
        JSON.stringify({ 
          error: 'Erreur lors de la gestion du client Stripe',
          details: stripeError instanceof Error ? stripeError.message : String(stripeError)
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create customer portal session
    let session;
    try {
      session = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: returnUrl || 'https://canard-cowork.space/dashboard',
        configuration: undefined // Use default configuration
      });

      console.log('[Edge] Session portail créée avec succès:', session.url);
    } catch (sessionError) {
      console.error('[Edge] Erreur création session portail:', sessionError);
      return new Response(
        JSON.stringify({ 
          error: 'Erreur lors de la création de la session portail',
          details: sessionError instanceof Error ? sessionError.message : String(sessionError)
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const successResponse = {
      url: session.url,
      mode: stripeSettings.mode,
      customerId: customer.id
    };

    console.log('[Edge] Réponse de succès:', JSON.stringify(successResponse));

    return new Response(
      JSON.stringify(successResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[Edge] Erreur générale dans create-customer-portal:', error);
    console.error('[Edge] Type d\'erreur:', typeof error);
    console.error('[Edge] Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace');
    
    // Gestion sécurisée de l'erreur pour éviter les problèmes de JSON
    let errorMessage = 'Erreur inconnue';
    let errorDetails = '';
    
    try {
      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = error.stack || '';
      } else {
        errorMessage = String(error);
      }
    } catch (e) {
      errorMessage = 'Erreur lors de la conversion du message d\'erreur';
      errorDetails = String(e);
    }
    
    const errorResponse = {
      error: 'Erreur lors de la création du portail client',
      details: errorMessage,
      stack: errorDetails
    };
    
    console.log('[Edge] Réponse d\'erreur:', JSON.stringify(errorResponse));
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 
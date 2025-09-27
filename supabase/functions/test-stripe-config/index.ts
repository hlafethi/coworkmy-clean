import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log('[Test] Début du test de configuration Stripe');

    // Récupérer la configuration Stripe
    const { data: settings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe')
      .single();

    if (settingsError || !settings) {
      throw new Error("Impossible de lire la configuration Stripe");
    }

    const stripeConfig = settings.value;
    console.log('[Test] Configuration Stripe récupérée:', {
      mode: stripeConfig.mode,
      hasTestKey: !!stripeConfig.test_secret_key,
      hasLiveKey: !!stripeConfig.live_secret_key,
      testKeyPreview: stripeConfig.test_secret_key ? stripeConfig.test_secret_key.substring(0, 8) + '...' : 'N/A',
      liveKeyPreview: stripeConfig.live_secret_key ? stripeConfig.live_secret_key.substring(0, 8) + '...' : 'N/A'
    });

    // Forcer le mode test
    const mode = 'test';
    console.log('[Test] Mode forcé:', mode);

    const STRIPE_SECRET_KEY = stripeConfig.test_secret_key;
    console.log('[Test] Clé utilisée:', STRIPE_SECRET_KEY ? STRIPE_SECRET_KEY.substring(0, 8) + '...' : 'N/A');

    if (!STRIPE_SECRET_KEY) {
      throw new Error(`Clé Stripe ${mode} manquante`);
    }

    // Tester la connexion Stripe
    const { default: Stripe } = await import('https://esm.sh/stripe@12.4.0?target=deno');
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    console.log('[Test] Client Stripe initialisé');

    // Tester la création d'un portail client
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: 'cus_test', // ID de test
        return_url: 'http://localhost:5173/dashboard',
      });
      console.log('[Test] Portail client créé avec succès:', session.url);
    } catch (portalError) {
      console.error('[Test] Erreur lors de la création du portail:', portalError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode: mode,
        config: {
          mode: stripeConfig.mode,
          hasTestKey: !!stripeConfig.test_secret_key,
          hasLiveKey: !!stripeConfig.live_secret_key,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[Test] Erreur:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
}); 
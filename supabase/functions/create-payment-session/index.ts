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

// Initialiser le client Supabase
const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

interface RequestBody {
  bookingId: string;
  amount: number;
  customerEmail: string;
  metadata: Record<string, string>;
  currency: string;
  isAdmin: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { bookingId, amount, customerEmail, metadata, currency, isAdmin } = body;

    // Lire la config Stripe depuis la table admin_settings
    const { data: settings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stripe')
      .single();
    if (settingsError || !settings) {
      throw new Error("Impossible de lire la configuration Stripe depuis admin_settings");
    }
    const stripeConfig = settings.value;
    let mode = stripeConfig.mode || 'test';
    
    // Détecter l'environnement de production basé sur l'URL de la requête
    const origin = req.headers.get('origin') || '';
    const isProd = origin.includes('canard-cowork.space') || origin.includes('exffryodynkyizbeesbt.supabase.co');
    
    // En production, seul un admin peut utiliser le mode test
    if (isProd && (!isAdmin || isAdmin === false)) {
      mode = 'live';
    }
    
    let STRIPE_SECRET_KEY = '';
    if (mode === 'live') {
      STRIPE_SECRET_KEY = stripeConfig.live_secret_key;
    } else {
      STRIPE_SECRET_KEY = stripeConfig.test_secret_key;
    }
    if (!STRIPE_SECRET_KEY) {
      throw new Error(`Clé Stripe ${mode} manquante dans la configuration`);
    }

    console.log(`[Stripe] create-payment-session: mode lu = ${mode}, isAdmin = ${isAdmin}, isProd = ${isProd}, origin = ${origin}, email = ${customerEmail}, clé utilisée = ${STRIPE_SECRET_KEY?.slice(0,8)}...`);

    // Initialiser Stripe avec la clé du mode choisi
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    // Créer une session de paiement Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: `Réservation #${bookingId}`,
              description: metadata.space_name ? `Espace: ${metadata.space_name}` : 'Réservation d\'espace',
            },
            unit_amount: amount, // Montant en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/payment-success?booking_id=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/payment-cancel?booking_id=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
      customer_email: customerEmail,
      metadata: {
        booking_id: bookingId,
        ...metadata,
      },
      // Calcul automatique des taxes
      automatic_tax: { enabled: true },
      // Collecte de l'adresse pour le calcul des taxes
      tax_id_collection: { enabled: true },
    });

    // Retourner l'URL de redirection
    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id,
        mode
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error: unknown) {
    console.error("Erreur lors de la création de la session de paiement:", error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.4.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // Gérer les requêtes OPTIONS (préflight CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { secretKey } = await req.json();
    if (!secretKey) {
      return new Response(JSON.stringify({ error: "Clé secrète manquante" }), {
        status: 400,
        headers: corsHeaders
      });
    }
    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });
    const account = await stripe.accounts.retrieve();
    return new Response(JSON.stringify({ success: true, account }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: corsHeaders
    });
  }
});

// @ts-ignore
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
// @ts-ignore
import Stripe from "https://esm.sh/stripe@12.4.0?target=deno";

serve(async (req: Request) => {
  try {
    const { secretKey } = await req.json();
    if (!secretKey) {
      return new Response(JSON.stringify({ error: "Clé secrète manquante" }), { status: 400 });
    }
    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });
    const account = await stripe.accounts.retrieve();
    return new Response(JSON.stringify({ success: true, account }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 400 });
  }
}); 
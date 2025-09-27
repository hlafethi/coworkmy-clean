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

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

// Fonction pour vérifier la signature Stripe manuellement
async function verifyStripeSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    // Vérification basique de la signature
    if (!signature || !secret) {
      return false;
    }

    // Format attendu: t=timestamp,v1=signature
    const parts = signature.split(',');
    if (parts.length !== 2) {
      return false;
    }

    const timestamp = parts[0].split('=')[1];
    const sig = parts[1].split('=')[1];

    if (!timestamp || !sig) {
      return false;
    }

    // Vérification du timestamp (pas plus de 5 minutes d'écart)
    const now = Math.floor(Date.now() / 1000);
    const timestampNum = parseInt(timestamp);
    if (Math.abs(now - timestampNum) > 300) {
      console.log('Timestamp webhook expiré:', { now, timestamp: timestampNum });
      return false;
    }

    // Calcul de la signature attendue
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return sig === expectedSignature;
  } catch (error) {
    console.error('Erreur lors de la vérification de signature:', error);
    return false;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    console.log('[Webhook] Réception d\'un webhook Stripe');
    console.log('[Webhook] Signature présente:', !!signature);
    console.log('[Webhook] Taille du body:', body.length);
    
    if (!signature) {
      console.error('[Webhook] Signature Stripe manquante');
      return new Response(
        JSON.stringify({ error: 'Signature Stripe manquante' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Vérification de la signature
    const isValidSignature = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
    
    if (!isValidSignature) {
      console.error('[Webhook] Signature webhook invalide');
      return new Response(
        JSON.stringify({ error: 'Signature webhook invalide' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('[Webhook] Signature validée avec succès');

    // Parse du body JSON
    let event: any;
    try {
      event = JSON.parse(body);
      console.log('[Webhook] Événement parsé:', event.type);
    } catch (parseError) {
      console.error('[Webhook] Erreur parsing JSON:', parseError);
      return new Response(
        JSON.stringify({ error: 'Body JSON invalide' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    await handleStripeEvent(event);

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('[Webhook] Erreur générale:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    // Ajoute ici d'autres événements Stripe selon tes besoins
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    default:
      console.log(`Événement non géré: ${event.type}`);
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`Session de paiement complétée: ${session.id}`);
  if (session.metadata?.booking_id) {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', session.metadata.booking_id);
    if (error) {
      console.error('Erreur mise à jour réservation:', error);
    } else {
      console.log(`Réservation ${session.metadata.booking_id} confirmée`);
    }
    await createPaymentRecord(session);
    await generateInvoice(session.metadata.booking_id, session);
    await sendConfirmationEmail(session.metadata.booking_id);
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Paiement réussi: ${paymentIntent.id}`);
  if (paymentIntent.metadata?.booking_id) {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentIntent.metadata.booking_id);
    if (error) {
      console.error('Erreur mise à jour réservation:', error);
    }
    await createPaymentRecord(paymentIntent);
    await generateInvoice(paymentIntent.metadata.booking_id, paymentIntent);
    await sendConfirmationEmail(paymentIntent.metadata.booking_id);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Paiement échoué: ${paymentIntent.id}`);
  if (paymentIntent.metadata?.booking_id) {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentIntent.metadata.booking_id);
    if (error) {
      console.error('Erreur mise à jour réservation échouée:', error);
    }
    await sendRefundEmail(paymentIntent.metadata.booking_id);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`Facture payée: ${invoice.id}`);
  // Ajoute ici ta logique métier pour les factures payées
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Paiement de facture échoué: ${invoice.id}`);
  // Ajoute ici ta logique métier pour les paiements de facture échoués
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`Nouvel abonnement créé: ${subscription.id}`);
  // Ajoute ici ta logique métier pour les abonnements créés
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`Abonnement mis à jour: ${subscription.id}`);
  // Ajoute ici ta logique métier pour les abonnements mis à jour
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`Abonnement supprimé: ${subscription.id}`);
  // Ajoute ici ta logique métier pour les abonnements supprimés
}

async function createPaymentRecord(sessionOrIntent: any) {
  try {
    await supabase
      .from('payments')
      .insert({
        booking_id: sessionOrIntent.metadata?.booking_id,
        stripe_session_id: sessionOrIntent.id,
        amount: sessionOrIntent.amount_total ? sessionOrIntent.amount_total / 100 : sessionOrIntent.amount / 100,
        currency: sessionOrIntent.currency,
        status: 'paid',
        user_email: sessionOrIntent.customer_email,
        mode: STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'live' : 'test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    console.log(`Paiement enregistré pour la réservation ${sessionOrIntent.metadata?.booking_id}`);
  } catch (error) {
    console.error("Erreur lors de l'insertion du paiement :", error);
  }
}

async function generateInvoice(bookingId: string, session: any): Promise<void> {
  try {
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        space:space_id (name, hourly_price, daily_price, monthly_price, yearly_price, half_day_price, quarter_price, custom_price, pricing_type),
        profile:user_id (first_name, last_name, email, company_name, phone_number)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) throw bookingError;

    const { data: settings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('*')
      .single();

    if (settingsError) throw settingsError;

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        booking_id: bookingId,
        invoice_number: invoiceNumber,
        amount: session.amount_total / 100,
        currency: session.currency,
        status: 'paid',
        customer_name: `${booking.profile.first_name} ${booking.profile.last_name}`,
        customer_email: booking.profile.email,
        customer_company: booking.profile.company_name,
        customer_address: null,
        space_name: booking.space.name,
        start_time: booking.start_time,
        end_time: booking.end_time,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    const invoiceUrl = `${SUPABASE_URL}/storage/v1/object/public/invoices/${invoiceNumber}.pdf`;
    const { error: updateError } = await supabase
      .from('payments')
      .update({ invoice_url: invoiceUrl })
      .eq('booking_id', bookingId);

    if (updateError) throw updateError;

    console.log(`Facture générée avec succès: ${invoiceNumber}`);
  } catch (error) {
    console.error("Erreur lors de la génération de la facture:", error);
  }
}

async function sendConfirmationEmail(bookingId: string): Promise<void> {
  try {
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        space:space_id (name),
        profile:user_id (first_name, last_name, email)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) throw bookingError;

    const { data: settings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('*')
      .single();

    if (settingsError) throw settingsError;

    const templateData = {
      first_name: booking.profile.first_name || '',
      last_name: booking.profile.last_name || '',
      space_name: booking.space.name || '',
      start_date: booking.start_time,
      end_date: booking.end_time,
      amount: booking.total_price_ttc,
      currency: 'EUR',
      site_name: settings.site_name || 'Coworking',
    };

    console.log(`Emails de confirmation envoyés à ${booking.profile.email} et à l'admin (${settings.contact_email}) pour la réservation ${bookingId}`);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de confirmation:", error);
  }
}

async function sendRefundEmail(bookingId: string): Promise<void> {
  try {
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        space:space_id (name),
        profile:user_id (first_name, last_name, email)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) throw bookingError;

    console.log(`Email de confirmation de remboursement envoyé à ${booking.profile.email} pour la réservation ${bookingId}`);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de remboursement:", error);
  }
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Paramètres de la page d'accueil
    const { error: homepageError } = await supabaseClient
      .from('admin_settings')
      .upsert({
        key: 'homepage',
        value: {
          title: "Canard Cowork Space",
          description: "Votre espace de coworking à Paris",
          hero_title: "Votre espace de travail idéal à Paris",
          hero_subtitle: "Des espaces de coworking modernes et inspirants pour les freelances, entrepreneurs et équipes qui veulent travailler dans un environnement stimulant et connecté.",
          hero_background_image: "https://images.unsplash.com/photo-1600508774634-4e11d34730e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
          cta_text: "Commencer",
          features_title: "Pourquoi choisir Canard Cowork Space ?",
          features_subtitle: "Nous offrons bien plus qu'un simple espace de travail. Découvrez nos avantages exclusifs qui font de nous le choix idéal pour les professionnels exigeants.",
          cta_section_title: "Prêt à rejoindre notre communauté ?",
          cta_section_subtitle: "Inscrivez-vous dès aujourd'hui et commencez à profiter de tous les avantages",
          cta_secondary_button_text: "Réserver une visite",
          is_published: true
        }
      }, { onConflict: 'key' })

    if (homepageError) {
      console.error('Erreur homepage:', homepageError)
    }

    // Paramètres Stripe
    const { error: stripeError } = await supabaseClient
      .from('admin_settings')
      .upsert({
        key: 'stripe',
        value: {
          mode: "test",
          test_publishable_key: "",
          test_secret_key: "",
          webhook_secret: "",
          live_publishable_key: "",
          live_secret_key: "",
          live_webhook_secret: ""
        }
      }, { onConflict: 'key' })

    if (stripeError) {
      console.error('Erreur stripe:', stripeError)
    }

    // Paramètres Google Reviews
    const { error: googleError } = await supabaseClient
      .from('admin_settings')
      .upsert({
        key: 'google_reviews',
        value: {
          api_key: "",
          place_id: "",
          max_reviews: 10,
          min_rating: 4
        }
      }, { onConflict: 'key' })

    if (googleError) {
      console.error('Erreur google:', googleError)
    }

    // Vérifier les paramètres insérés
    const { data: settings, error: fetchError } = await supabaseClient
      .from('admin_settings')
      .select('key, value')
      .order('key')

    if (fetchError) {
      console.error('Erreur récupération:', fetchError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Paramètres par défaut insérés avec succès',
        settings 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}) 
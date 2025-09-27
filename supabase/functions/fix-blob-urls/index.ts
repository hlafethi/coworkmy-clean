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

    // Récupérer les paramètres homepage actuels
    const { data: currentSettings, error: fetchError } = await supabaseClient
      .from('admin_settings')
      .select('key, value')
      .eq('key', 'homepage')
      .maybeSingle()

    if (fetchError) {
      console.error('Erreur récupération settings:', fetchError)
      throw fetchError
    }

    console.log('Paramètres actuels:', currentSettings)

    // Vérifier si l'image d'arrière-plan est un blob
    const currentImageUrl = currentSettings?.value?.hero_background_image
    const isBlobUrl = currentImageUrl && currentImageUrl.startsWith('blob:')

    if (isBlobUrl) {
      console.log('URL blob détectée, correction en cours...')
      
      // Corriger l'URL blob
      const { error: updateError } = await supabaseClient
        .from('admin_settings')
        .update({
          value: {
            ...currentSettings.value,
            hero_background_image: 'https://images.unsplash.com/photo-1600508774634-4e11d34730e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'
          }
        })
        .eq('key', 'homepage')

      if (updateError) {
        console.error('Erreur mise à jour:', updateError)
        throw updateError
      }

      console.log('URL blob corrigée avec succès')
    } else {
      console.log('Aucune URL blob détectée, pas de correction nécessaire')
    }

    // Récupérer les paramètres corrigés
    const { data: correctedSettings, error: finalFetchError } = await supabaseClient
      .from('admin_settings')
      .select('key, value')
      .eq('key', 'homepage')
      .maybeSingle()

    if (finalFetchError) {
      console.error('Erreur récupération finale:', finalFetchError)
      throw finalFetchError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isBlobUrl ? 'URL blob corrigée avec succès' : 'Aucune correction nécessaire',
        settings: correctedSettings,
        wasBlobUrl: isBlobUrl
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
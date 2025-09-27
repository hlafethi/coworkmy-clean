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

    // Script pour corriger les publications Realtime des FAQ
    const sql = `
      -- 1. Vérifier les publications existantes
      SELECT 
          schemaname,
          tablename,
          pubname
      FROM pg_publication_tables 
      WHERE tablename = 'support_faqs';

      -- 2. Supprimer la table de la publication si elle existe déjà
      DO $$
      BEGIN
          -- Supprimer support_faqs de la publication si elle existe
          IF EXISTS (
              SELECT 1 FROM pg_publication_tables 
              WHERE pubname = 'supabase_realtime' 
              AND tablename = 'support_faqs'
          ) THEN
              ALTER PUBLICATION supabase_realtime DROP TABLE support_faqs;
              RAISE NOTICE 'Table support_faqs supprimée de la publication supabase_realtime';
          ELSE
              RAISE NOTICE 'Table support_faqs n''était pas dans la publication supabase_realtime';
          END IF;
      END $$;

      -- 3. Ajouter la table à la publication
      ALTER PUBLICATION supabase_realtime ADD TABLE support_faqs;

      -- 4. Vérifier que l'ajout a fonctionné
      SELECT 
          schemaname,
          tablename,
          pubname
      FROM pg_publication_tables 
      WHERE tablename = 'support_faqs';
    `

    const { data, error } = await supabaseClient.rpc('exec_sql', { sql_query: sql })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Publications Realtime FAQ corrigées avec succès',
        data 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
}) 
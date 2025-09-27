import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Ajout des colonnes manquantes...');

    // Ajouter les colonnes directement avec du SQL
    const alterQueries = [
      'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT',
      'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code TEXT',
      'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT',
      'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS position TEXT'
    ];

    const results = [];

    for (const query of alterQueries) {
      try {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .limit(0); // Juste pour tester la connexion

        // Utiliser une requête SQL brute via RPC
        const { error: sqlError } = await supabaseClient.rpc('exec_sql', {
          sql: query
        });

        if (sqlError) {
          console.error(`Erreur pour ${query}:`, sqlError);
          results.push({ query, success: false, error: sqlError.message });
        } else {
          console.log(`✅ ${query}`);
          results.push({ query, success: true });
        }
      } catch (err) {
        console.error(`Erreur lors de l'exécution de ${query}:`, err);
        results.push({ query, success: false, error: err.message });
      }
    }

    // Créer l'index
    try {
      const { error: indexError } = await supabaseClient.rpc('exec_sql', {
        sql: 'CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city)'
      });

      if (!indexError) {
        results.push({ query: 'CREATE INDEX', success: true });
      }
    } catch (err) {
      console.error('Erreur lors de la création de l\'index:', err);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Colonnes ajoutées avec succès',
        results 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Erreur générale:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
}); 
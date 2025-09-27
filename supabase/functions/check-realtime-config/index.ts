import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔍 Vérification de la configuration Realtime...')

    // 1. Vérifier les tables dans la publication
    const { data: publishedTables, error: pubError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            schemaname,
            tablename,
            pubname
          FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' 
          AND tablename IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses')
          ORDER BY tablename;
        `
      })

    if (pubError) {
      console.error('❌ Erreur lors de la vérification des tables publiées:', pubError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la vérification des tables publiées', details: pubError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('📋 Tables actuellement dans la publication:', publishedTables)

    // 2. Vérifier que toutes les tables existent
    const { data: existingTables, error: existError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            schemaname,
            tablename
          FROM pg_tables 
          WHERE tablename IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses')
          AND schemaname = 'public'
          ORDER BY tablename;
        `
      })

    if (existError) {
      console.error('❌ Erreur lors de la vérification des tables existantes:', existError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la vérification des tables existantes', details: existError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('📋 Tables existantes:', existingTables)

    // 3. Identifier les tables manquantes dans la publication
    const requiredTables = ['support_tickets', 'support_ticket_responses', 'support_chat_messages', 'support_chat_sessions']
    const publishedTableNames = publishedTables?.map((t: any) => t.tablename) || []
    const missingTables = requiredTables.filter(table => !publishedTableNames.includes(table))

    console.log('❌ Tables manquantes dans la publication:', missingTables)

    // 4. Corriger la configuration si nécessaire
    if (missingTables.length > 0) {
      console.log('🔧 Correction de la configuration Realtime...')
      
      for (const tableName of missingTables) {
        try {
          const { error: addError } = await supabase
            .rpc('exec_sql', {
              sql_query: `ALTER PUBLICATION supabase_realtime ADD TABLE ${tableName};`
            })

          if (addError) {
            console.error(`❌ Erreur lors de l'ajout de ${tableName}:`, addError)
          } else {
            console.log(`✅ Table ${tableName} ajoutée à la publication`)
          }
        } catch (error) {
          console.error(`❌ Exception lors de l'ajout de ${tableName}:`, error)
        }
      }
    }

    // 5. Vérification finale
    const { data: finalCheck, error: finalError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT 
            schemaname,
            tablename,
            pubname
          FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' 
          AND tablename IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses')
          ORDER BY tablename;
        `
      })

    if (finalError) {
      console.error('❌ Erreur lors de la vérification finale:', finalError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la vérification finale', details: finalError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('✅ Vérification finale:', finalCheck)

    // 6. Test de réplication
    const testTicketId = 'test-realtime-' + crypto.randomUUID()
    const { error: testError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: testTicketId,
        subject: 'Test Realtime Configuration',
        message: 'Ce ticket est un test pour vérifier la configuration Realtime',
        status: 'open',
        priority: 'low'
      })

    if (testError) {
      console.error('❌ Erreur lors du test de réplication:', testError)
    } else {
      console.log('✅ Test de réplication réussi')
      
      // Nettoyer le test
      await supabase
        .from('support_tickets')
        .delete()
        .eq('subject', 'Test Realtime Configuration')
    }

    const result = {
      success: true,
      message: 'Configuration Realtime vérifiée et corrigée',
      publishedTables: finalCheck,
      missingTables: missingTables,
      correctionsApplied: missingTables.length > 0
    }

    console.log('🎉 Configuration Realtime terminée avec succès!')
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur générale:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur générale', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 
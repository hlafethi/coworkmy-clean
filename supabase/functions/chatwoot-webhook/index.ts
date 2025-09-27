// @ts-ignore - Ignore TypeScript errors for Deno and http/server imports
// These are Deno-specific modules that are only available at runtime in the Supabase Edge Functions environment
// The TypeScript errors in this file can be safely ignored as they won't affect the functionality when deployed
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore - Deno namespace is available at runtime in Supabase Edge Functions
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
// @ts-ignore - Deno namespace is available at runtime in Supabase Edge Functions
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req: Request) => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const payload = await req.json();
    
    // Traiter les événements Chatwoot
    if (payload.event === 'conversation_created' || payload.event === 'conversation_updated') {
      const { conversation } = payload;
      const { meta } = conversation;
      
      // Extraire l'ID utilisateur des métadonnées
      const userId = meta?.sender?.id;
      
      if (userId) {
        // Mettre à jour ou créer l'enregistrement dans Supabase
        const { error } = await supabase
          .from('chat_conversations')
          .upsert({
            user_id: userId,
            chatwoot_conversation_id: conversation.id,
            status: conversation.status,
            last_message: conversation.last_message?.content,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'chatwoot_conversation_id'
          });
          
        if (error) throw error;
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400
    });
  }
});

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DbConfig {
  type: "mysql" | "postgresql";
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { config } = await req.json() as { config: DbConfig };
    
    // Simuler une initialisation de base de données réussie
    // Cette version simplifiée ne se connecte pas réellement à la base de données
    // mais renvoie une réponse de succès pour tester le déploiement
    
    return new Response(
      JSON.stringify({ 
        message: "Base de données initialisée avec succès (simulation)",
        config: {
          type: config.type,
          host: config.host,
          database: config.database
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});

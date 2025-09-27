// @ts-ignore: Deno module resolution
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
// @ts-ignore: Deno module resolution
import { Client as PgClient } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
// @ts-ignore: Deno module resolution
import { Client as MySQLClient } from "https://deno.land/x/mysql@v2.11.0/mod.ts";

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

    if (config.type === "postgresql") {
      const client = new PgClient({
        hostname: config.host,
        port: parseInt(config.port),
        database: config.database,
        user: config.username,
        password: config.password,
      });

      await client.connect();
      await client.queryArray`SELECT 1`;
      await client.end();
    } else {
      const client = await new MySQLClient().connect({
        hostname: config.host,
        port: parseInt(config.port),
        username: config.username,
        password: config.password,
        db: config.database,
      });

      await client.execute("SELECT 1");
      await client.close();
    }

    return new Response(
      JSON.stringify({ message: "Connexion à la base de données réussie" }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});

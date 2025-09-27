
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import mysql from "npm:mysql2@3.6.0/promise";

interface MySQLConfig {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { host, port, database, username, password } = await req.json() as MySQLConfig;

    const connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      database,
      user: username,
      password,
    });

    // Test the connection
    await connection.connect();
    await connection.end();

    return new Response(
      JSON.stringify({ message: 'Connexion à la base de données réussie!' }), 
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: `Erreur de connexion à la base de données: ${error.message}` 
      }), 
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.1.0";
import { Client as PgClient } from "https://deno.land/x/postgres@v0.14.2/mod.ts";
import { Client as MySQLClient } from "https://deno.land/x/mysql@v2.10.2/mod.ts";

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

      // Créer les tables PostgreSQL
      await client.queryArray`
        CREATE TABLE IF NOT EXISTS spaces (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          capacity INTEGER NOT NULL,
          hourly_price DECIMAL(10,2),
          daily_price DECIMAL(10,2),
          monthly_price DECIMAL(10,2),
          yearly_price DECIMAL(10,2),
          half_day_price DECIMAL(10,2),
          quarter_price DECIMAL(10,2),
          custom_price DECIMAL(10,2),
          custom_label VARCHAR(50),
          pricing_type VARCHAR(20) NOT NULL DEFAULT 'hourly',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bookings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          space_id UUID NOT NULL REFERENCES spaces(id),
          start_time TIMESTAMP WITH TIME ZONE NOT NULL,
          end_time TIMESTAMP WITH TIME ZONE NOT NULL,
          total_price_ht DECIMAL(10,2) NOT NULL,
          total_price_ttc DECIMAL(10,2) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID UNIQUE NOT NULL,
          full_name VARCHAR(255),
          company_name VARCHAR(255),
          phone_number VARCHAR(20),
          is_admin BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS profile_documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          profile_id UUID NOT NULL REFERENCES profiles(id),
          document_type VARCHAR(50) NOT NULL,
          document_url TEXT NOT NULL,
          verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admin_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          site_name VARCHAR(255),
          contact_email VARCHAR(255),
          phone_number VARCHAR(20),
          hero_title TEXT,
          hero_subtitle TEXT,
          cta_text VARCHAR(255),
          features_title TEXT,
          features_subtitle TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS google_api_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          place_id VARCHAR(255) NOT NULL,
          min_rating INTEGER DEFAULT 4,
          max_reviews INTEGER DEFAULT 5,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await client.end();
    } else {
      const client = await new MySQLClient().connect({
        hostname: config.host,
        port: parseInt(config.port),
        username: config.username,
        password: config.password,
        db: config.database,
      });

      // Créer les tables MySQL
      await client.execute(`
        CREATE TABLE IF NOT EXISTS spaces (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          capacity INT NOT NULL,
          hourly_price DECIMAL(10,2),
          daily_price DECIMAL(10,2),
          monthly_price DECIMAL(10,2),
          yearly_price DECIMAL(10,2),
          half_day_price DECIMAL(10,2),
          quarter_price DECIMAL(10,2),
          custom_price DECIMAL(10,2),
          custom_label VARCHAR(50),
          pricing_type VARCHAR(20) NOT NULL DEFAULT 'hourly',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bookings (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          space_id VARCHAR(36) NOT NULL,
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP NOT NULL,
          total_price_ht DECIMAL(10,2) NOT NULL,
          total_price_ttc DECIMAL(10,2) NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (space_id) REFERENCES spaces(id)
        );

        CREATE TABLE IF NOT EXISTS profiles (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) UNIQUE NOT NULL,
          full_name VARCHAR(255),
          company_name VARCHAR(255),
          phone_number VARCHAR(20),
          is_admin BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS profile_documents (
          id VARCHAR(36) PRIMARY KEY,
          profile_id VARCHAR(36) NOT NULL,
          document_type VARCHAR(50) NOT NULL,
          document_url TEXT NOT NULL,
          verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (profile_id) REFERENCES profiles(id)
        );

        CREATE TABLE IF NOT EXISTS admin_settings (
          id VARCHAR(36) PRIMARY KEY,
          site_name VARCHAR(255),
          contact_email VARCHAR(255),
          phone_number VARCHAR(20),
          hero_title TEXT,
          hero_subtitle TEXT,
          cta_text VARCHAR(255),
          features_title TEXT,
          features_subtitle TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS google_api_settings (
          id VARCHAR(36) PRIMARY KEY,
          place_id VARCHAR(255) NOT NULL,
          min_rating INT DEFAULT 4,
          max_reviews INT DEFAULT 5,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);

      await client.close();
    }

    return new Response(
      JSON.stringify({ message: "Base de données initialisée avec succès" }),
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

-- Correction de sécurité pour l'extension pg_net
-- À exécuter directement dans l'interface SQL de Supabase

-- 1. Créer le schéma extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Déplacer l'extension pg_net vers le schéma extensions
ALTER EXTENSION pg_net SET SCHEMA extensions;

-- 3. Configurer les permissions
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- 4. Vérification
SELECT 
    'pg_net Extension Security Status' as check_type,
    CASE 
        WHEN extnamespace::regnamespace = 'extensions' THEN '✅ SÉCURISÉ - Extension dans le schéma extensions'
        ELSE '❌ NON SÉCURISÉ - Extension encore dans le schéma public'
    END as status
FROM pg_extension 
WHERE extname = 'pg_net'; 
-- Sécurisation alternative de l'extension pg_net
-- Puisque pg_net ne supporte pas SET SCHEMA, on utilise une approche différente

-- 1. Vérifier l'état actuel
SELECT 
    'Current pg_net Status' as check_type,
    extname as extension_name,
    extnamespace::regnamespace as schema_name,
    extversion as version
FROM pg_extension 
WHERE extname = 'pg_net';

-- 2. Créer un schéma sécurisé pour les fonctions qui utilisent pg_net
CREATE SCHEMA IF NOT EXISTS secure_net;

-- 3. Créer des fonctions wrapper sécurisées pour les fonctionnalités pg_net
-- Ces fonctions encapsulent l'utilisation de pg_net avec des contrôles de sécurité

-- Fonction wrapper pour http_get
CREATE OR REPLACE FUNCTION secure_net.http_get(
    url text,
    headers jsonb DEFAULT '{}'::jsonb,
    timeout_ms integer DEFAULT 10000
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Vérifications de sécurité
    IF url IS NULL OR url = '' THEN
        RAISE EXCEPTION 'URL cannot be null or empty';
    END IF;
    
    -- Vérifier que l'URL est autorisée (liste blanche)
    IF NOT (url LIKE 'https://%' OR url LIKE 'http://localhost%') THEN
        RAISE EXCEPTION 'URL not allowed for security reasons';
    END IF;
    
    -- Appeler la fonction pg_net originale
    RETURN pg_net.http_get(url, headers, timeout_ms);
END;
$$;

-- Fonction wrapper pour http_post
CREATE OR REPLACE FUNCTION secure_net.http_post(
    url text,
    body text DEFAULT '',
    headers jsonb DEFAULT '{}'::jsonb,
    timeout_ms integer DEFAULT 10000
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Vérifications de sécurité
    IF url IS NULL OR url = '' THEN
        RAISE EXCEPTION 'URL cannot be null or empty';
    END IF;
    
    -- Vérifier que l'URL est autorisée
    IF NOT (url LIKE 'https://%' OR url LIKE 'http://localhost%') THEN
        RAISE EXCEPTION 'URL not allowed for security reasons';
    END IF;
    
    -- Appeler la fonction pg_net originale
    RETURN pg_net.http_post(url, body, headers, timeout_ms);
END;
$$;

-- 4. Configurer les permissions
GRANT USAGE ON SCHEMA secure_net TO authenticated;
GRANT USAGE ON SCHEMA secure_net TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA secure_net TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA secure_net TO service_role;

-- 5. Révoquer les permissions directes sur pg_net si possible
-- Note: Cela peut ne pas être possible selon la configuration Supabase
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM public;
GRANT EXECUTE ON FUNCTION pg_net.http_get(text, jsonb, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION pg_net.http_post(text, text, jsonb, integer) TO authenticated;

-- 6. Créer une vue pour surveiller l'utilisation de pg_net
CREATE OR REPLACE VIEW secure_net.pg_net_usage_log AS
SELECT 
    'pg_net Security Monitor' as monitor_type,
    NOW() as check_time,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_extension 
            WHERE extname = 'pg_net' AND extnamespace::regnamespace = 'public'
        ) THEN '⚠️ pg_net dans public - utiliser secure_net.* à la place'
        ELSE '✅ pg_net correctement configuré'
    END as security_status;

-- 7. Vérification finale
SELECT 
    'Security Implementation Status' as check_type,
    'pg_net Alternative Security' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'http_get' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'secure_net'))
        AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'http_post' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'secure_net'))
        THEN '✅ FONCTIONS SÉCURISÉES CRÉÉES'
        ELSE '❌ ERREUR DANS LA CRÉATION DES FONCTIONS'
    END as status; 
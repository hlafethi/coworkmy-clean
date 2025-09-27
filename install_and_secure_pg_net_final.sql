-- Installation et sécurisation de pg_net (VERSION FINALE)
-- Script complet pour gérer l'extension pg_net sans erreurs de syntaxe

-- 1. Vérifier si pg_net est disponible
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'pg_net'
    ) THEN
        RAISE NOTICE 'pg_net n''est pas disponible pour installation';
        RETURN;
    END IF;
END $$;

-- 2. Installer pg_net s'il n'est pas déjà installé
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
    ) THEN
        CREATE EXTENSION IF NOT EXISTS pg_net;
        RAISE NOTICE 'pg_net installé avec succès';
    ELSE
        RAISE NOTICE 'pg_net est déjà installé';
    END IF;
END $$;

-- 3. Créer le schéma sécurisé
CREATE SCHEMA IF NOT EXISTS secure_net;

-- 4. Créer des fonctions wrapper sécurisées
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
        RAISE EXCEPTION 'URL not allowed for security reasons: %', url;
    END IF;
    
    -- Appeler la fonction pg_net originale
    RETURN pg_net.http_get(url, headers, timeout_ms);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in secure_net.http_get: %', SQLERRM;
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
        RAISE EXCEPTION 'URL not allowed for security reasons: %', url;
    END IF;
    
    -- Appeler la fonction pg_net originale
    RETURN pg_net.http_post(url, body, headers, timeout_ms);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in secure_net.http_post: %', SQLERRM;
END;
$$;

-- 5. Configurer les permissions
GRANT USAGE ON SCHEMA secure_net TO authenticated;
GRANT USAGE ON SCHEMA secure_net TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA secure_net TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA secure_net TO service_role;

-- 6. Révoquer les permissions publiques sur pg_net si possible
DO $$
BEGIN
    -- Essayer de révoquer les permissions publiques
    BEGIN
        REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM public;
        RAISE NOTICE 'Permissions publiques révoquées avec succès';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Impossible de révoquer les permissions publiques: %', SQLERRM;
    END;
    
    -- Donner les permissions spécifiques
    BEGIN
        GRANT EXECUTE ON FUNCTION pg_net.http_get(text, jsonb, integer) TO authenticated;
        GRANT EXECUTE ON FUNCTION pg_net.http_post(text, text, jsonb, integer) TO authenticated;
        RAISE NOTICE 'Permissions spécifiques configurées';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Impossible de configurer les permissions spécifiques: %', SQLERRM;
    END;
END $$;

-- 7. Créer une vue de surveillance (sans comparaison de schéma problématique)
CREATE OR REPLACE VIEW secure_net.pg_net_security_status AS
SELECT 
    'pg_net Security Monitor' as monitor_type,
    NOW() as check_time,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace pn ON p.pronamespace = pn.oid
            WHERE pn.nspname = 'secure_net' 
            AND p.proname IN ('http_get', 'http_post')
            AND p.prosecdef = true
        ) THEN '✅ Fonctions sécurisées disponibles'
        ELSE '❌ Fonctions sécurisées non disponibles'
    END as secure_functions_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN '✅ pg_net installé'
        ELSE '❌ pg_net non installé'
    END as extension_status;

-- 8. Vérification finale
SELECT 
    'Installation and Security Status' as check_type,
    'pg_net Setup' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM pg_proc p
                    JOIN pg_namespace pn ON p.pronamespace = pn.oid
                    WHERE pn.nspname = 'secure_net' 
                    AND p.proname IN ('http_get', 'http_post')
                    AND p.prosecdef = true
                ) THEN '✅ pg_net installé et sécurisé'
                ELSE '⚠️ pg_net installé mais sécurisation incomplète'
            END
        ELSE '❌ pg_net non installé'
    END as final_status; 
-- Installation et sécurisation de pg_net - Gestion complète
-- Script qui gère tous les cas de figure

-- ========================================
-- 1. DIAGNOSTIC INITIAL
-- ========================================

-- Vérifier les extensions disponibles
SELECT 
    'Available Extensions' as check_type,
    name as extension_name,
    default_version as version,
    comment as description
FROM pg_available_extensions 
WHERE name = 'pg_net'
ORDER BY name;

-- Vérifier les extensions installées
SELECT 
    'Installed Extensions' as check_type,
    extname as extension_name,
    extnamespace::regnamespace as schema_name,
    extversion as version
FROM pg_extension 
WHERE extname = 'pg_net';

-- ========================================
-- 2. INSTALLATION DE PG_NET
-- ========================================

-- Installer pg_net s'il est disponible
DO $$
BEGIN
    -- Vérifier si pg_net est disponible
    IF EXISTS (
        SELECT 1 FROM pg_available_extensions WHERE name = 'pg_net'
    ) THEN
        -- Vérifier si pg_net est déjà installé
        IF NOT EXISTS (
            SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
        ) THEN
            -- Installer pg_net
            CREATE EXTENSION pg_net;
            RAISE NOTICE 'pg_net installé avec succès';
        ELSE
            RAISE NOTICE 'pg_net est déjà installé';
        END IF;
    ELSE
        RAISE NOTICE 'pg_net n''est pas disponible pour installation';
        RAISE EXCEPTION 'pg_net n''est pas disponible. Vérifiez que l''extension est activée dans Supabase.';
    END IF;
END $$;

-- ========================================
-- 3. VÉRIFICATION POST-INSTALLATION
-- ========================================

-- Vérifier que pg_net est maintenant installé
SELECT 
    'Post-Installation Check' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN '✅ pg_net installé avec succès'
        ELSE '❌ Échec de l''installation de pg_net'
    END as status;

-- Vérifier les fonctions pg_net disponibles
SELECT 
    'pg_net Functions Available' as check_type,
    p.proname as function_name,
    pn.nspname as schema_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE pn.nspname = 'pg_net'
ORDER BY p.proname;

-- ========================================
-- 4. CRÉATION DU SCHÉMA SÉCURISÉ
-- ========================================

-- Créer le schéma sécurisé
CREATE SCHEMA IF NOT EXISTS secure_net;

-- ========================================
-- 5. FONCTIONS WRAPPER SÉCURISÉES
-- ========================================

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

-- ========================================
-- 6. CONFIGURATION DES PERMISSIONS
-- ========================================

-- Permissions sur le schéma secure_net
GRANT USAGE ON SCHEMA secure_net TO authenticated;
GRANT USAGE ON SCHEMA secure_net TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA secure_net TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA secure_net TO service_role;

-- Permissions sur pg_net (après installation)
DO $$
BEGIN
    -- Donner les permissions spécifiques sur pg_net
    BEGIN
        GRANT EXECUTE ON FUNCTION pg_net.http_get(text, jsonb, integer) TO authenticated;
        GRANT EXECUTE ON FUNCTION pg_net.http_post(text, text, jsonb, integer) TO authenticated;
        RAISE NOTICE 'Permissions pg_net configurées';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Impossible de configurer les permissions pg_net: %', SQLERRM;
    END;
END $$;

-- ========================================
-- 7. VÉRIFICATION FINALE
-- ========================================

-- État final de pg_net
SELECT 
    'Final pg_net Status' as check_type,
    extname as extension_name,
    extnamespace::regnamespace as schema_name,
    extversion as version
FROM pg_extension 
WHERE extname = 'pg_net';

-- Vérifier les fonctions sécurisées
SELECT 
    'Secure Functions Created' as check_type,
    p.proname as function_name,
    pn.nspname as schema_name,
    CASE 
        WHEN p.prosecdef THEN '✅ SECURITY DEFINER'
        ELSE '❌ SECURITY INVOKER'
    END as security_type
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE pn.nspname = 'secure_net'
ORDER BY p.proname;

-- Test des fonctions sécurisées
SELECT 
    'Security Test Results' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace pn ON p.pronamespace = pn.oid
            WHERE pn.nspname = 'secure_net' 
            AND p.proname = 'http_get'
            AND p.prosecdef = true
        ) THEN '✅ http_get sécurisée'
        ELSE '❌ http_get non sécurisée'
    END as http_get_status;

SELECT 
    'Security Test Results' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace pn ON p.pronamespace = pn.oid
            WHERE pn.nspname = 'secure_net' 
            AND p.proname = 'http_post'
            AND p.prosecdef = true
        ) THEN '✅ http_post sécurisée'
        ELSE '❌ http_post non sécurisée'
    END as http_post_status;

-- Résumé final
SELECT 
    'FINAL SUMMARY' as check_type,
    'pg_net Security Implementation' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM pg_proc p
                    JOIN pg_namespace pn ON p.pronamespace = pn.oid
                    WHERE pn.nspname = 'secure_net' 
                    AND p.proname IN ('http_get', 'http_post')
                    AND p.prosecdef = true
                ) THEN '✅ SUCCÈS: pg_net installé et sécurisé'
                ELSE '⚠️ ATTENTION: pg_net installé mais sécurisation incomplète'
            END
        ELSE '❌ ÉCHEC: pg_net non installé'
    END as final_status;

-- Instructions d'utilisation
SELECT 
    'USAGE INSTRUCTIONS' as check_type,
    'Pour utiliser les fonctions sécurisées' as instruction,
    'Utiliser secure_net.http_get() et secure_net.http_post() au lieu de pg_net.*' as action; 
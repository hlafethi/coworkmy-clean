-- Vérification de l'implémentation de sécurisation alternative de pg_net

-- 1. État de l'extension pg_net
SELECT 
    'pg_net Extension Status' as check_type,
    extname as extension_name,
    extnamespace::regnamespace as schema_name,
    extversion as version,
    CASE 
        WHEN extnamespace::regnamespace = 'public' THEN '⚠️ Dans public (normal pour pg_net)'
        ELSE '✅ Dans un schéma dédié'
    END as location_status
FROM pg_extension 
WHERE extname = 'pg_net';

-- 2. Vérifier les fonctions sécurisées
SELECT 
    'Secure Functions Status' as check_type,
    p.proname as function_name,
    pn.nspname as schema_name,
    CASE 
        WHEN p.prosecdef THEN '✅ SECURITY DEFINER'
        ELSE '❌ SECURITY INVOKER'
    END as security_type,
    CASE 
        WHEN p.proconfig IS NOT NULL AND array_position(p.proconfig, 'search_path=public, pg_temp') IS NOT NULL THEN '✅ Search path sécurisé'
        ELSE '⚠️ Search path non configuré'
    END as search_path_status
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE pn.nspname = 'secure_net'
ORDER BY p.proname;

-- 3. Vérifier les permissions du schéma secure_net
SELECT 
    'Schema Permissions' as check_type,
    nspname as schema_name,
    nspowner::regrole as owner,
    CASE 
        WHEN nspacl IS NOT NULL THEN '✅ Permissions configurées'
        ELSE '⚠️ Aucune permission définie'
    END as permissions_status
FROM pg_namespace 
WHERE nspname = 'secure_net';

-- 4. Vérifier les permissions sur les fonctions pg_net originales
SELECT 
    'pg_net Original Functions Permissions' as check_type,
    p.proname as function_name,
    pn.nspname as schema_name,
    CASE 
        WHEN has_function_privilege('authenticated', p.oid, 'EXECUTE') THEN '✅ Authenticated peut exécuter'
        ELSE '❌ Authenticated ne peut pas exécuter'
    END as authenticated_access,
    CASE 
        WHEN has_function_privilege('public', p.oid, 'EXECUTE') THEN '⚠️ Public peut exécuter'
        ELSE '✅ Public ne peut pas exécuter'
    END as public_access
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE pn.nspname = 'pg_net' 
AND p.proname IN ('http_get', 'http_post');

-- 5. Test des fonctions sécurisées
SELECT 
    'Function Security Test' as check_type,
    'secure_net.http_get' as function_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace pn ON p.pronamespace = pn.oid
            WHERE pn.nspname = 'secure_net' 
            AND p.proname = 'http_get'
            AND p.prosecdef = true
        ) THEN '✅ Fonction sécurisée créée'
        ELSE '❌ Fonction non trouvée ou non sécurisée'
    END as status;

-- 6. Recommandations d'utilisation
SELECT 
    'Usage Recommendations' as check_type,
    'Pour les nouvelles implémentations' as recommendation,
    'Utiliser secure_net.http_get() et secure_net.http_post() au lieu de pg_net.*' as action;

-- 7. Résumé de sécurité
SELECT 
    'Security Summary' as check_type,
    'pg_net Alternative Security' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace pn ON p.pronamespace = pn.oid
            WHERE pn.nspname = 'secure_net' 
            AND p.proname IN ('http_get', 'http_post')
            AND p.prosecdef = true
        ) THEN '✅ SÉCURISATION ALTERNATIVE IMPLÉMENTÉE'
        ELSE '❌ SÉCURISATION NON IMPLÉMENTÉE'
    END as final_status; 
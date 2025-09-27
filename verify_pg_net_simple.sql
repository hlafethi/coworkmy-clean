-- Vérification simplifiée de pg_net (SANS ERREURS DE SYNTAXE)

-- 1. État de l'extension pg_net
SELECT 
    'pg_net Extension Status' as check_type,
    extname as extension_name,
    extnamespace::regnamespace as schema_name,
    extversion as version
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
    END as security_type
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE pn.nspname = 'secure_net'
ORDER BY p.proname;

-- 3. Vérifier les permissions du schéma secure_net
SELECT 
    'Schema Permissions' as check_type,
    nspname as schema_name,
    nspowner::regrole as owner
FROM pg_namespace 
WHERE nspname = 'secure_net';

-- 4. Vérifier les fonctions pg_net originales
SELECT 
    'pg_net Original Functions' as check_type,
    p.proname as function_name,
    pn.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE pn.nspname = 'pg_net' 
AND p.proname IN ('http_get', 'http_post');

-- 5. Test simple des fonctions sécurisées
SELECT 
    'Function Security Test' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace pn ON p.pronamespace = pn.oid
            WHERE pn.nspname = 'secure_net' 
            AND p.proname = 'http_get'
            AND p.prosecdef = true
        ) THEN '✅ Fonction http_get sécurisée créée'
        ELSE '❌ Fonction http_get non trouvée ou non sécurisée'
    END as http_get_status;

SELECT 
    'Function Security Test' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace pn ON p.pronamespace = pn.oid
            WHERE pn.nspname = 'secure_net' 
            AND p.proname = 'http_post'
            AND p.prosecdef = true
        ) THEN '✅ Fonction http_post sécurisée créée'
        ELSE '❌ Fonction http_post non trouvée ou non sécurisée'
    END as http_post_status;

-- 6. Résumé de sécurité
SELECT 
    'Security Summary' as check_type,
    'pg_net Security Status' as item,
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
-- Diagnostic complet de l'état de pg_net
-- Script de vérification et diagnostic

-- 1. Vérifier toutes les extensions installées
SELECT 
    'All Installed Extensions' as check_type,
    extname as extension_name,
    extnamespace::regnamespace as schema_name,
    extversion as version
FROM pg_extension 
ORDER BY extname;

-- 2. Vérifier spécifiquement pg_net
SELECT 
    'pg_net Specific Check' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN '✅ pg_net est installé'
        ELSE '❌ pg_net n''est PAS installé'
    END as status;

-- 3. Vérifier les schémas existants
SELECT 
    'Available Schemas' as check_type,
    nspname as schema_name,
    nspowner::regrole as owner
FROM pg_namespace 
WHERE nspname NOT LIKE 'pg_%' 
AND nspname != 'information_schema'
ORDER BY nspname;

-- 4. Vérifier les fonctions HTTP disponibles
SELECT 
    'HTTP Functions Available' as check_type,
    p.proname as function_name,
    pn.nspname as schema_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE p.proname LIKE '%http%'
ORDER BY pn.nspname, p.proname;

-- 5. Vérifier les extensions disponibles pour installation
SELECT 
    'Available Extensions' as check_type,
    name as extension_name,
    default_version as version,
    comment as description
FROM pg_available_extensions 
WHERE name LIKE '%net%' OR name LIKE '%http%'
ORDER BY name;

-- 6. État de sécurité actuel
SELECT 
    'Current Security Status' as check_type,
    'pg_net Extension' as item,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
            CASE 
                WHEN EXISTS (
                    SELECT 1 FROM pg_extension 
                    WHERE extname = 'pg_net' AND extnamespace::regnamespace = 'public'
                ) THEN '⚠️ pg_net dans public - correction nécessaire'
                ELSE '✅ pg_net correctement placé'
            END
        ELSE 'ℹ️ pg_net non installé - pas de problème de sécurité'
    END as security_status;

-- 7. Recommandations
SELECT 
    'Recommendations' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
            'Installer pg_net si nécessaire pour les fonctionnalités HTTP'
        ELSE
            'pg_net non installé - pas d''action requise pour la sécurité'
    END as recommendation; 
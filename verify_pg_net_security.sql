-- Script de vérification de la sécurité de l'extension pg_net

-- 1. Vérifier que l'extension est dans le bon schéma
SELECT 
    'Extension Location Check' as check_type,
    CASE 
        WHEN extnamespace::regnamespace = 'extensions' THEN '✅ pg_net est dans le schéma extensions'
        WHEN extnamespace::regnamespace = 'public' THEN '❌ pg_net est encore dans le schéma public'
        ELSE '⚠️ pg_net est dans un schéma inattendu: ' || extnamespace::regnamespace
    END as status
FROM pg_extension 
WHERE extname = 'pg_net';

-- 2. Vérifier les permissions du schéma extensions
SELECT 
    'Schema Permissions Check' as check_type,
    nspname as schema_name,
    nspowner::regrole as owner,
    nspacl as permissions
FROM pg_namespace 
WHERE nspname = 'extensions';

-- 3. Lister tous les objets de l'extension pg_net
SELECT 
    'Extension Objects Check' as check_type,
    n.nspname as schema_name,
    c.relname as object_name,
    c.relkind as object_type,
    CASE 
        WHEN n.nspname = 'extensions' THEN '✅ Objet dans le bon schéma'
        ELSE '❌ Objet dans le mauvais schéma'
    END as status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.oid IN (
    SELECT objid FROM pg_depend 
    WHERE refobjid = (SELECT oid FROM pg_extension WHERE extname = 'pg_net')
)
ORDER BY n.nspname, c.relname;

-- 4. Vérifier qu'il n'y a plus d'objets pg_net dans le schéma public
SELECT 
    'Public Schema Clean Check' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Aucun objet pg_net dans le schéma public'
        ELSE '❌ ' || COUNT(*) || ' objet(s) pg_net encore dans le schéma public'
    END as status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
AND c.oid IN (
    SELECT objid FROM pg_depend 
    WHERE refobjid = (SELECT oid FROM pg_extension WHERE extname = 'pg_net')
);

-- 5. Vérifier les fonctions qui utilisent pg_net
SELECT 
    'Function Dependencies Check' as check_type,
    p.proname as function_name,
    pn.nspname as function_schema,
    CASE 
        WHEN p.prosecdef THEN '✅ SECURITY DEFINER'
        ELSE '⚠️ SECURITY INVOKER'
    END as security_type,
    p.proconfig as search_path_config
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE p.oid IN (
    SELECT DISTINCT objid FROM pg_depend 
    WHERE refobjid IN (
        SELECT objid FROM pg_depend 
        WHERE refobjid = (SELECT oid FROM pg_extension WHERE extname = 'pg_net')
    )
);

-- 6. Résumé de sécurité
SELECT 
    'Security Summary' as check_type,
    'pg_net Extension Security' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_extension 
            WHERE extname = 'pg_net' AND extnamespace::regnamespace = 'extensions'
        ) THEN '✅ SÉCURISÉ - Extension déplacée vers le schéma extensions'
        ELSE '❌ NON SÉCURISÉ - Extension encore dans le schéma public'
    END as security_status; 
-- Vérification complète de la sécurité de l'extension pg_net
-- À exécuter dans l'interface SQL de Supabase

-- 1. État actuel de l'extension pg_net
SELECT 
    'Extension pg_net Status' as check_type,
    extname as extension_name,
    extnamespace::regnamespace as current_schema,
    extversion as version,
    CASE 
        WHEN extnamespace::regnamespace = 'extensions' THEN '✅ SÉCURISÉ'
        WHEN extnamespace::regnamespace = 'public' THEN '❌ NON SÉCURISÉ'
        ELSE '⚠️ SCHÉMA INATTENDU'
    END as security_status
FROM pg_extension 
WHERE extname = 'pg_net';

-- 2. Vérifier les objets de l'extension
SELECT 
    'Extension Objects' as check_type,
    n.nspname as schema_name,
    c.relname as object_name,
    c.relkind as object_type,
    CASE 
        WHEN n.nspname = 'extensions' THEN '✅ Bon schéma'
        WHEN n.nspname = 'public' THEN '❌ Mauvais schéma'
        ELSE '⚠️ Schéma inattendu'
    END as location_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.oid IN (
    SELECT objid FROM pg_depend 
    WHERE refobjid = (SELECT oid FROM pg_extension WHERE extname = 'pg_net')
)
ORDER BY n.nspname, c.relname;

-- 3. Vérifier les permissions du schéma extensions
SELECT 
    'Schema Permissions' as check_type,
    nspname as schema_name,
    nspowner::regrole as owner,
    CASE 
        WHEN nspacl IS NOT NULL THEN '✅ Permissions configurées'
        ELSE '⚠️ Aucune permission définie'
    END as permissions_status
FROM pg_namespace 
WHERE nspname = 'extensions';

-- 4. Vérifier qu'il n'y a plus d'objets pg_net dans public
SELECT 
    'Public Schema Clean' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Aucun objet pg_net dans public'
        ELSE '❌ ' || COUNT(*) || ' objet(s) pg_net encore dans public'
    END as status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
AND c.oid IN (
    SELECT objid FROM pg_depend 
    WHERE refobjid = (SELECT oid FROM pg_extension WHERE extname = 'pg_net')
);

-- 5. Résumé de sécurité
SELECT 
    'Security Summary' as check_type,
    'pg_net Extension' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_extension 
            WHERE extname = 'pg_net' AND extnamespace::regnamespace = 'extensions'
        ) AND NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'public' 
            AND c.oid IN (
                SELECT objid FROM pg_depend 
                WHERE refobjid = (SELECT oid FROM pg_extension WHERE extname = 'pg_net')
            )
        ) THEN '✅ COMPLÈTEMENT SÉCURISÉ'
        ELSE '❌ CORRECTION NÉCESSAIRE'
    END as final_status; 
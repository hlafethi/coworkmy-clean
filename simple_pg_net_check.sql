-- Vérification simple de pg_net (VERSION ULTRA-SIMPLE)
-- Script sans aucune fonction d'agrégation

-- ========================================
-- 1. VÉRIFICATION DES FONCTIONS PG_NET
-- ========================================

-- Vérifier s'il y a des fonctions utilisant pg_net
SELECT 
    'pg_net functions check' as check_type,
    'functions_using_pg_net' as metric,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE pg_get_functiondef(p.oid) LIKE '%pg_net.%'
AND pn.nspname != 'secure_net';

-- Lister les fonctions utilisant pg_net
SELECT 
    'pg_net function' as check_type,
    pn.nspname as schema_name,
    p.proname as function_name
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE pg_get_functiondef(p.oid) LIKE '%pg_net.%'
AND pn.nspname != 'secure_net'
ORDER BY pn.nspname, p.proname;

-- ========================================
-- 2. VÉRIFICATION DES FONCTIONS SECURE_NET
-- ========================================

-- Vérifier s'il y a des fonctions utilisant secure_net
SELECT 
    'secure_net functions check' as check_type,
    'functions_using_secure_net' as metric,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE pg_get_functiondef(p.oid) LIKE '%secure_net.%';

-- Lister les fonctions utilisant secure_net
SELECT 
    'secure_net function' as check_type,
    pn.nspname as schema_name,
    p.proname as function_name,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE pg_get_functiondef(p.oid) LIKE '%secure_net.%'
ORDER BY pn.nspname, p.proname;

-- ========================================
-- 3. ÉTAT DE SÉCURITÉ
-- ========================================

-- Vérifier l'état de sécurité
SELECT 
    'security status' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace pn ON p.pronamespace = pn.oid
            WHERE pg_get_functiondef(p.oid) LIKE '%pg_net.%'
            AND pn.nspname != 'secure_net'
        ) THEN 'ATTENTION: Des fonctions utilisent encore pg_net'
        ELSE 'SECURISE: Toutes les fonctions utilisent secure_net'
    END as status;

-- ========================================
-- 4. INSTRUCTIONS
-- ========================================

-- Instructions de migration
SELECT 
    'migration instruction' as check_type,
    'step 1' as step,
    'Recuperer la definition: SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = ''nom_fonction'';' as instruction;

SELECT 
    'migration instruction' as check_type,
    'step 2' as step,
    'Remplacer pg_net.http_get par secure_net.http_get' as instruction;

SELECT 
    'migration instruction' as check_type,
    'step 3' as step,
    'Remplacer pg_net.http_post par secure_net.http_post' as instruction;

SELECT 
    'migration instruction' as check_type,
    'step 4' as step,
    'Executer CREATE OR REPLACE FUNCTION avec la nouvelle definition' as instruction;

-- ========================================
-- 5. EXEMPLES
-- ========================================

-- Exemple avant/après
SELECT 
    'example' as check_type,
    'before' as type,
    'RETURN pg_net.http_get(url);' as code;

SELECT 
    'example' as check_type,
    'after' as type,
    'RETURN secure_net.http_get(url);' as code;

-- ========================================
-- 6. RÉSUMÉ
-- ========================================

-- Résumé final
SELECT 
    'summary' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace pn ON p.pronamespace = pn.oid
            WHERE pg_get_functiondef(p.oid) LIKE '%pg_net.%'
            AND pn.nspname != 'secure_net'
        ) THEN 'MIGRATION NECESSAIRE'
        ELSE 'MIGRATION TERMINEE'
    END as final_status;

-- Instructions pour les développeurs
SELECT 
    'developer guideline' as check_type,
    'new functions' as guideline,
    'Utiliser secure_net.http_get() et secure_net.http_post() au lieu de pg_net.*' as action; 
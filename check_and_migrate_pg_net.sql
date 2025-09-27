-- Vérification et migration pg_net vers secure_net (VERSION SIMPLE)
-- Script sans fonctions d'agrégation problématiques

-- ========================================
-- 1. VÉRIFICATION DES FONCTIONS UTILISANT PG_NET
-- ========================================

-- Compter les fonctions utilisant pg_net
SELECT 
    'pg_net usage count' as check_type,
    COUNT(*) as functions_using_pg_net
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE pg_get_functiondef(p.oid) LIKE '%pg_net.%'
AND pn.nspname != 'secure_net';

-- Lister les fonctions utilisant pg_net (sans afficher la définition complète)
SELECT 
    'Functions using pg_net' as check_type,
    p.proname as function_name,
    pn.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE pg_get_functiondef(p.oid) LIKE '%pg_net.%'
AND pn.nspname != 'secure_net'
ORDER BY pn.nspname, p.proname;

-- ========================================
-- 2. VÉRIFICATION DES FONCTIONS SÉCURISÉES
-- ========================================

-- Compter les fonctions utilisant secure_net
SELECT 
    'secure_net usage count' as check_type,
    COUNT(*) as functions_using_secure_net
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE pg_get_functiondef(p.oid) LIKE '%secure_net.%';

-- Lister les fonctions utilisant secure_net
SELECT 
    'Functions using secure_net' as check_type,
    p.proname as function_name,
    pn.nspname as schema_name,
    CASE 
        WHEN p.prosecdef THEN '✅ SECURITY DEFINER'
        ELSE '⚠️ SECURITY INVOKER'
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
    'Security Status' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace pn ON p.pronamespace = pn.oid
            WHERE pg_get_functiondef(p.oid) LIKE '%pg_net.%'
            AND pn.nspname != 'secure_net'
        ) THEN '⚠️ ATTENTION: Des fonctions utilisent encore pg_net directement'
        ELSE '✅ SÉCURISÉ: Toutes les fonctions utilisent secure_net'
    END as security_status;

-- ========================================
-- 4. INSTRUCTIONS DE MIGRATION
-- ========================================

-- Instructions pour migrer manuellement
SELECT 
    'Migration Instructions' as check_type,
    'Pour migrer une fonction utilisant pg_net' as step,
    '1. Récupérer la définition: SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = ''nom_fonction'';' as instruction;

SELECT 
    'Migration Instructions' as check_type,
    'Remplacer dans la définition' as step,
    '2. Remplacer pg_net.http_get par secure_net.http_get et pg_net.http_post par secure_net.http_post' as instruction;

SELECT 
    'Migration Instructions' as check_type,
    'Recréer la fonction' as step,
    '3. Exécuter la nouvelle définition avec CREATE OR REPLACE FUNCTION' as instruction;

-- ========================================
-- 5. EXEMPLE PRATIQUE
-- ========================================

-- Exemple de migration
SELECT 
    'Example Migration' as check_type,
    'Avant (non sécurisé)' as example,
    'RETURN pg_net.http_get(url);' as code;

SELECT 
    'Example Migration' as check_type,
    'Après (sécurisé)' as example,
    'RETURN secure_net.http_get(url);' as code;

-- ========================================
-- 6. RÉSUMÉ FINAL
-- ========================================

SELECT 
    'Final Summary' as check_type,
    'Migration Status' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace pn ON p.pronamespace = pn.oid
            WHERE pg_get_functiondef(p.oid) LIKE '%pg_net.%'
            AND pn.nspname != 'secure_net'
        ) THEN '⚠️ MIGRATION NÉCESSAIRE'
        ELSE '✅ MIGRATION TERMINÉE'
    END as status;

-- Instructions pour les développeurs
SELECT 
    'Developer Guidelines' as check_type,
    'Pour les nouvelles fonctions' as guideline,
    'Utiliser secure_net.http_get() et secure_net.http_post() au lieu de pg_net.*' as action; 
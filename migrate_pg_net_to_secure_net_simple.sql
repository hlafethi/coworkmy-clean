-- Migration des appels pg_net vers secure_net (VERSION SIMPLIFIÉE)
-- Script pour remplacer tous les appels pg_net.* par secure_net.*

-- ========================================
-- 1. DIAGNOSTIC DES FONCTIONS UTILISANT PG_NET
-- ========================================

-- Vérifier les fonctions qui utilisent pg_net
SELECT 
    'Functions using pg_net' as check_type,
    p.proname as function_name,
    pn.nspname as schema_name
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE pg_get_functiondef(p.oid) LIKE '%pg_net.%'
AND pn.nspname != 'secure_net' -- Exclure les fonctions secure_net
ORDER BY pn.nspname, p.proname;

-- ========================================
-- 2. MIGRATION MANUELLE DES FONCTIONS
-- ========================================

-- Note: La migration automatique peut être complexe
-- Voici les étapes manuelles recommandées:

-- 1. Identifier les fonctions à migrer
-- 2. Récupérer leur définition avec: SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'nom_fonction';
-- 3. Remplacer pg_net.http_get par secure_net.http_get
-- 4. Remplacer pg_net.http_post par secure_net.http_post
-- 5. Recréer la fonction avec la nouvelle définition

-- ========================================
-- 3. VÉRIFICATION POST-MIGRATION
-- ========================================

-- Vérifier qu'il n'y a plus d'appels pg_net dans les fonctions
SELECT 
    'Post-migration check' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Aucune fonction n''utilise plus pg_net directement'
        ELSE '⚠️ ' || COUNT(*) || ' fonction(s) utilisent encore pg_net directement'
    END as status
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE pg_get_functiondef(p.oid) LIKE '%pg_net.%'
AND pn.nspname != 'secure_net';

-- Lister les fonctions qui utilisent secure_net
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
-- 4. RÉSUMÉ FINAL
-- ========================================

SELECT 
    'Migration Summary' as check_type,
    'pg_net to secure_net migration' as item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace pn ON p.pronamespace = pn.oid
            WHERE pg_get_functiondef(p.oid) LIKE '%pg_net.%'
            AND pn.nspname != 'secure_net'
        ) THEN '⚠️ MIGRATION INCOMPLÈTE - Certaines fonctions utilisent encore pg_net'
        ELSE '✅ MIGRATION TERMINÉE - Toutes les fonctions utilisent secure_net'
    END as final_status;

-- Instructions pour les développeurs
SELECT 
    'Developer Instructions' as check_type,
    'Pour les nouvelles fonctions' as instruction,
    'Utiliser secure_net.http_get() et secure_net.http_post() au lieu de pg_net.*' as action;

-- ========================================
-- 5. EXEMPLES DE MIGRATION MANUELLE
-- ========================================

-- Exemple: Si vous avez une fonction comme celle-ci:
/*
CREATE OR REPLACE FUNCTION ma_fonction_api(url text)
RETURNS jsonb AS $$
BEGIN
    RETURN pg_net.http_get(url); -- ❌ À remplacer
END;
$$ LANGUAGE plpgsql;
*/

-- La remplacer par:
/*
CREATE OR REPLACE FUNCTION ma_fonction_api(url text)
RETURNS jsonb AS $$
BEGIN
    RETURN secure_net.http_get(url); -- ✅ Version sécurisée
END;
$$ LANGUAGE plpgsql;
*/ 
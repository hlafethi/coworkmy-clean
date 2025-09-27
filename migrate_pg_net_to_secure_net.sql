-- Migration des appels pg_net vers secure_net
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
ORDER BY pn.nspname, p.proname;

-- ========================================
-- 2. MIGRATION DES FONCTIONS
-- ========================================

-- Fonction pour migrer une fonction utilisant pg_net
CREATE OR REPLACE FUNCTION migrate_pg_net_function(
    function_schema text,
    function_name text
) RETURNS text AS $$
DECLARE
    old_definition text;
    new_definition text;
    result text;
BEGIN
    -- Récupérer la définition actuelle
    SELECT pg_get_functiondef(p.oid) INTO old_definition
    FROM pg_proc p
    JOIN pg_namespace pn ON p.pronamespace = pn.oid
    WHERE pn.nspname = function_schema AND p.proname = function_name;
    
    IF old_definition IS NULL THEN
        RETURN 'Fonction ' || function_schema || '.' || function_name || ' non trouvée';
    END IF;
    
    -- Remplacer pg_net par secure_net
    new_definition := replace(old_definition, 'pg_net.http_get', 'secure_net.http_get');
    new_definition := replace(new_definition, 'pg_net.http_post', 'secure_net.http_post');
    
    -- Vérifier si des changements ont été effectués
    IF old_definition = new_definition THEN
        RETURN 'Aucun changement nécessaire pour ' || function_schema || '.' || function_name;
    END IF;
    
    -- Exécuter la nouvelle définition
    BEGIN
        EXECUTE new_definition;
        result := 'Fonction ' || function_schema || '.' || function_name || ' migrée avec succès';
    EXCEPTION
        WHEN OTHERS THEN
            result := 'Erreur lors de la migration de ' || function_schema || '.' || function_name || ': ' || SQLERRM;
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 3. MIGRATION AUTOMATIQUE
-- ========================================

-- Migrer toutes les fonctions qui utilisent pg_net
DO $$
DECLARE
    func_record RECORD;
    migration_result text;
BEGIN
    FOR func_record IN 
        SELECT p.proname as function_name, pn.nspname as schema_name
        FROM pg_proc p
        JOIN pg_namespace pn ON p.pronamespace = pn.oid
        WHERE pg_get_functiondef(p.oid) LIKE '%pg_net.%'
        AND pn.nspname != 'secure_net' -- Exclure les fonctions secure_net
    LOOP
        migration_result := migrate_pg_net_function(func_record.schema_name, func_record.function_name);
        RAISE NOTICE '%', migration_result;
    END LOOP;
END $$;

-- ========================================
-- 4. VÉRIFICATION POST-MIGRATION
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
-- 5. NETTOYAGE
-- ========================================

-- Supprimer la fonction de migration
DROP FUNCTION IF EXISTS migrate_pg_net_function(text, text);

-- ========================================
-- 6. RÉSUMÉ FINAL
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
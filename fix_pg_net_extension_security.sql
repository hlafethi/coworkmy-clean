-- Script pour corriger la sécurité de l'extension pg_net
-- Déplace l'extension du schéma public vers un schéma dédié

-- 1. Créer le schéma extensions s'il n'existe pas
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Vérifier l'état actuel de l'extension
SELECT 
    extname as extension_name,
    extnamespace::regnamespace as schema_name,
    extversion as version
FROM pg_extension 
WHERE extname = 'pg_net';

-- 3. Déplacer l'extension vers le schéma extensions
-- Note: pg_net doit être déplacé avec ALTER EXTENSION car c'est une extension
-- qui peut avoir des dépendances

-- D'abord, vérifier si des objets dépendent de pg_net
SELECT 
    dependent_ns.nspname as dependent_schema,
    dependent_obj.relname as dependent_object,
    pg_class.relkind as object_type
FROM pg_depend 
JOIN pg_class ON pg_depend.objid = pg_class.oid
JOIN pg_namespace dependent_ns ON pg_class.relnamespace = dependent_ns.oid
WHERE pg_depend.refobjid = (SELECT oid FROM pg_extension WHERE extname = 'pg_net');

-- 4. Déplacer l'extension (cela déplacera aussi tous ses objets)
ALTER EXTENSION pg_net SET SCHEMA extensions;

-- 5. Vérifier que le déplacement a réussi
SELECT 
    extname as extension_name,
    extnamespace::regnamespace as schema_name,
    extversion as version
FROM pg_extension 
WHERE extname = 'pg_net';

-- 6. Mettre à jour les permissions si nécessaire
-- Donner les permissions appropriées au schéma extensions
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- 7. Vérifier les objets de l'extension dans le nouveau schéma
SELECT 
    n.nspname as schema_name,
    c.relname as object_name,
    c.relkind as object_type
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'extensions'
ORDER BY c.relname;

-- 8. Mettre à jour les références dans le code si nécessaire
-- Les fonctions qui utilisent pg_net devront peut-être être mises à jour
-- pour référencer le bon schéma

-- Exemple de mise à jour d'une fonction si nécessaire :
-- ALTER FUNCTION ma_fonction() SET search_path = extensions, public, pg_temp; 
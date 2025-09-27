-- Script pour corriger l'alerte de sécurité pg_net
-- Déplacer l'extension pg_net du schéma public vers un schéma dédié

-- 1. Vérifier si l'extension existe
SELECT 
    extname as extension_name,
    extnamespace::regnamespace as schema_name
FROM pg_extension 
WHERE extname = 'pg_net';

-- 2. Créer le schéma extensions s'il n'existe pas
CREATE SCHEMA IF NOT EXISTS extensions;

-- 3. Vérifier les objets qui dépendent de pg_net
SELECT 
    dependent_ns.nspname as dependent_schema,
    dependent_obj.relname as dependent_object,
    pg_class.relkind as object_type
FROM pg_depend 
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
JOIN pg_class as dependent_obj ON pg_rewrite.ev_class = dependent_obj.oid 
JOIN pg_namespace dependent_ns ON dependent_obj.relnamespace = dependent_ns.oid 
JOIN pg_class ON pg_depend.refobjid = pg_class.oid 
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid 
JOIN pg_proc ON pg_proc.oid = pg_depend.refobjid 
WHERE pg_namespace.nspname = 'public' 
AND pg_proc.proname LIKE 'net_%';

-- 4. Supprimer l'extension (attention : cela supprime aussi ses fonctions)
-- DROP EXTENSION IF EXISTS pg_net;

-- 5. Réinstaller l'extension dans le schéma extensions
-- CREATE EXTENSION pg_net WITH SCHEMA extensions;

-- 6. Vérifier que l'extension est bien installée dans le bon schéma
-- SELECT 
--     extname as extension_name,
--     extnamespace::regnamespace as schema_name
-- FROM pg_extension 
-- WHERE extname = 'pg_net';

-- Instructions d'exécution :
-- 1. Exécuter d'abord les requêtes 1, 2 et 3 pour vérifier l'état actuel
-- 2. Si aucune dépendance critique n'est trouvée, décommenter les lignes 4 et 5
-- 3. Exécuter la requête 6 pour vérifier le résultat
-- 4. Si des dépendances existent, les adapter pour utiliser le nouveau schéma 
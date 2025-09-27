-- Correction de l'alerte de sécurité pg_net
-- Déplacer l'extension du schéma public vers un schéma dédié

-- Étape 1: Créer le schéma extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Étape 2: Supprimer l'extension pg_net du schéma public
-- ATTENTION: Cela supprime aussi toutes les fonctions de pg_net
DROP EXTENSION IF EXISTS pg_net;

-- Étape 3: Réinstaller pg_net dans le schéma extensions
CREATE EXTENSION pg_net WITH SCHEMA extensions;

-- Étape 4: Vérifier que l'extension est bien installée dans le bon schéma
SELECT 
    extname as extension_name,
    extnamespace::regnamespace as schema_name,
    extversion as version
FROM pg_extension 
WHERE extname = 'pg_net';

-- Étape 5: Vérifier que les fonctions pg_net sont disponibles
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'extensions'
AND p.proname LIKE 'net_%'
ORDER BY p.proname; 
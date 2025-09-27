-- Migration pour corriger l'alerte de sécurité pg_net
-- Déplacer l'extension du schéma public vers un schéma dédié

-- Créer le schéma extensions s'il n'existe pas
CREATE SCHEMA IF NOT EXISTS extensions;

-- Supprimer l'extension pg_net du schéma public
-- ATTENTION: Cela supprime aussi toutes les fonctions de pg_net
DROP EXTENSION IF EXISTS pg_net;

-- Réinstaller pg_net dans le schéma extensions
CREATE EXTENSION pg_net WITH SCHEMA extensions;

-- Vérifier que l'extension est bien installée dans le bon schéma
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension 
        WHERE extname = 'pg_net' 
        AND extnamespace = 'extensions'::regnamespace
    ) THEN
        RAISE EXCEPTION 'pg_net n''est pas installé dans le schéma extensions';
    END IF;
END $$; 
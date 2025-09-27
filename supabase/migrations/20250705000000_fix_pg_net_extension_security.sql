-- Migration pour corriger la sécurité de l'extension pg_net
-- Déplace l'extension du schéma public vers un schéma dédié

-- 1. Créer le schéma extensions s'il n'existe pas
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Déplacer l'extension pg_net vers le schéma extensions
-- Cette commande déplacera automatiquement tous les objets de l'extension
ALTER EXTENSION pg_net SET SCHEMA extensions;

-- 3. Configurer les permissions appropriées
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- 4. Vérifier que le déplacement a réussi
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension 
        WHERE extname = 'pg_net' AND extnamespace::regnamespace = 'extensions'
    ) THEN
        RAISE EXCEPTION 'Échec du déplacement de l''extension pg_net vers le schéma extensions';
    END IF;
END $$;

-- 5. Log de la migration
INSERT INTO public.migration_logs (migration_name, applied_at, status, details)
VALUES (
    '20250705000000_fix_pg_net_extension_security',
    NOW(),
    'SUCCESS',
    'Extension pg_net déplacée du schéma public vers le schéma extensions pour améliorer la sécurité'
); 
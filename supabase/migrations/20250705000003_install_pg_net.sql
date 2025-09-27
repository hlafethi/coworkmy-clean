-- Migration pour installer l'extension pg_net
-- Cette extension est nécessaire pour que le trigger puisse appeler l'edge function

-- Installer l'extension pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Vérifier que l'extension est installée
SELECT 
    extname,
    extversion
FROM pg_extension 
WHERE extname = 'pg_net'; 
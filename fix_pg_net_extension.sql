-- Installation de l'extension pg_net nécessaire pour les appels HTTP
-- Cette extension est requise pour que le trigger puisse appeler l'edge function

-- 1. Installer l'extension pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Vérifier que l'extension est installée
SELECT 
    extname,
    extversion,
    extrelocatable
FROM pg_extension 
WHERE extname = 'pg_net';

-- 3. Tester la fonction http_post
SELECT net.http_post(
    url := 'https://httpbin.org/post',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"test": "pg_net working"}'::text
);

-- 4. Vérifier que la fonction sync_space_with_stripe peut maintenant fonctionner
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'sync_space_with_stripe'; 
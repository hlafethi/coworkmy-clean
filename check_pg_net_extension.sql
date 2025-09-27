-- Vérifier et activer l'extension pg_net nécessaire pour les appels HTTP
-- Cette extension est requise pour que le trigger puisse appeler l'edge function

-- 1. Vérifier si l'extension pg_net est installée
SELECT 
    extname,
    extversion,
    extrelocatable
FROM pg_extension 
WHERE extname = 'pg_net';

-- 2. Si l'extension n'existe pas, l'activer
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Vérifier à nouveau
SELECT 
    extname,
    extversion,
    extrelocatable
FROM pg_extension 
WHERE extname = 'pg_net';

-- 4. Tester la fonction http_post
SELECT net.http_post(
    url := 'https://httpbin.org/post',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"test": "pg_net working"}'::text
);

-- 5. Vérifier que la fonction sync_space_with_stripe peut être exécutée
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'sync_space_with_stripe'; 
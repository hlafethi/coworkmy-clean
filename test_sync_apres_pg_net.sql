-- Test de synchronisation après installation de pg_net
-- Exécuter ce script dans Supabase SQL Editor

-- 1. Vérifier que pg_net est installé
SELECT '=== VÉRIFICATION PG_NET ===' as section;
SELECT 
    extname,
    extversion
FROM pg_extension 
WHERE extname = 'pg_net';

-- 2. Tester la fonction http_post
SELECT '=== TEST HTTP_POST ===' as section;
SELECT net.http_post(
    url := 'https://httpbin.org/post',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"test": "pg_net working"}'::text
);

-- 3. Créer un espace de test
SELECT '=== CRÉATION ESPACE TEST ===' as section;
INSERT INTO spaces (name, description, capacity, price_per_hour, is_active) 
VALUES ('Test Après PG_NET', 'Espace de test après installation de pg_net', 5, 25.00, true)
RETURNING id, name, price_per_hour, created_at;

-- 4. Attendre 3 secondes puis vérifier le résultat
SELECT '=== RÉSULTAT APRÈS CRÉATION ===' as section;
SELECT 
    id,
    name,
    price_per_hour,
    stripe_product_id,
    stripe_price_id,
    created_at,
    updated_at,
    CASE 
        WHEN stripe_product_id IS NOT NULL AND stripe_price_id IS NOT NULL 
        THEN '✅ Synchronisation réussie !'
        ELSE '❌ Synchronisation échouée'
    END as status
FROM spaces 
WHERE name = 'Test Après PG_NET'
ORDER BY created_at DESC
LIMIT 1;

-- 5. Vérifier tous les espaces récents
SELECT '=== ESPACES RÉCENTS ===' as section;
SELECT 
    id,
    name,
    price_per_hour,
    stripe_product_id,
    stripe_price_id,
    created_at
FROM spaces 
ORDER BY created_at DESC
LIMIT 3; 
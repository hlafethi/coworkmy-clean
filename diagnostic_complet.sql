-- Diagnostic complet de la synchronisation Stripe
-- Exécuter ce script dans Supabase SQL Editor pour identifier le problème

-- 1. Vérifier l'extension pg_net
SELECT '=== VÉRIFICATION PG_NET ===' as section;
SELECT 
    extname,
    extversion
FROM pg_extension 
WHERE extname = 'pg_net';

-- 2. Vérifier le trigger
SELECT '=== VÉRIFICATION TRIGGER ===' as section;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_stripe_sync_on_spaces';

-- 3. Vérifier la fonction
SELECT '=== VÉRIFICATION FONCTION ===' as section;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'sync_space_with_stripe';

-- 4. Tester la fonction http_post
SELECT '=== TEST HTTP_POST ===' as section;
SELECT net.http_post(
    url := 'https://httpbin.org/post',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"test": "pg_net working"}'::text
);

-- 5. Créer un espace de test
SELECT '=== CRÉATION ESPACE TEST ===' as section;
INSERT INTO spaces (name, description, capacity, price_per_hour, is_active) 
VALUES ('Test Diagnostic Complet', 'Espace de test pour diagnostic complet', 6, 30.00, true)
RETURNING id, name, price_per_hour, created_at;

-- 6. Vérifier le résultat après 3 secondes
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
        THEN '✅ Synchronisation réussie'
        ELSE '❌ Synchronisation échouée'
    END as status
FROM spaces 
WHERE name = 'Test Diagnostic Complet'
ORDER BY created_at DESC
LIMIT 1;

-- 7. Vérifier tous les espaces récents
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
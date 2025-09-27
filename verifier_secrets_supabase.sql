-- Vérification des secrets Supabase
-- Note: Les secrets ne sont pas accessibles directement via SQL

-- 1. Vérifier les paramètres de configuration
SELECT '=== PARAMÈTRES DE CONFIGURATION ===' as section;
SELECT 
    name,
    setting,
    context
FROM pg_settings 
WHERE name LIKE '%stripe%' 
   OR name LIKE '%service%'
   OR name LIKE '%key%'
ORDER BY name;

-- 2. Vérifier les variables d'environnement disponibles
SELECT '=== VARIABLES D\'ENVIRONNEMENT ===' as section;
SELECT 
    name,
    setting
FROM pg_settings 
WHERE name IN (
    'app.settings.service_role_key',
    'app.settings.stripe_secret_key',
    'app.settings.stripe_publishable_key'
);

-- 3. Test de la fonction trigger avec gestion d'erreur
SELECT '=== TEST FONCTION TRIGGER ===' as section;
DO $$
DECLARE
    test_payload JSONB;
    test_result RECORD;
BEGIN
    -- Construire un payload de test
    test_payload := jsonb_build_object(
        'type', 'TEST',
        'table', 'spaces',
        'record', jsonb_build_object('id', 'test-123', 'name', 'Test Space'),
        'old_record', NULL
    );
    
    RAISE NOTICE 'Test payload: %', test_payload;
    
    -- Tester l'appel HTTP (sans les secrets pour l'instant)
    BEGIN
        SELECT * INTO test_result FROM net.http_post(
            'https://httpbin.org/post',
            '{"Content-Type": "application/json"}'::jsonb,
            test_payload
        );
        RAISE NOTICE 'HTTP test réussi: %', test_result;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Erreur HTTP test: %', SQLERRM;
    END;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur générale: %', SQLERRM;
END $$;

-- 4. Vérifier les permissions sur les fonctions
SELECT '=== PERMISSIONS FONCTIONS ===' as section;
SELECT 
    proname,
    proowner::regrole as owner,
    prosecdef as security_definer
FROM pg_proc 
WHERE proname IN ('sync_space_with_stripe', 'net.http_post')
ORDER BY proname;

-- 5. Vérifier les schémas disponibles
SELECT '=== SCHÉMAS DISPONIBLES ===' as section;
SELECT 
    nspname,
    nspowner::regrole as owner
FROM pg_namespace 
WHERE nspname IN ('net', 'public', 'supabase_functions', 'auth')
ORDER BY nspname;

-- 6. Test de création d'espace simple
SELECT '=== TEST CRÉATION ESPACE SIMPLE ===' as section;
DO $$
DECLARE
    space_id UUID;
BEGIN
    INSERT INTO spaces (
        name,
        description,
        capacity,
        price_per_hour,
        is_active,
        created_by
    ) VALUES (
        'Test Secret ' || now()::text,
        'Test de création d''espace',
        1,
        10.00,
        true,
        '00000000-0000-0000-0000-000000000000'
    ) RETURNING id INTO space_id;
    
    RAISE NOTICE 'Espace créé avec succès: %', space_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erreur création espace: %', SQLERRM;
END $$; 
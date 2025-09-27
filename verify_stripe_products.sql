-- Script pour vérifier les produits Stripe et diagnostiquer le problème
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier les espaces avec leurs IDs Stripe
SELECT 'ESPACES AVEC IDS STRIPE' as info;
SELECT 
    id,
    name,
    pricing_type,
    hourly_price,
    daily_price,
    monthly_price,
    stripe_product_id,
    stripe_price_id,
    last_stripe_sync,
    is_active,
    created_at
FROM spaces 
WHERE stripe_product_id IS NOT NULL 
   OR stripe_price_id IS NOT NULL
ORDER BY last_stripe_sync DESC;

-- 2. Vérifier les espaces SANS IDs Stripe
SELECT 'ESPACES SANS IDS STRIPE' as info;
SELECT 
    id,
    name,
    pricing_type,
    hourly_price,
    daily_price,
    monthly_price,
    stripe_product_id,
    stripe_price_id,
    last_stripe_sync,
    is_active,
    created_at
FROM spaces 
WHERE stripe_product_id IS NULL 
   OR stripe_price_id IS NULL
ORDER BY created_at DESC;

-- 3. Vérifier les jobs récents de synchronisation
SELECT 'JOBS DE SYNCHRONISATION RECENTS' as info;
SELECT 
    id,
    space_id,
    event_type,
    status,
    error_message,
    created_at,
    processed_at
FROM stripe_sync_queue 
ORDER BY created_at DESC
LIMIT 10;

-- 4. Vérifier les jobs en erreur
SELECT 'JOBS EN ERREUR' as info;
SELECT 
    id,
    space_id,
    event_type,
    status,
    error_message,
    created_at,
    processed_at
FROM stripe_sync_queue 
WHERE status = 'error'
ORDER BY created_at DESC;

-- 5. Statistiques de synchronisation
SELECT 'STATISTIQUES DE SYNCHRONISATION' as info;
SELECT 
    COUNT(*) as total_espaces,
    COUNT(stripe_product_id) as avec_stripe_product,
    COUNT(stripe_price_id) as avec_stripe_price,
    COUNT(last_stripe_sync) as synchronises,
    COUNT(CASE WHEN stripe_product_id IS NOT NULL AND stripe_price_id IS NOT NULL THEN 1 END) as completement_sync,
    COUNT(CASE WHEN stripe_product_id IS NULL AND stripe_price_id IS NULL THEN 1 END) as non_sync
FROM spaces;

-- 6. Vérifier les jobs par statut
SELECT 'JOBS PAR STATUT' as info;
SELECT 
    status,
    COUNT(*) as nombre,
    MIN(created_at) as premier_job,
    MAX(created_at) as dernier_job
FROM stripe_sync_queue 
GROUP BY status
ORDER BY status;

-- 7. Vérifier les jobs par type d'événement
SELECT 'JOBS PAR TYPE D\'ÉVÉNEMENT' as info;
SELECT 
    event_type,
    COUNT(*) as nombre,
    MIN(created_at) as premier_job,
    MAX(created_at) as dernier_job
FROM stripe_sync_queue 
GROUP BY event_type
ORDER BY event_type;

-- 8. Créer un job de test pour un espace spécifique
SELECT 'CREATION JOB DE TEST POUR ESPACE SPECIFIQUE' as info;
DO $$
DECLARE
    test_space_id UUID;
    test_space_name TEXT;
BEGIN
    -- Sélectionner un espace sans synchronisation Stripe
    SELECT id, name INTO test_space_id, test_space_name
    FROM spaces 
    WHERE stripe_product_id IS NULL 
       OR stripe_price_id IS NULL
    LIMIT 1;
    
    IF test_space_id IS NOT NULL THEN
        INSERT INTO stripe_sync_queue (
            space_id,
            event_type,
            payload,
            status
        ) VALUES (
            test_space_id,
            'MANUAL_TEST',
            jsonb_build_object(
                'space_id', test_space_id,
                'space_name', test_space_name,
                'test_mode', true,
                'debug', true,
                'timestamp', now()
            ),
            'pending'
        );
        
        RAISE NOTICE 'Job de test créé pour l''espace: % (%)', test_space_name, test_space_id;
    ELSE
        RAISE NOTICE 'Aucun espace sans synchronisation trouvé';
    END IF;
END $$;

-- 9. Vérifier la configuration Stripe (si accessible)
SELECT 'CONFIGURATION STRIPE' as info;
SELECT 
    'Vérifiez que la clé STRIPE_SECRET_KEY est configurée dans les variables d''environnement de la fonction Edge' as note;

-- 10. Suggestions de diagnostic
SELECT 'SUGGESTIONS DE DIAGNOSTIC' as info;
SELECT 
    '1. Vérifiez les logs de la fonction Edge dans le dashboard Supabase' as suggestion_1,
    '2. Testez la clé Stripe avec curl ou Postman' as suggestion_2,
    '3. Vérifiez que les produits sont créés dans le dashboard Stripe' as suggestion_3,
    '4. Vérifiez que les prix sont marqués comme actifs' as suggestion_4,
    '5. Testez avec un espace simple (nom court, prix entier)' as suggestion_5; 
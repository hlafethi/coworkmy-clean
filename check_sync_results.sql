-- Script pour vérifier les résultats de la synchronisation Stripe
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier les jobs récents de synchronisation
SELECT 'JOBS DE SYNCHRONISATION RECENTS' as info;
SELECT 
    id,
    space_id,
    event_type,
    status,
    error_message,
    created_at,
    processed_at,
    CASE 
        WHEN processed_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (processed_at - created_at))::int
        ELSE NULL 
    END as duration_seconds
FROM stripe_sync_queue 
ORDER BY created_at DESC
LIMIT 10;

-- 2. Vérifier les espaces avec leurs IDs Stripe après synchronisation
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

-- 3. Vérifier les espaces SANS IDs Stripe
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

-- 4. Statistiques détaillées de synchronisation
SELECT 'STATISTIQUES DÉTAILLÉES' as info;
SELECT 
    COUNT(*) as total_espaces,
    COUNT(stripe_product_id) as avec_stripe_product,
    COUNT(stripe_price_id) as avec_stripe_price,
    COUNT(last_stripe_sync) as synchronises,
    COUNT(CASE WHEN stripe_product_id IS NOT NULL AND stripe_price_id IS NOT NULL THEN 1 END) as completement_sync,
    COUNT(CASE WHEN stripe_product_id IS NULL AND stripe_price_id IS NULL THEN 1 END) as non_sync,
    COUNT(CASE WHEN stripe_product_id IS NOT NULL AND stripe_price_id IS NULL THEN 1 END) as produit_seul,
    COUNT(CASE WHEN stripe_product_id IS NULL AND stripe_price_id IS NOT NULL THEN 1 END) as prix_seul
FROM spaces;

-- 5. Vérifier les jobs par statut
SELECT 'JOBS PAR STATUT' as info;
SELECT 
    status,
    COUNT(*) as nombre,
    MIN(created_at) as premier_job,
    MAX(created_at) as dernier_job,
    AVG(CASE 
        WHEN processed_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (processed_at - created_at))
        ELSE NULL 
    END) as duree_moyenne_secondes
FROM stripe_sync_queue 
GROUP BY status
ORDER BY status;

-- 6. Vérifier les jobs par type d'événement
SELECT 'JOBS PAR TYPE D\'ÉVÉNEMENT' as info;
SELECT 
    event_type,
    COUNT(*) as nombre,
    MIN(created_at) as premier_job,
    MAX(created_at) as dernier_job
FROM stripe_sync_queue 
GROUP BY event_type
ORDER BY event_type;

-- 7. Vérifier les erreurs récentes
SELECT 'ERREURS RÉCENTES' as info;
SELECT 
    id,
    space_id,
    event_type,
    error_message,
    created_at,
    processed_at
FROM stripe_sync_queue 
WHERE status = 'error'
ORDER BY created_at DESC
LIMIT 5;

-- 8. Vérifier les espaces avec des prix invalides
SELECT 'ESPACES AVEC PRIX INVALIDES' as info;
SELECT 
    id,
    name,
    pricing_type,
    hourly_price,
    daily_price,
    monthly_price,
    half_day_price,
    quarter_price,
    yearly_price,
    custom_price,
    CASE 
        WHEN pricing_type = 'hourly' AND (hourly_price IS NULL OR hourly_price <= 0) THEN 'Prix horaire invalide'
        WHEN pricing_type = 'daily' AND (daily_price IS NULL OR daily_price <= 0) THEN 'Prix journalier invalide'
        WHEN pricing_type = 'monthly' AND (monthly_price IS NULL OR monthly_price <= 0) THEN 'Prix mensuel invalide'
        WHEN pricing_type = 'half_day' AND (half_day_price IS NULL OR half_day_price <= 0) THEN 'Prix demi-journée invalide'
        WHEN pricing_type = 'quarter' AND (quarter_price IS NULL OR quarter_price <= 0) THEN 'Prix trimestriel invalide'
        WHEN pricing_type = 'yearly' AND (yearly_price IS NULL OR yearly_price <= 0) THEN 'Prix annuel invalide'
        WHEN pricing_type = 'custom' AND (custom_price IS NULL OR custom_price <= 0) THEN 'Prix personnalisé invalide'
        ELSE 'Prix valide'
    END as probleme_prix
FROM spaces 
WHERE is_active = true
  AND (
    (pricing_type = 'hourly' AND (hourly_price IS NULL OR hourly_price <= 0)) OR
    (pricing_type = 'daily' AND (daily_price IS NULL OR daily_price <= 0)) OR
    (pricing_type = 'monthly' AND (monthly_price IS NULL OR monthly_price <= 0)) OR
    (pricing_type = 'half_day' AND (half_day_price IS NULL OR half_day_price <= 0)) OR
    (pricing_type = 'quarter' AND (quarter_price IS NULL OR quarter_price <= 0)) OR
    (pricing_type = 'yearly' AND (yearly_price IS NULL OR yearly_price <= 0)) OR
    (pricing_type = 'custom' AND (custom_price IS NULL OR custom_price <= 0))
  );

-- 9. Créer un job de test avec plus de logs
SELECT 'CRÉATION JOB DE TEST AVEC LOGS DÉTAILLÉS' as info;
DO $$
DECLARE
    test_space_id UUID;
    test_space_name TEXT;
    test_space_pricing TEXT;
    test_space_price NUMERIC;
BEGIN
    -- Sélectionner un espace actif avec un prix valide
    SELECT id, name, pricing_type, 
           CASE 
               WHEN pricing_type = 'hourly' THEN hourly_price
               WHEN pricing_type = 'daily' THEN daily_price
               WHEN pricing_type = 'monthly' THEN monthly_price
               WHEN pricing_type = 'half_day' THEN half_day_price
               WHEN pricing_type = 'quarter' THEN quarter_price
               WHEN pricing_type = 'yearly' THEN yearly_price
               WHEN pricing_type = 'custom' THEN custom_price
               ELSE 0
           END as price
    INTO test_space_id, test_space_name, test_space_pricing, test_space_price
    FROM spaces 
    WHERE is_active = true
      AND stripe_product_id IS NULL
      AND (
        (pricing_type = 'hourly' AND hourly_price > 0) OR
        (pricing_type = 'daily' AND daily_price > 0) OR
        (pricing_type = 'monthly' AND monthly_price > 0) OR
        (pricing_type = 'half_day' AND half_day_price > 0) OR
        (pricing_type = 'quarter' AND quarter_price > 0) OR
        (pricing_type = 'yearly' AND yearly_price > 0) OR
        (pricing_type = 'custom' AND custom_price > 0)
      )
    LIMIT 1;
    
    IF test_space_id IS NOT NULL THEN
        INSERT INTO stripe_sync_queue (
            space_id,
            event_type,
            payload,
            status
        ) VALUES (
            test_space_id,
            'DETAILED_TEST',
            jsonb_build_object(
                'space_id', test_space_id,
                'space_name', test_space_name,
                'pricing_type', test_space_pricing,
                'price', test_space_price,
                'test_mode', true,
                'debug', true,
                'timestamp', now(),
                'note', 'Test détaillé avec vérification des prix'
            ),
            'pending'
        );
        
        RAISE NOTICE 'Job de test détaillé créé pour l''espace: % (%) - Prix: % %', 
                    test_space_name, test_space_id, test_space_price, test_space_pricing;
    ELSE
        RAISE NOTICE 'Aucun espace valide trouvé pour le test détaillé';
    END IF;
END $$;

-- 10. Suggestions de diagnostic
SELECT 'SUGGESTIONS DE DIAGNOSTIC' as info;
SELECT 
    '1. Vérifiez que les produits sont créés dans le dashboard Stripe (mode Live)' as suggestion_1,
    '2. Vérifiez les filtres "Active" dans le dashboard Stripe' as suggestion_2,
    '3. Vérifiez que les prix sont marqués comme actifs' as suggestion_3,
    '4. Testez avec un espace simple (nom court, prix entier)' as suggestion_4,
    '5. Vérifiez les logs de la fonction Edge dans le dashboard Supabase' as suggestion_5,
    '6. Testez la création manuelle d''un produit dans Stripe' as suggestion_6; 
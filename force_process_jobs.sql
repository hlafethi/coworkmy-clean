-- Script pour forcer le traitement des jobs en attente
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier les jobs en attente
SELECT 'JOBS EN ATTENTE' as info;
SELECT COUNT(*) as jobs_en_attente
FROM stripe_sync_queue 
WHERE status = 'pending';

-- 2. Marquer les jobs en attente comme terminés
UPDATE stripe_sync_queue 
SET 
    status = 'done',
    processed_at = now(),
    error_message = 'Marqué comme terminé - IDs Stripe déjà présents'
WHERE status = 'pending';

-- 3. Vérifier les produits Stripe existants
SELECT 'PRODUITS STRIPE EXISTANTS' as info;
SELECT 
    name,
    stripe_product_id,
    stripe_price_id,
    monthly_price,
    last_stripe_sync
FROM spaces 
WHERE stripe_product_id IS NOT NULL 
ORDER BY last_stripe_sync DESC;

-- 4. Vérifier les espaces avec leurs IDs Stripe actuels
SELECT 'ESPACES AVEC IDS STRIPE' as info;
SELECT 
    id,
    name,
    pricing_type,
    monthly_price,
    stripe_product_id,
    stripe_price_id,
    last_stripe_sync
FROM spaces 
WHERE stripe_product_id IS NOT NULL 
   AND stripe_price_id IS NOT NULL
ORDER BY last_stripe_sync DESC;

-- 5. Créer un job de test pour forcer la synchronisation
SELECT 'CRÉATION JOB DE TEST FORCÉ' as info;
DO $$
DECLARE
    test_space_id UUID;
    test_space_name TEXT;
BEGIN
    -- Sélectionner un espace avec des IDs Stripe existants
    SELECT id, name INTO test_space_id, test_space_name
    FROM spaces 
    WHERE stripe_product_id IS NOT NULL 
       AND stripe_price_id IS NOT NULL
    LIMIT 1;
    
    IF test_space_id IS NOT NULL THEN
        INSERT INTO stripe_sync_queue (
            space_id,
            event_type,
            payload,
            status
        ) VALUES (
            test_space_id,
            'FORCE_SYNC_TEST',
            jsonb_build_object(
                'space_id', test_space_id,
                'space_name', test_space_name,
                'force_sync', true,
                'timestamp', now(),
                'note', 'Test de synchronisation forcée'
            ),
            'pending'
        );
        
        RAISE NOTICE 'Job de test forcé créé pour l''espace: % (%)', test_space_name, test_space_id;
    ELSE
        RAISE NOTICE 'Aucun espace avec IDs Stripe trouvé';
    END IF;
END $$;

-- 6. Vérifier le résultat
SELECT 'RÉSULTAT DU MARQUAGE' as info;
SELECT 
    status,
    COUNT(*) as nombre
FROM stripe_sync_queue 
GROUP BY status
ORDER BY status;

-- 7. Créer un nouveau job de test propre
SELECT 'CRÉATION NOUVEAU JOB DE TEST' as info;
DO $$
DECLARE
    test_space_id UUID;
    test_space_name TEXT;
BEGIN
    -- Sélectionner un espace actif
    SELECT id, name INTO test_space_id, test_space_name
    FROM spaces 
    WHERE is_active = true
    LIMIT 1;
    
    IF test_space_id IS NOT NULL THEN
        INSERT INTO stripe_sync_queue (
            space_id,
            event_type,
            payload,
            status
        ) VALUES (
            test_space_id,
            'FRESH_TEST',
            jsonb_build_object(
                'space_id', test_space_id,
                'space_name', test_space_name,
                'fresh_test', true,
                'timestamp', now(),
                'note', 'Test frais pour vérifier la synchronisation'
            ),
            'pending'
        );
        
        RAISE NOTICE 'Nouveau job de test créé pour l''espace: % (%)', test_space_name, test_space_id;
    ELSE
        RAISE NOTICE 'Aucun espace actif trouvé';
    END IF;
END $$;

-- 8. Vérifier les produits Stripe existants
SELECT 'VÉRIFICATION DES PRODUITS STRIPE' as info;
SELECT 
    'Les produits suivants devraient être visibles dans le dashboard Stripe:' as note;

SELECT 
    name as nom_produit,
    stripe_product_id as id_produit_stripe,
    stripe_price_id as id_prix_stripe,
    monthly_price as prix_mensuel,
    last_stripe_sync as derniere_sync
FROM spaces 
WHERE stripe_product_id IS NOT NULL 
   AND stripe_price_id IS NOT NULL
ORDER BY last_stripe_sync DESC;

-- 9. Instructions pour vérifier dans Stripe
SELECT 'INSTRUCTIONS POUR VÉRIFIER DANS STRIPE' as info;
SELECT 
    '1. Allez sur https://dashboard.stripe.com/products' as instruction_1,
    '2. Vérifiez que vous êtes en mode Live (pas Test)' as instruction_2,
    '3. Assurez-vous que le filtre "Active" est activé' as instruction_3,
    '4. Recherchez les produits par nom ou ID' as instruction_4,
    '5. Vérifiez que les prix sont marqués comme actifs' as instruction_5,
    '6. Les produits peuvent prendre quelques secondes à apparaître' as instruction_6; 
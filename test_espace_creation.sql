-- Test de création d'espace pour vérifier la synchronisation Stripe
-- Exécuter ce script dans Supabase SQL Editor

-- 1. Créer un espace de test
INSERT INTO spaces (name, description, capacity, price_per_hour, is_active) 
VALUES ('Test Synchronisation Stripe', 'Espace de test pour vérifier la synchronisation automatique', 8, 35.00, true)
RETURNING id, name, price_per_hour, created_at;

-- 2. Attendre 2-3 secondes puis vérifier si les IDs Stripe ont été ajoutés
SELECT 
    id,
    name,
    price_per_hour,
    stripe_product_id,
    stripe_price_id,
    created_at,
    updated_at
FROM spaces 
WHERE name = 'Test Synchronisation Stripe'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Vérifier tous les espaces récents pour voir s'il y a des IDs Stripe
SELECT 
    id,
    name,
    price_per_hour,
    stripe_product_id,
    stripe_price_id,
    created_at
FROM spaces 
ORDER BY created_at DESC
LIMIT 5; 
-- Script de test pour vérifier la synchronisation Stripe
-- Ce script crée un espace de test et vérifie si le trigger fonctionne

-- 1. Créer un espace de test
INSERT INTO spaces (name, description, capacity, price_per_hour, is_active) 
VALUES ('Test Space Stripe', 'Espace de test pour vérifier la synchronisation Stripe', 6, 30.00, true)
RETURNING id, name, price_per_hour;

-- 2. Vérifier que l'espace a été créé
SELECT id, name, price_per_hour, stripe_product_id, stripe_price_id, created_at 
FROM spaces 
WHERE name = 'Test Space Stripe'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Vérifier les logs du trigger (optionnel - à exécuter dans les logs Supabase)
-- Les logs devraient montrer :
-- "Stripe sync trigger: INSERT on space [ID] (status: 200, response: {...})"

-- 4. Modifier l'espace pour tester l'UPDATE
UPDATE spaces 
SET price_per_hour = 35.00, name = 'Test Space Stripe Updated'
WHERE name = 'Test Space Stripe';

-- 5. Vérifier la modification
SELECT id, name, price_per_hour, stripe_product_id, stripe_price_id, updated_at 
FROM spaces 
WHERE name = 'Test Space Stripe Updated';

-- 6. Nettoyer le test (optionnel)
-- DELETE FROM spaces WHERE name = 'Test Space Stripe Updated'; 
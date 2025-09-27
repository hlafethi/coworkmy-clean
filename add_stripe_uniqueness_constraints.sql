-- Ajout des contraintes d'unicité pour éviter les doublons Stripe
-- Ces contraintes garantissent qu'un seul espace peut avoir un ID Stripe donné

-- Contrainte d'unicité sur stripe_product_id (sauf NULL)
ALTER TABLE spaces 
ADD CONSTRAINT unique_stripe_product_id 
UNIQUE (stripe_product_id) 
WHERE stripe_product_id IS NOT NULL;

-- Contrainte d'unicité sur stripe_price_id (sauf NULL)
ALTER TABLE spaces 
ADD CONSTRAINT unique_stripe_price_id 
UNIQUE (stripe_price_id) 
WHERE stripe_price_id IS NOT NULL;

-- Index pour optimiser les recherches par ID Stripe
CREATE INDEX IF NOT EXISTS idx_spaces_stripe_product_id_unique 
ON spaces(stripe_product_id) 
WHERE stripe_product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_spaces_stripe_price_id_unique 
ON spaces(stripe_price_id) 
WHERE stripe_price_id IS NOT NULL;

-- Vérification des contraintes
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'spaces' 
AND constraint_name LIKE '%stripe%'
ORDER BY constraint_name; 
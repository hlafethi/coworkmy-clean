-- Migration pour ajouter les contraintes d'unicité Stripe
-- Évite les doublons dans le catalogue Stripe

-- Index unique partiel sur stripe_product_id (sauf NULL)
CREATE UNIQUE INDEX IF NOT EXISTS unique_stripe_product_id 
ON spaces(stripe_product_id) 
WHERE stripe_product_id IS NOT NULL;

-- Index unique partiel sur stripe_price_id (sauf NULL)
CREATE UNIQUE INDEX IF NOT EXISTS unique_stripe_price_id 
ON spaces(stripe_price_id) 
WHERE stripe_price_id IS NOT NULL;

-- Index pour optimiser les recherches par ID Stripe
CREATE INDEX IF NOT EXISTS idx_spaces_stripe_product_id_search 
ON spaces(stripe_product_id) 
WHERE stripe_product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_spaces_stripe_price_id_search 
ON spaces(stripe_price_id) 
WHERE stripe_price_id IS NOT NULL; 
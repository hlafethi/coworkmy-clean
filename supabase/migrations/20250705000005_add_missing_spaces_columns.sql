-- Migration pour ajouter les colonnes manquantes à la table spaces
-- Ajout des colonnes essentielles pour la synchronisation Stripe

-- 1. Ajouter la colonne name (obligatoire)
ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Espace sans nom';

-- 2. Ajouter la colonne description
ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Ajouter la colonne capacity
ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1;

-- 4. Ajouter la colonne price_per_hour pour la tarification
ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS price_per_hour DECIMAL(10,2) DEFAULT 0.00;

-- 5. Ajouter les colonnes Stripe pour la synchronisation
ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- 6. Ajouter la colonne created_by pour tracer qui a créé l'espace
ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 7. Ajouter la colonne is_active pour gérer la disponibilité
ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 8. Vérifier la structure finale
SELECT 'STRUCTURE FINALE TABLE SPACES' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'spaces' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Créer un index sur les colonnes Stripe pour les performances
CREATE INDEX IF NOT EXISTS idx_spaces_stripe_product_id ON spaces(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_spaces_stripe_price_id ON spaces(stripe_price_id);
CREATE INDEX IF NOT EXISTS idx_spaces_is_active ON spaces(is_active); 
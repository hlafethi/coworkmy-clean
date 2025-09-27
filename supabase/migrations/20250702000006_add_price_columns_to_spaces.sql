-- Migration pour ajouter les colonnes de prix manquantes à la table spaces
-- Ces colonnes sont nécessaires pour la synchronisation Stripe

-- Ajouter les colonnes de prix spécifiques
ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS monthly_price NUMERIC(10, 2);

ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS hourly_price NUMERIC(10, 2);

ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS daily_price NUMERIC(10, 2);

ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS half_day_price NUMERIC(10, 2);

ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS quarter_price NUMERIC(10, 2);

ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS yearly_price NUMERIC(10, 2);

ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS custom_price NUMERIC(10, 2);

-- Ajouter les colonnes Stripe
ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

ALTER TABLE spaces 
ADD COLUMN IF NOT EXISTS last_stripe_sync TIMESTAMPTZ;

-- Vérifier la structure finale
SELECT 'STRUCTURE FINALE TABLE SPACES - COLONNES PRIX' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'spaces' 
AND column_name LIKE '%price%'
ORDER BY ordinal_position; 
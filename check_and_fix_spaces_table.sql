-- Vérifier et ajouter les colonnes manquantes à la table spaces

-- Ajouter les colonnes de prix si elles n'existent pas
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS price_per_month DECIMAL(10,2);
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS price_per_quarter DECIMAL(10,2);
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS price_per_year DECIMAL(10,2);
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS custom_price DECIMAL(10,2);
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS custom_label VARCHAR(255);
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(50);

-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'spaces' 
ORDER BY ordinal_position;

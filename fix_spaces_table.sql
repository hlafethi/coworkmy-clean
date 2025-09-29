-- Vérifier et corriger la structure de la table spaces

-- Vérifier d'abord la structure actuelle
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'spaces' 
ORDER BY ordinal_position;

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$
BEGIN
    -- Ajouter price_per_half_day si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'spaces' AND column_name = 'price_per_half_day') THEN
        ALTER TABLE spaces ADD COLUMN price_per_half_day DECIMAL(10,2);
    END IF;
    
    -- Ajouter image_url si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'spaces' AND column_name = 'image_url') THEN
        ALTER TABLE spaces ADD COLUMN image_url VARCHAR(500);
    END IF;
    
    -- Ajouter is_active si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'spaces' AND column_name = 'is_active') THEN
        ALTER TABLE spaces ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Vérifier la structure finale
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'spaces' 
ORDER BY ordinal_position;

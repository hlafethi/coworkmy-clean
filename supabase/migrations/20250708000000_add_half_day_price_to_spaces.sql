-- Migration : Ajout de la colonne half_day_price à la table spaces
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS half_day_price NUMERIC(10,2) DEFAULT 0; 
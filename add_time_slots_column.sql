-- Ajouter la colonne time_slots à la table spaces
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS time_slots JSONB;

-- Créer un index pour les requêtes sur les créneaux horaires
CREATE INDEX IF NOT EXISTS idx_spaces_time_slots ON spaces USING GIN (time_slots);

-- Commenter la colonne pour la documentation
COMMENT ON COLUMN spaces.time_slots IS 'Créneaux horaires disponibles pour cet espace au format JSON';

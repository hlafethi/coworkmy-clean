-- Ajouter les colonnes manquantes à la table profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS position TEXT;

-- Créer un index sur la colonne city pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);

-- Créer une fonction pour ajouter des colonnes dynamiquement
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
  table_name TEXT,
  column_name TEXT,
  column_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = $1 
    AND column_name = $2
  ) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', table_name, column_name, column_type);
  END IF;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION add_column_if_not_exists(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_column_if_not_exists(TEXT, TEXT, TEXT) TO service_role;

-- Créer une fonction pour exécuter du SQL dynamique
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role; 
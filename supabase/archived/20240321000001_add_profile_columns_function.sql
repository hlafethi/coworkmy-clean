-- Fonction pour ajouter des colonnes à la table profiles
CREATE OR REPLACE FUNCTION add_profile_columns(columns text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    col text;
BEGIN
    FOREACH col IN ARRAY columns
    LOOP
        EXECUTE format('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS %I TEXT', col);
    END LOOP;
END;
$$;

-- Ajouter les colonnes manquantes
SELECT add_profile_columns(ARRAY['city', 'postal_code', 'country']);

-- Créer un index pour optimiser les recherches par ville
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);

-- Mettre à jour le trigger updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at(); 
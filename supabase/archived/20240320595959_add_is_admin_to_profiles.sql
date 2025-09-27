-- Ajoute la colonne is_admin à profiles si elle n'existe pas déjà
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
-- Optionnel : index pour les recherches admin
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin); 
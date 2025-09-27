-- Supprimer l'ancienne fonction is_admin
DROP FUNCTION IF EXISTS public.is_admin();

-- Recréer la fonction is_admin avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND is_admin = true
  );
END;
$$;

-- Commentaire explicatif pour la fonction
COMMENT ON FUNCTION public.is_admin() IS 'Vérifie si l''utilisateur actuel est un administrateur en se basant sur la colonne is_admin de la table profiles.';

-- Supprimer les anciennes politiques admin_settings
DROP POLICY IF EXISTS "Admin settings are viewable by authenticated users" ON admin_settings;
DROP POLICY IF EXISTS "Admin settings are editable by admin users" ON admin_settings;
DROP POLICY IF EXISTS "Tout le monde peut voir les paramètres" ON admin_settings;
DROP POLICY IF EXISTS "Seuls les administrateurs peuvent modifier les paramètres" ON admin_settings;
DROP POLICY IF EXISTS "Seuls les administrateurs peuvent insérer des paramètres" ON admin_settings;
DROP POLICY IF EXISTS "Seuls les administrateurs peuvent supprimer les paramètres" ON admin_settings;

-- Activer RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Créer les nouvelles politiques avec des permissions spécifiques
-- Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Tout le monde peut voir les paramètres"
    ON admin_settings FOR SELECT
    TO authenticated
    USING (true);

-- Insertion uniquement pour les admins
CREATE POLICY "Seuls les administrateurs peuvent insérer des paramètres"
    ON admin_settings FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Mise à jour uniquement pour les admins
CREATE POLICY "Seuls les administrateurs peuvent modifier les paramètres"
    ON admin_settings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Suppression uniquement pour les admins
CREATE POLICY "Seuls les administrateurs peuvent supprimer les paramètres"
    ON admin_settings FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Commentaire explicatif pour la table
COMMENT ON TABLE admin_settings IS 'Table des paramètres d''administration. Lecture publique, modification réservée aux administrateurs.'; 
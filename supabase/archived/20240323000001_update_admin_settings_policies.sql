-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Admin settings are viewable by authenticated users" ON admin_settings;
DROP POLICY IF EXISTS "Admin settings are editable by admin users" ON admin_settings;
DROP POLICY IF EXISTS "Tout le monde peut voir les paramètres" ON admin_settings;
DROP POLICY IF EXISTS "Seuls les administrateurs peuvent modifier les paramètres" ON admin_settings;
DROP POLICY IF EXISTS "Les administrateurs peuvent voir tous les paramètres" ON admin_settings;
DROP POLICY IF EXISTS "Les administrateurs peuvent modifier les paramètres" ON admin_settings;

-- Activer RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Créer les nouvelles politiques basées sur is_admin dans profiles
CREATE POLICY "Tout le monde peut voir les paramètres"
    ON admin_settings FOR SELECT
    USING (true);

CREATE POLICY "Seuls les administrateurs peuvent modifier les paramètres"
    ON admin_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = true
        )
    );

-- Mettre à jour l'utilisateur spécifié comme admin
UPDATE public.profiles
SET is_admin = true
WHERE user_id = '9e11fb18-925c-4654-8dd0-bf65cbd3c9b4'; 
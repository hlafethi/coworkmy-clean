-- Création de la table homepage_settings
CREATE TABLE IF NOT EXISTS public.homepage_settings (
    id TEXT PRIMARY KEY DEFAULT 'current_settings',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    hero_title TEXT NOT NULL,
    hero_subtitle TEXT NOT NULL,
    hero_background_image TEXT,
    cta_text TEXT NOT NULL,
    features_title TEXT NOT NULL,
    features_subtitle TEXT NOT NULL,
    cta_section_title TEXT NOT NULL,
    cta_section_subtitle TEXT NOT NULL,
    cta_secondary_button_text TEXT NOT NULL,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.homepage_settings ENABLE ROW LEVEL SECURITY;

-- Policy pour la lecture publique des paramètres publiés
CREATE POLICY "Lecture publique homepage"
ON public.homepage_settings
FOR SELECT
USING (is_published = true);

-- Policy pour l'upsert (insert/update) des admins
CREATE POLICY "Upsert admin homepage"
ON public.homepage_settings
FOR INSERT, UPDATE
USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy pour l'accès complet des administrateurs (optionnel, pour DELETE)
CREATE POLICY "Full access admin homepage"
ON public.homepage_settings
FOR ALL
USING (
  public.is_admin() OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Insérer les paramètres par défaut
INSERT INTO public.homepage_settings (
    title,
    description,
    hero_title,
    hero_subtitle,
    cta_text,
    features_title,
    features_subtitle,
    cta_section_title,
    cta_section_subtitle,
    cta_secondary_button_text,
    is_published
)
VALUES (
    'Bienvenue sur Canard Cowork Space',
    'Votre espace de coworking à Paris',
    'Votre espace de travail idéal à Paris',
    'Des espaces de coworking modernes et inspirants pour les freelances, entrepreneurs et équipes qui veulent travailler dans un environnement stimulant et connecté.',
    'Commencer',
    'Pourquoi choisir Canard CoWork ?',
    'Nous offrons bien plus qu''un simple espace de travail. Découvrez nos avantages exclusifs qui font de nous le choix idéal pour les professionnels exigeants.',
    'Prêt à rejoindre notre communauté ?',
    'Inscrivez-vous dès aujourd''hui et commencez à profiter de tous les avantages',
    'Réserver une visite',
    false
)
ON CONFLICT (id) DO NOTHING; 
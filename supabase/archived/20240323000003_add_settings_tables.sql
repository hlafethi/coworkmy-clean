-- Création de la table site_settings
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'current_settings',
    name TEXT NOT NULL,
    contact_email TEXT,
    phone_number TEXT,
    workspace_title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Création de la table stripe_settings
CREATE TABLE IF NOT EXISTS public.stripe_settings (
    id TEXT PRIMARY KEY DEFAULT 'current_settings',
    test_publishable_key TEXT,
    test_secret_key TEXT,
    webhook_secret TEXT,
    live_publishable_key TEXT,
    live_secret_key TEXT,
    live_webhook_secret TEXT,
    mode TEXT CHECK (mode IN ('test', 'live')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_settings ENABLE ROW LEVEL SECURITY;

-- Policies pour site_settings
CREATE POLICY "Enable read access for authenticated users"
ON public.site_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable full access for admins"
ON public.site_settings
FOR ALL
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

-- Policies pour stripe_settings
CREATE POLICY "Enable read access for authenticated users"
ON public.stripe_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable full access for admins"
ON public.stripe_settings
FOR ALL
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

-- Insérer les paramètres par défaut
INSERT INTO public.site_settings (name, contact_email, phone_number, workspace_title)
VALUES ('Canard Cowork Space', 'contact@canard-cowork.space', NULL, 'Espace de travail')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stripe_settings (mode)
VALUES ('test')
ON CONFLICT (id) DO NOTHING; 
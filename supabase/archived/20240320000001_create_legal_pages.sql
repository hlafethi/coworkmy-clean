-- Création de la table legal_pages
CREATE TABLE IF NOT EXISTS public.legal_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('terms', 'privacy', 'legal')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type)
);

-- Insertion des pages par défaut
INSERT INTO public.legal_pages (type, title, content) VALUES
    ('legal', 'Mentions Légales', '<p>Insérez vos mentions légales ici.</p>'),
    ('privacy', 'Politique de Confidentialité', '<p>Insérez votre politique de confidentialité ici.</p>'),
    ('terms', 'Conditions Générales d''Utilisation', '<p>Insérez vos conditions générales ici.</p>')
ON CONFLICT (type) DO NOTHING;

-- Ajout des politiques de sécurité RLS
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

-- Politique pour la lecture (tout le monde peut lire)
CREATE POLICY "Les pages légales sont visibles par tous"
    ON public.legal_pages
    FOR SELECT
    TO public
    USING (true);

-- Politique pour la modification (seuls les admins peuvent modifier)
CREATE POLICY "Seuls les admins peuvent modifier les pages légales"
    ON public.legal_pages
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin'); 
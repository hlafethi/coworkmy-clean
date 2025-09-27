-- Correction des politiques RLS pour support_tickets
-- Activer la RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can insert their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.support_tickets;

-- Politique de lecture pour l'utilisateur (ses propres tickets)
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
FOR SELECT
USING (user_id = auth.uid());

-- Politique de lecture pour l'admin (tous les tickets)
CREATE POLICY "Admins can view all tickets" ON public.support_tickets
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- Politique d'insertion pour l'utilisateur (ses propres tickets)
CREATE POLICY "Users can insert their own tickets" ON public.support_tickets
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Politique de mise à jour pour l'admin (tous les tickets)
CREATE POLICY "Admins can update tickets" ON public.support_tickets
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- Vérifier que les politiques sont créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'support_tickets';

-- Vérifier la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'support_tickets' 
AND table_schema = 'public'
ORDER BY ordinal_position; 
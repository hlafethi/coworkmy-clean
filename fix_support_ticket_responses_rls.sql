-- Correction des politiques RLS pour support_ticket_responses
-- Activer la RLS
ALTER TABLE public.support_ticket_responses ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their ticket responses" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Admins can view all ticket responses" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Users can insert their own responses" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Admins can insert responses" ON public.support_ticket_responses;

-- Politique de lecture pour l'utilisateur (ses propres réponses + réponses de ses tickets)
CREATE POLICY "Users can view their ticket responses" ON public.support_ticket_responses
FOR SELECT
USING (
    user_id = auth.uid() OR
    ticket_id IN (
        SELECT id FROM public.support_tickets WHERE user_id = auth.uid()
    )
);

-- Politique de lecture pour l'admin (toutes les réponses)
CREATE POLICY "Admins can view all ticket responses" ON public.support_ticket_responses
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- Politique d'insertion pour l'utilisateur (réponses à ses propres tickets)
CREATE POLICY "Users can insert their own responses" ON public.support_ticket_responses
FOR INSERT
WITH CHECK (
    user_id = auth.uid() AND
    ticket_id IN (
        SELECT id FROM public.support_tickets WHERE user_id = auth.uid()
    )
);

-- Politique d'insertion pour l'admin (réponses à tous les tickets)
CREATE POLICY "Admins can insert responses" ON public.support_ticket_responses
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- Vérifier que les politiques sont créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'support_ticket_responses';

-- Vérifier la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'support_ticket_responses' 
AND table_schema = 'public'
ORDER BY ordinal_position; 
-- Correction des politiques RLS pour support_chat_sessions
-- Activer la RLS
ALTER TABLE public.support_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow insert for owner" ON public.support_chat_sessions;
DROP POLICY IF EXISTS "Allow select for owner" ON public.support_chat_sessions;
DROP POLICY IF EXISTS "Allow select for admin" ON public.support_chat_sessions;
DROP POLICY IF EXISTS "Allow update for owner" ON public.support_chat_sessions;

-- Politique d'insertion pour l'utilisateur courant (WITH CHECK pour INSERT)
CREATE POLICY "Allow insert for owner"
ON public.support_chat_sessions
FOR INSERT
WITH CHECK (user_id = auth.uid()::text);

-- Politique de lecture pour l'utilisateur courant (USING pour SELECT)
CREATE POLICY "Allow select for owner"
ON public.support_chat_sessions
FOR SELECT
USING (user_id = auth.uid()::text);

-- Politique de lecture pour l'admin (correction du type)
CREATE POLICY "Allow select for admin"
ON public.support_chat_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Politique de mise à jour pour l'utilisateur courant
CREATE POLICY "Allow update for owner"
ON public.support_chat_sessions
FOR UPDATE
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Vérifier que les politiques sont créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'support_chat_sessions'; 
-- Vérifier et corriger les politiques RLS pour support_chat_messages
-- Activer la RLS
ALTER TABLE public.support_chat_messages ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Allow insert for owner" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow select for owner" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow select for admin" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow update for owner" ON public.support_chat_messages;

-- Politique d'insertion pour l'utilisateur courant
CREATE POLICY "Allow insert for owner"
ON public.support_chat_messages
FOR INSERT
WITH CHECK (user_id = auth.uid()::text);

-- Politique de lecture pour l'utilisateur courant (corrigée)
DROP POLICY IF EXISTS "Allow select for owner" ON public.support_chat_messages;
CREATE POLICY "Allow select for owner" ON public.support_chat_messages
FOR SELECT
USING (
  session_id IN (
    SELECT id FROM public.support_chat_sessions WHERE user_id = auth.uid()
  )
);

-- Politique de mise à jour pour l'utilisateur courant
CREATE POLICY "Allow update for owner"
ON public.support_chat_messages
FOR UPDATE
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Politique de lecture pour l'admin
CREATE POLICY "Allow select for admin"
ON public.support_chat_messages
FOR SELECT
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
WHERE tablename = 'support_chat_messages';

-- Vérifier la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'support_chat_messages' 
AND table_schema = 'public'
ORDER BY ordinal_position; 
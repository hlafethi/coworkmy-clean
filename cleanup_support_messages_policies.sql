-- Nettoyer les politiques RLS en double pour support_chat_messages
-- Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Admins can insert chat messages" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Admins can view all chat messages" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow insert for owner" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow select for admin" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow select for owner" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow update for owner" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Anyone can send chat messages" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Anyone can view their own chat messages" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs messages de chat" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs messages de chat" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Users can view their own chat messages" ON public.support_chat_messages;

-- Créer les politiques propres et finales
-- Politique d'insertion pour l'utilisateur courant
CREATE POLICY "Users can insert their own messages"
ON public.support_chat_messages
FOR INSERT
WITH CHECK (
  user_id = auth.uid()::text AND
  session_id IN (
    SELECT id FROM support_chat_sessions 
    WHERE user_id = auth.uid()
  )
);

-- Politique de lecture pour l'utilisateur courant
CREATE POLICY "Users can view their own messages"
ON public.support_chat_messages
FOR SELECT
USING (
  user_id = auth.uid()::text OR
  session_id IN (
    SELECT id FROM support_chat_sessions 
    WHERE user_id = auth.uid()
  )
);

-- Politique de mise à jour pour l'utilisateur courant
CREATE POLICY "Users can update their own messages"
ON public.support_chat_messages
FOR UPDATE
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Politique de lecture pour l'admin
CREATE POLICY "Admins can view all messages"
ON public.support_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Politique d'insertion pour l'admin
CREATE POLICY "Admins can insert messages"
ON public.support_chat_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Vérifier les politiques finales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'support_chat_messages'
ORDER BY policyname; 
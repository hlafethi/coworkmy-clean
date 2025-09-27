-- Ajouter la colonne session_id à support_chat_messages
ALTER TABLE public.support_chat_messages 
ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.support_chat_sessions(id) ON DELETE CASCADE;

-- Mettre à jour les politiques RLS pour inclure session_id
DROP POLICY IF EXISTS "Allow insert for owner" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow select for owner" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow select for admin" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow update for owner" ON public.support_chat_messages;

-- Politique d'insertion pour l'utilisateur courant
CREATE POLICY "Allow insert for owner"
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
CREATE POLICY "Allow select for owner"
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

-- Vérifier la structure mise à jour
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'support_chat_messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les politiques
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'support_chat_messages'; 
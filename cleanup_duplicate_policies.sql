-- Nettoyage des politiques RLS en double et recréation propre
-- Ce script supprime toutes les politiques existantes et les recrée correctement

-- 1. Supprimer toutes les politiques existantes sur support_chat_messages
DROP POLICY IF EXISTS "Admins can insert messages" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow insert for owner" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow select for admin" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow select for owner" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow update for owner" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.support_chat_messages;

-- 2. Supprimer toutes les politiques existantes sur support_chat_sessions
DROP POLICY IF EXISTS "Allow insert for owner" ON public.support_chat_sessions;
DROP POLICY IF EXISTS "Allow select for admin" ON public.support_chat_sessions;
DROP POLICY IF EXISTS "Allow select for owner" ON public.support_chat_sessions;
DROP POLICY IF EXISTS "Allow update for owner" ON public.support_chat_sessions;

-- 3. Supprimer toutes les politiques existantes sur support_ticket_responses
DROP POLICY IF EXISTS "Admins can insert responses" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Admins can view all ticket responses" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir les réponses de leurs tickets" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Users can create responses to their tickets" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Users can insert their own responses" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Users can view responses to their tickets" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Users can view their ticket responses" ON public.support_ticket_responses;

-- 4. Supprimer toutes les politiques existantes sur support_tickets
DROP POLICY IF EXISTS "Admins can update tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs propres tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can insert their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;

-- 5. Recréer les politiques pour support_chat_messages
CREATE POLICY "Users can view their own chat messages" ON public.support_chat_messages
FOR SELECT
USING (
  session_id IN (
    SELECT id FROM public.support_chat_sessions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own chat messages" ON public.support_chat_messages
FOR INSERT
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own chat messages" ON public.support_chat_messages
FOR UPDATE
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Admins can view all chat messages" ON public.support_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can insert chat messages" ON public.support_chat_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- 6. Recréer les politiques pour support_chat_sessions
CREATE POLICY "Users can view their own chat sessions" ON public.support_chat_sessions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own chat sessions" ON public.support_chat_sessions
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chat sessions" ON public.support_chat_sessions
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all chat sessions" ON public.support_chat_sessions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- 7. Recréer les politiques pour support_ticket_responses
CREATE POLICY "Users can view their ticket responses" ON public.support_ticket_responses
FOR SELECT
USING (
    user_id = auth.uid() OR
    ticket_id IN (
        SELECT id FROM public.support_tickets WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own responses" ON public.support_ticket_responses
FOR INSERT
WITH CHECK (
    user_id = auth.uid() AND
    ticket_id IN (
        SELECT id FROM public.support_tickets WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all ticket responses" ON public.support_ticket_responses
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

CREATE POLICY "Admins can insert responses" ON public.support_ticket_responses
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- 8. Recréer les politiques pour support_tickets
CREATE POLICY "Users can view their own tickets" ON public.support_tickets
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own tickets" ON public.support_tickets
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all tickets" ON public.support_tickets
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

CREATE POLICY "Admins can update tickets" ON public.support_tickets
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- 9. Vérifier le résultat
SELECT 'Politiques RLS après nettoyage:' as info;
SELECT 
    schemaname::text as schema_name,
    tablename::text as table_name,
    policyname::text as policy_name,
    permissive::text as permissive,
    roles::text as roles,
    cmd::text as command
FROM pg_policies 
WHERE tablename IN ('support_tickets', 'support_ticket_responses', 'support_chat_messages', 'support_chat_sessions')
AND schemaname = 'public'
ORDER BY tablename, policyname; 
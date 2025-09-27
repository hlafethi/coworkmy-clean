-- Correction de la politique RLS pour le chat support utilisateur
-- Permet à l'utilisateur de lire tous les messages où user_id = auth.uid()::text (même si is_admin = true)

DROP POLICY IF EXISTS "Users can view their own chat messages" ON support_chat_messages;

CREATE POLICY "Users can view their own chat messages" ON support_chat_messages
    FOR SELECT USING (
        user_id = auth.uid()::text OR 
        user_id LIKE 'support_guest_%'
    );

-- Correction de la politique RLS pour le chat support admin (utilise la table 'profiles')
DROP POLICY IF EXISTS "Admins can view all chat messages" ON support_chat_messages;

CREATE POLICY "Admins can view all chat messages" ON support_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

DROP POLICY IF EXISTS "Admins can insert chat messages" ON support_chat_messages;

CREATE POLICY "Admins can insert chat messages" ON support_chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Politique RLS : lecture de ses propres sessions
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON support_chat_sessions;
CREATE POLICY "Users can view their own chat sessions" ON support_chat_sessions
  FOR SELECT USING (user_id = auth.uid());

-- Politique RLS : création de session par l'utilisateur
DROP POLICY IF EXISTS "Users can insert their own chat session" ON support_chat_sessions;
CREATE POLICY "Users can insert their own chat session" ON support_chat_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid()); 
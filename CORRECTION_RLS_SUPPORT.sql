-- =====================================================
-- CORRECTION DES POLICIES RLS AMBIGUËS - SUPPORT (CAST UUID)
-- =====================================================

-- 1. SUPPORT_TICKETS
DROP POLICY IF EXISTS "Tickets - lecture utilisateur" ON support_tickets;
CREATE POLICY "Tickets - lecture utilisateur" ON support_tickets
  FOR SELECT USING (
    support_tickets.user_id = auth.uid()::uuid OR public.is_admin()
  );

DROP POLICY IF EXISTS "Tickets - gestion admin" ON support_tickets;
CREATE POLICY "Tickets - gestion admin" ON support_tickets
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2. SUPPORT_TICKET_RESPONSES
DROP POLICY IF EXISTS "Réponses - lecture utilisateur" ON support_ticket_responses;
CREATE POLICY "Réponses - lecture utilisateur" ON support_ticket_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets st
      WHERE st.id = support_ticket_responses.ticket_id
      AND (st.user_id = auth.uid()::uuid OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Réponses - gestion admin" ON support_ticket_responses;
CREATE POLICY "Réponses - gestion admin" ON support_ticket_responses
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. SUPPORT_CHAT_MESSAGES
DROP POLICY IF EXISTS "Messages - lecture utilisateur" ON support_chat_messages;
CREATE POLICY "Messages - lecture utilisateur" ON support_chat_messages
  FOR SELECT USING (
    support_chat_messages.user_id = auth.uid()::uuid OR 
    support_chat_messages.user_id LIKE 'support_guest_%' OR 
    public.is_admin()
  );

DROP POLICY IF EXISTS "Messages - gestion admin" ON support_chat_messages;
CREATE POLICY "Messages - gestion admin" ON support_chat_messages
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. SUPPORT_CHAT_SESSIONS
DROP POLICY IF EXISTS "Sessions - lecture utilisateur" ON support_chat_sessions;
CREATE POLICY "Sessions - lecture utilisateur" ON support_chat_sessions
  FOR SELECT USING (
    support_chat_sessions.user_id = auth.uid()::uuid OR 
    support_chat_sessions.user_id LIKE 'support_guest_%' OR 
    public.is_admin()
  );

DROP POLICY IF EXISTS "Sessions - gestion admin" ON support_chat_sessions;
CREATE POLICY "Sessions - gestion admin" ON support_chat_sessions
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

SELECT '🎉 Correction des policies RLS support (UUID) terminée avec succès !' as message; 
-- Correction simple de la configuration Realtime
-- Ajouter les tables de support à la publication

-- 1. Ajouter support_tickets
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;

-- 2. Ajouter support_ticket_responses  
ALTER PUBLICATION supabase_realtime ADD TABLE support_ticket_responses;

-- 3. Ajouter support_chat_messages
ALTER PUBLICATION supabase_realtime ADD TABLE support_chat_messages;

-- 4. Ajouter support_chat_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE support_chat_sessions;

-- Vérifier le résultat
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('support_tickets', 'support_ticket_responses', 'support_chat_messages', 'support_chat_sessions')
ORDER BY tablename; 
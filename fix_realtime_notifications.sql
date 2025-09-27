-- Activation des notifications temps réel pour les tables de support
-- Ce script active les publications Realtime sur les tables de support

-- Vérifier d'abord quelles tables sont déjà publiées
SELECT 'Tables déjà publiées:' as info;
SELECT 
    schemaname::text as schema_name,
    tablename::text as table_name,
    pubname::text as publication_name
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('support_tickets', 'support_ticket_responses', 'support_chat_messages', 'support_chat_sessions')
ORDER BY tablename;

-- Activer les publications pour support_tickets (seulement si pas déjà présent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'support_tickets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
        RAISE NOTICE 'Table support_tickets ajoutée à la publication';
    ELSE
        RAISE NOTICE 'Table support_tickets déjà dans la publication';
    END IF;
END $$;

-- Activer les publications pour support_ticket_responses (seulement si pas déjà présent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'support_ticket_responses'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_responses;
        RAISE NOTICE 'Table support_ticket_responses ajoutée à la publication';
    ELSE
        RAISE NOTICE 'Table support_ticket_responses déjà dans la publication';
    END IF;
END $$;

-- Activer les publications pour support_chat_messages (seulement si pas déjà présent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'support_chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.support_chat_messages;
        RAISE NOTICE 'Table support_chat_messages ajoutée à la publication';
    ELSE
        RAISE NOTICE 'Table support_chat_messages déjà dans la publication';
    END IF;
END $$;

-- Activer les publications pour support_chat_sessions (seulement si pas déjà présent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'support_chat_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.support_chat_sessions;
        RAISE NOTICE 'Table support_chat_sessions ajoutée à la publication';
    ELSE
        RAISE NOTICE 'Table support_chat_sessions déjà dans la publication';
    END IF;
END $$;

-- Vérifier le résultat final
SELECT 'Résultat final - Tables publiées:' as info;
SELECT 
    schemaname::text as schema_name,
    tablename::text as table_name,
    pubname::text as publication_name
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('support_tickets', 'support_ticket_responses', 'support_chat_messages', 'support_chat_sessions')
ORDER BY tablename;

-- Vérifier que les triggers de réplication sont actifs
SELECT 'Triggers de réplication:' as info;
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    t.tgtype
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE t.tgname LIKE '%_notify_%'
AND c.relname IN ('support_tickets', 'support_ticket_responses', 'support_chat_messages', 'support_chat_sessions')
ORDER BY c.relname; 
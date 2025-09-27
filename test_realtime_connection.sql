-- Test de la configuration Realtime pour les notifications
-- Ce script vérifie que tout est correctement configuré

-- 1. Vérifier que la publication supabase_realtime existe
SELECT 'Publication supabase_realtime:' as info;
SELECT 
    pubname::text as publication_name,
    puballtables::text as all_tables,
    pubinsert::text as insert_enabled,
    pubupdate::text as update_enabled,
    pubdelete::text as delete_enabled
FROM pg_publication 
WHERE pubname = 'supabase_realtime';

-- 2. Vérifier les tables dans la publication
SELECT 'Tables dans la publication:' as info;
SELECT 
    schemaname::text as schema_name,
    tablename::text as table_name,
    pubname::text as publication_name
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('support_tickets', 'support_ticket_responses', 'support_chat_messages', 'support_chat_sessions')
ORDER BY tablename;

-- 3. Vérifier que les tables existent
SELECT 'Tables de support existantes:' as info;
SELECT 
    schemaname::text as schema_name,
    tablename::text as table_name,
    tableowner::text as owner
FROM pg_tables 
WHERE tablename IN ('support_tickets', 'support_ticket_responses', 'support_chat_messages', 'support_chat_sessions')
AND schemaname = 'public'
ORDER BY tablename;

-- 4. Vérifier les triggers de réplication
SELECT 'Triggers de réplication:' as info;
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    CASE t.tgenabled 
        WHEN 'O' THEN 'Enabled'
        WHEN 'D' THEN 'Disabled'
        WHEN 'R' THEN 'Replica'
        WHEN 'A' THEN 'Always'
        ELSE 'Unknown'
    END as trigger_status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE t.tgname LIKE '%_notify_%'
AND c.relname IN ('support_tickets', 'support_ticket_responses', 'support_chat_messages', 'support_chat_sessions')
ORDER BY c.relname;

-- 5. Vérifier les permissions sur les tables
SELECT 'Permissions sur les tables:' as info;
SELECT 
    schemaname::text as schema_name,
    tablename::text as table_name,
    tableowner::text as owner,
    hasindexes::text as has_indexes,
    hasrules::text as has_rules,
    hastriggers::text as has_triggers
FROM pg_tables 
WHERE tablename IN ('support_tickets', 'support_ticket_responses', 'support_chat_messages', 'support_chat_sessions')
AND schemaname = 'public'
ORDER BY tablename;

-- 6. Test d'insertion pour vérifier les triggers
SELECT 'Test d''insertion (simulation):' as info;
SELECT 'Pour tester les notifications, insérez manuellement un ticket ou une réponse' as instruction; 
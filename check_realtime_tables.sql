-- Vérification et correction de la configuration Realtime
-- Ce script s'assure que toutes les tables de support sont dans la publication Realtime

-- 1. Vérifier les tables actuellement dans la publication
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses')
ORDER BY tablename;

-- 2. Ajouter les tables manquantes à la publication
DO $$
DECLARE
    table_name text;
    table_exists boolean;
    table_in_pub boolean;
BEGIN
    -- Liste des tables de support
    FOR table_name IN VALUES 
        ('support_chat_sessions'),
        ('support_chat_messages'), 
        ('support_tickets'),
        ('support_ticket_responses')
    LOOP
        -- Vérifier si la table existe
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) INTO table_exists;
        
        -- Vérifier si la table est dans la publication
        SELECT EXISTS (
            SELECT FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = table_name
        ) INTO table_in_pub;
        
        -- Ajouter la table à la publication si elle existe mais n'y est pas
        IF table_exists AND NOT table_in_pub THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
            RAISE NOTICE 'Table % ajoutée à la publication Realtime', table_name;
        ELSIF NOT table_exists THEN
            RAISE NOTICE 'Table % n''existe pas', table_name;
        ELSIF table_in_pub THEN
            RAISE NOTICE 'Table % est déjà dans la publication Realtime', table_name;
        END IF;
    END LOOP;
END $$;

-- 3. Vérifier les triggers de réplication
SELECT 
    schemaname,
    tablename,
    triggername,
    tgtype
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relname IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses')
AND t.tgname LIKE '%_realtime_%'
ORDER BY tablename, triggername;

-- 4. Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses')
ORDER BY tablename, policyname;

-- 5. Vérifier que RLS est activé sur les tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses')
ORDER BY tablename;

-- 6. Afficher un résumé final
SELECT 
    'Configuration Realtime' as check_type,
    COUNT(*) as tables_in_realtime
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses')

UNION ALL

SELECT 
    'Tables avec RLS activé' as check_type,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses')
AND rowsecurity = true

UNION ALL

SELECT 
    'Politiques RLS configurées' as check_type,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses'); 
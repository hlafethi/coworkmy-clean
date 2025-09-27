-- Script final pour corriger la configuration Realtime
-- Ce script s'assure que toutes les tables de support sont correctement configurées

-- 1. Vérifier et ajouter les tables à la publication Realtime
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
            RAISE NOTICE '✅ Table % ajoutée à la publication Realtime', table_name;
        ELSIF NOT table_exists THEN
            RAISE NOTICE '❌ Table % n''existe pas', table_name;
        ELSIF table_in_pub THEN
            RAISE NOTICE '✅ Table % est déjà dans la publication Realtime', table_name;
        END IF;
    END LOOP;
END $$;

-- 2. Vérifier que RLS est activé sur toutes les tables
DO $$
DECLARE
    table_name text;
    rls_enabled boolean;
BEGIN
    FOR table_name IN VALUES 
        ('support_chat_sessions'),
        ('support_chat_messages'), 
        ('support_tickets'),
        ('support_ticket_responses')
    LOOP
        SELECT rowsecurity INTO rls_enabled
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = table_name;
        
        IF rls_enabled THEN
            RAISE NOTICE '✅ RLS activé sur la table %', table_name;
        ELSE
            RAISE NOTICE '❌ RLS non activé sur la table %', table_name;
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
            RAISE NOTICE '✅ RLS activé sur la table %', table_name;
        END IF;
    END LOOP;
END $$;

-- 3. Vérifier les politiques RLS existantes
SELECT 
    'Politiques RLS existantes:' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses')
ORDER BY tablename, policyname;

-- 4. Vérifier les triggers de réplication
SELECT 
    'Triggers de réplication:' as info,
    schemaname,
    tablename,
    triggername,
    CASE tgenabled 
        WHEN 'O' THEN 'Enabled'
        WHEN 'D' THEN 'Disabled'
        WHEN 'R' THEN 'Replica'
        WHEN 'A' THEN 'Always'
        ELSE 'Unknown'
    END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relname IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses')
AND t.tgname LIKE '%_realtime_%'
ORDER BY tablename, triggername;

-- 5. Résumé final de la configuration
SELECT 
    'Résumé de la configuration Realtime:' as info,
    COUNT(*) as tables_in_realtime
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses')

UNION ALL

SELECT 
    'Tables avec RLS activé:' as info,
    COUNT(*)::text as count
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses')
AND rowsecurity = true

UNION ALL

SELECT 
    'Politiques RLS configurées:' as info,
    COUNT(*)::text as count
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses')

UNION ALL

SELECT 
    'Triggers de réplication:' as info,
    COUNT(*)::text as count
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relname IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses')
AND t.tgname LIKE '%_realtime_%';

-- 6. Afficher les tables finales dans la publication
SELECT 
    'Tables finales dans la publication Realtime:' as info,
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses')
ORDER BY tablename; 
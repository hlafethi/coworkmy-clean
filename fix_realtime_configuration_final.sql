-- =====================================================
-- CORRECTION COMPLÈTE DE LA CONFIGURATION REALTIME
-- =====================================================

-- 1. VÉRIFICATION INITIALE
-- =====================================================

-- Vérifier que la publication supabase_realtime existe
SELECT '1. Vérification de la publication supabase_realtime:' as info;
SELECT 
    pubname::text as publication_name,
    puballtables::text as all_tables,
    pubinsert::text as insert_enabled,
    pubupdate::text as update_enabled,
    pubdelete::text as delete_enabled
FROM pg_publication 
WHERE pubname = 'supabase_realtime';

-- Vérifier les tables actuellement dans la publication
SELECT '2. Tables actuellement dans la publication:' as info;
SELECT 
    schemaname::text as schema_name,
    tablename::text as table_name,
    pubname::text as publication_name
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('support_tickets', 'support_ticket_responses', 'support_chat_messages', 'support_chat_sessions')
ORDER BY tablename;

-- Vérifier que les tables existent
SELECT '3. Tables de support existantes:' as info;
SELECT 
    schemaname::text as schema_name,
    tablename::text as table_name,
    tableowner::text as owner
FROM pg_tables 
WHERE tablename IN ('support_tickets', 'support_ticket_responses', 'support_chat_messages', 'support_chat_sessions')
AND schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 2. CORRECTION DE LA CONFIGURATION
-- =====================================================

-- Supprimer toutes les tables de support de la publication (pour repartir proprement)
DO $$
BEGIN
    -- Supprimer support_tickets
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'support_tickets'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE support_tickets;
        RAISE NOTICE 'Table support_tickets supprimée de la publication';
    END IF;
    
    -- Supprimer support_ticket_responses
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'support_ticket_responses'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE support_ticket_responses;
        RAISE NOTICE 'Table support_ticket_responses supprimée de la publication';
    END IF;
    
    -- Supprimer support_chat_messages
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'support_chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE support_chat_messages;
        RAISE NOTICE 'Table support_chat_messages supprimée de la publication';
    END IF;
    
    -- Supprimer support_chat_sessions
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'support_chat_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE support_chat_sessions;
        RAISE NOTICE 'Table support_chat_sessions supprimée de la publication';
    END IF;
END $$;

-- Ajouter toutes les tables de support à la publication
DO $$
DECLARE
    table_name text;
    table_exists boolean;
BEGIN
    -- Liste des tables de support
    FOR table_name IN VALUES 
        ('support_tickets'),
        ('support_ticket_responses'),
        ('support_chat_messages'),
        ('support_chat_sessions')
    LOOP
        -- Vérifier si la table existe
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) INTO table_exists;
        
        -- Ajouter la table à la publication si elle existe
        IF table_exists THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
            RAISE NOTICE '✅ Table % ajoutée à la publication Realtime', table_name;
        ELSE
            RAISE NOTICE '❌ Table % n''existe pas', table_name;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 3. VÉRIFICATION FINALE
-- =====================================================

-- Vérifier le résultat final
SELECT '4. Résultat final - Tables publiées:' as info;
SELECT 
    schemaname::text as schema_name,
    tablename::text as table_name,
    pubname::text as publication_name
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('support_tickets', 'support_ticket_responses', 'support_chat_messages', 'support_chat_sessions')
ORDER BY tablename;

-- Vérifier les triggers de réplication
SELECT '5. Triggers de réplication:' as info;
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

-- Vérifier que RLS est activé sur toutes les tables
SELECT '6. Statut RLS des tables:' as info;
SELECT 
    schemaname::text as schema_name,
    tablename::text as table_name,
    rowsecurity::text as rls_enabled
FROM pg_tables 
WHERE tablename IN ('support_tickets', 'support_ticket_responses', 'support_chat_messages', 'support_chat_sessions')
AND schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 4. TEST DE CONNEXION REALTIME
-- =====================================================

-- Insérer un test dans support_tickets pour vérifier que la réplication fonctionne
SELECT '7. Test de réplication - Insertion test:' as info;
INSERT INTO support_tickets (user_id, subject, message, status, priority)
VALUES (
    'test-realtime-' || gen_random_uuid()::text,
    'Test Realtime Configuration',
    'Ce ticket est un test pour vérifier la configuration Realtime',
    'open',
    'low'
) RETURNING id, subject;

-- Nettoyer le test
DELETE FROM support_tickets 
WHERE subject = 'Test Realtime Configuration';

SELECT '8. Configuration Realtime terminée avec succès!' as info; 
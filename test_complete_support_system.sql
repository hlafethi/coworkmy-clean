-- Test complet du système de support
-- Vérifier la structure des tables
SELECT 'support_chat_sessions' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'support_chat_sessions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'support_chat_messages' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'support_chat_messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les sessions existantes pour l'utilisateur test
SELECT 
    id,
    user_id,
    status,
    created_at,
    closed_at,
    rating
FROM support_chat_sessions 
WHERE user_id = 'e316cb41-b8cd-4365-a89e-8e985679a2f2'
ORDER BY created_at DESC;

-- Vérifier les messages existants pour l'utilisateur test
SELECT 
    id,
    user_id,
    session_id,
    message,
    is_admin,
    is_read,
    created_at
FROM support_chat_messages 
WHERE user_id = 'e316cb41-b8cd-4365-a89e-8e985679a2f2'
ORDER BY created_at ASC;

-- Vérifier les permissions sur les tables
SELECT 
    table_name,
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name IN ('support_chat_sessions', 'support_chat_messages')
AND table_schema = 'public'
AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;

-- Vérifier que les politiques RLS sont actives
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('support_chat_sessions', 'support_chat_messages')
ORDER BY tablename, policyname; 
-- Vérifier que la table support_chat_sessions est exposée à l'API REST
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'support_chat_sessions';

-- Vérifier les permissions sur la table
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'support_chat_sessions'
AND table_schema = 'public';

-- Vérifier que l'utilisateur anon a les bonnes permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'support_chat_sessions'
AND table_schema = 'public'
AND grantee IN ('anon', 'authenticated');

-- Vérifier si la table est accessible via l'API REST
-- (Cette information n'est pas directement accessible via SQL, 
-- il faut vérifier dans Supabase Studio > Table Editor > support_chat_sessions) 
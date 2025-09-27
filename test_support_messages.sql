-- Test des politiques RLS pour support_chat_messages
-- Vérifier que les politiques sont créées
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'support_chat_messages';

-- Vérifier les permissions sur la table
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'support_chat_messages'
AND table_schema = 'public'
AND grantee IN ('anon', 'authenticated');

-- Vérifier les messages existants pour l'utilisateur test
SELECT COUNT(*) as messages_count 
FROM support_chat_messages 
WHERE user_id = 'e316cb41-b8cd-4365-a89e-8e985679a2f2';

-- Vérifier les messages par session
SELECT 
    sm.session_id,
    COUNT(*) as message_count
FROM support_chat_messages sm
WHERE sm.user_id = 'e316cb41-b8cd-4365-a89e-8e985679a2f2'
GROUP BY sm.session_id; 
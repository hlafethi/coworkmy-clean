-- Test manuel des politiques RLS pour support_chat_sessions
-- Remplace 'TON_USER_ID_ICI' par ton vrai ID utilisateur

-- 1. Vérifier que l'utilisateur existe dans profiles
SELECT id, email, is_admin 
FROM profiles 
WHERE id = 'e316cb41-b8cd-4365-a89e-8e985679a2f2';

-- 2. Vérifier les sessions existantes pour cet utilisateur
SELECT * FROM support_chat_sessions 
WHERE user_id = 'e316cb41-b8cd-4365-a89e-8e985679a2f2'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Compter les sessions pour cet utilisateur
SELECT COUNT(*) as sessions_count 
FROM support_chat_sessions 
WHERE user_id = 'e316cb41-b8cd-4365-a89e-8e985679a2f2';

-- 4. Vérifier les politiques RLS actives
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'support_chat_sessions'; 
-- Test des politiques RLS pour support_chat_sessions
-- Vérifier que l'utilisateur authentifié peut insérer une session

-- 1. Vérifier l'utilisateur courant
SELECT auth.uid() as current_user_id;

-- 2. Vérifier que l'utilisateur existe dans profiles
SELECT id, email, is_admin 
FROM profiles 
WHERE id = auth.uid();

-- 3. Tester l'insertion d'une session (cela devrait fonctionner maintenant)
INSERT INTO support_chat_sessions (user_id, status, created_at)
VALUES (auth.uid(), 'active', NOW())
RETURNING id, user_id, status, created_at;

-- 4. Vérifier que la session a été créée
SELECT * FROM support_chat_sessions 
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- 5. Tester la lecture (cela devrait fonctionner)
SELECT COUNT(*) as sessions_count 
FROM support_chat_sessions 
WHERE user_id = auth.uid(); 
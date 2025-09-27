-- Test des messages de support
-- Vérifier que les messages sont bien insérés et récupérables

-- 1. Insérer un message de test côté utilisateur
INSERT INTO support_chat_messages (user_id, message, is_admin, is_read, created_at)
VALUES (
    'e316cb41-b8cd-4365-a89e-8e985679a2f2', -- ID utilisateur de test
    'Message de test côté utilisateur',
    false,
    false,
    NOW()
);

-- 2. Insérer une réponse côté admin
INSERT INTO support_chat_messages (user_id, message, is_admin, is_read, created_at)
VALUES (
    'e316cb41-b8cd-4365-a89e-8e985679a2f2', -- Même user_id pour la conversation
    'Réponse de test côté admin',
    true,
    false,
    NOW()
);

-- 3. Vérifier que les messages sont bien présents
SELECT 
    id,
    user_id,
    message,
    is_admin,
    is_read,
    created_at
FROM support_chat_messages 
WHERE user_id = 'e316cb41-b8cd-4365-a89e-8e985679a2f2'
ORDER BY created_at ASC;

-- 4. Vérifier la fonction get_support_chat_users
SELECT * FROM get_support_chat_users();

-- 5. Vérifier les politiques RLS
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
WHERE tablename = 'support_chat_messages'; 
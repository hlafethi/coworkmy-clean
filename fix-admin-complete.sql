-- Script complet pour résoudre le problème admin et la confirmation d'email
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier l'état actuel de l'utilisateur
SELECT 
    'État actuel utilisateur' as étape,
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN '✅ Email confirmé'
        ELSE '⚠️ Email non confirmé'
    END as status_email
FROM auth.users 
WHERE email = 'sciandrea42@gmail.com';

-- 2. Vérifier l'état actuel du profil
SELECT 
    'État actuel profil' as étape,
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.is_admin,
    p.created_at,
    p.updated_at,
    au.id as auth_user_id,
    CASE 
        WHEN p.user_id = au.id THEN '✅ user_id correspond'
        ELSE '❌ user_id ne correspond pas'
    END as user_id_match
FROM profiles p
LEFT JOIN auth.users au ON p.email = au.email
WHERE p.email = 'sciandrea42@gmail.com';

-- 3. Confirer l'email de l'utilisateur (si pas déjà confirmé)
UPDATE auth.users 
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
WHERE email = 'sciandrea42@gmail.com'
AND email_confirmed_at IS NULL;

-- 4. Corriger le user_id dans le profil
UPDATE profiles 
SET 
    user_id = (
        SELECT id 
        FROM auth.users 
        WHERE email = 'sciandrea42@gmail.com'
    ),
    is_admin = true,
    updated_at = NOW()
WHERE email = 'sciandrea42@gmail.com';

-- 5. S'assurer qu'un profil admin existe
INSERT INTO profiles (
    id,
    user_id,
    first_name,
    last_name,
    email,
    is_admin,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    au.id,
    'Admin',
    'User',
    au.email,
    true,
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'sciandrea42@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.email = au.email
)
ON CONFLICT (email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    is_admin = true,
    updated_at = NOW();

-- 6. Vérifier le résultat après correction
SELECT 
    'Résultat après correction' as étape,
    au.id as auth_user_id,
    au.email as auth_user_email,
    au.email_confirmed_at,
    p.id as profile_id,
    p.user_id as profile_user_id,
    p.email as profile_email,
    p.is_admin,
    CASE 
        WHEN au.id = p.user_id THEN '✅ user_id correspond'
        ELSE '❌ user_id ne correspond pas'
    END as user_id_match,
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN '✅ Email confirmé'
        ELSE '⚠️ Email non confirmé'
    END as status_email
FROM auth.users au
LEFT JOIN profiles p ON au.email = p.email
WHERE au.email = 'sciandrea42@gmail.com';

-- 7. Vérifier que toutes les méthodes de recherche fonctionnent
SELECT 
    'Test toutes les méthodes' as étape,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = (SELECT id FROM auth.users WHERE email = 'sciandrea42@gmail.com')
            AND is_admin = true
        ) THEN '✅ Trouvé par user_id'
        ELSE '❌ Non trouvé par user_id'
    END as by_user_id,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (SELECT id FROM auth.users WHERE email = 'sciandrea42@gmail.com')
            AND is_admin = true
        ) THEN '✅ Trouvé par id'
        ELSE '❌ Non trouvé par id'
    END as by_id,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles 
            WHERE email = 'sciandrea42@gmail.com'
            AND is_admin = true
        ) THEN '✅ Trouvé par email'
        ELSE '❌ Non trouvé par email'
    END as by_email;

-- 8. Nettoyer toutes les sessions pour forcer une nouvelle authentification
DELETE FROM auth.sessions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'sciandrea42@gmail.com');

-- 9. Vérifier les politiques RLS pour s'assurer qu'elles permettent l'accès admin
SELECT 
    'Politiques RLS profiles' as étape,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;

-- 10. Test final de l'accès admin
SELECT 
    'Test final accès admin' as étape,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles p
            JOIN auth.users au ON p.user_id = au.id
            WHERE au.email = 'sciandrea42@gmail.com' 
            AND p.is_admin = true 
            AND au.email_confirmed_at IS NOT NULL
        ) THEN '✅ Accès admin configuré correctement'
        ELSE '❌ Problème avec l''accès admin'
    END as status_admin,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = 'sciandrea42@gmail.com' 
            AND email_confirmed_at IS NOT NULL
        ) THEN '✅ Email confirmé'
        ELSE '⚠️ Email non confirmé'
    END as status_email,
    'Sessions nettoyées - Reconnectez-vous' as action_required; 
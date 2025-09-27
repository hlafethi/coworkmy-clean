-- Script pour corriger l'incohérence entre auth.users.id et profiles.user_id
-- Basé sur le diagnostic qui montre que le profil admin est trouvé par email mais pas par user_id

-- 1. Vérifier l'état actuel
SELECT 
    'État actuel' as étape,
    au.id as auth_user_id,
    au.email as auth_user_email,
    p.id as profile_id,
    p.user_id as profile_user_id,
    p.email as profile_email,
    p.is_admin,
    CASE 
        WHEN au.id = p.user_id THEN '✅ user_id correspond'
        ELSE '❌ user_id ne correspond pas'
    END as user_id_match
FROM auth.users au
LEFT JOIN profiles p ON au.email = p.email
WHERE au.email = 'sciandrea42@gmail.com';

-- 2. Corriger le user_id dans le profil
UPDATE profiles 
SET 
    user_id = (
        SELECT id 
        FROM auth.users 
        WHERE email = 'sciandrea42@gmail.com'
    ),
    updated_at = NOW()
WHERE email = 'sciandrea42@gmail.com'
AND user_id != (
    SELECT id 
    FROM auth.users 
    WHERE email = 'sciandrea42@gmail.com'
);

-- 3. Vérifier le résultat après correction
SELECT 
    'Résultat après correction' as étape,
    au.id as auth_user_id,
    au.email as auth_user_email,
    p.id as profile_id,
    p.user_id as profile_user_id,
    p.email as profile_email,
    p.is_admin,
    CASE 
        WHEN au.id = p.user_id THEN '✅ user_id correspond'
        ELSE '❌ user_id ne correspond pas'
    END as user_id_match
FROM auth.users au
LEFT JOIN profiles p ON au.email = p.email
WHERE au.email = 'sciandrea42@gmail.com';

-- 4. Vérifier que le profil admin est maintenant accessible par user_id
SELECT 
    'Test accès par user_id' as étape,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles p
            JOIN auth.users au ON p.user_id = au.id
            WHERE au.email = 'sciandrea42@gmail.com' AND p.is_admin = true
        ) THEN '✅ Profil admin accessible par user_id'
        ELSE '❌ Profil admin non accessible par user_id'
    END as status_access;

-- 5. Vérifier que toutes les méthodes de recherche fonctionnent
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

-- 6. Nettoyer les sessions pour forcer une nouvelle authentification
DELETE FROM auth.sessions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'sciandrea42@gmail.com');

-- 7. Résumé final
SELECT 
    'Résumé final' as étape,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles p
            JOIN auth.users au ON p.user_id = au.id
            WHERE au.email = 'sciandrea42@gmail.com' AND p.is_admin = true
        ) THEN '✅ Problème résolu - Admin accessible'
        ELSE '❌ Problème persistant'
    END as status_final,
    'Sessions nettoyées - Reconnectez-vous' as action_required; 
-- Script de correction rapide pour le problème de synchronisation admin
-- Basé sur les logs qui montrent que useAuth détecte admin mais AdminRoute non

-- 1. Forcer la mise à jour du profil admin
UPDATE profiles 
SET 
    is_admin = true,
    updated_at = NOW()
WHERE email = 'sciandrea42@gmail.com';

-- 2. S'assurer que le user_id correspond
UPDATE profiles 
SET 
    user_id = (SELECT id FROM auth.users WHERE email = 'sciandrea42@gmail.com'),
    updated_at = NOW()
WHERE email = 'sciandrea42@gmail.com'
AND user_id != (SELECT id FROM auth.users WHERE email = 'sciandrea42@gmail.com');

-- 3. Confirmer l'email si pas déjà fait
UPDATE auth.users 
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
WHERE email = 'sciandrea42@gmail.com'
AND email_confirmed_at IS NULL;

-- 4. Nettoyer toutes les sessions pour forcer une nouvelle authentification
DELETE FROM auth.sessions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'sciandrea42@gmail.com');

-- 5. Vérifier le résultat
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
        WHEN p.is_admin = true THEN '✅ Admin'
        ELSE '❌ Non admin'
    END as admin_status
FROM auth.users au
LEFT JOIN profiles p ON au.email = p.email
WHERE au.email = 'sciandrea42@gmail.com';

-- 6. Test final
SELECT 
    'Test final' as étape,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles p
            JOIN auth.users au ON p.user_id = au.id
            WHERE au.email = 'sciandrea42@gmail.com' 
            AND p.is_admin = true 
            AND au.email_confirmed_at IS NOT NULL
        ) THEN '✅ Problème résolu'
        ELSE '❌ Problème persistant'
    END as status,
    'Reconnectez-vous maintenant' as action; 
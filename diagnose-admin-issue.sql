-- Script de diagnostic pour identifier le problème avec l'accès admin
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure de la table profiles
SELECT 
    'Structure profiles' as étape,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Vérifier l'utilisateur dans auth.users
SELECT 
    'Utilisateur auth.users' as étape,
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

-- 3. Vérifier tous les profils existants
SELECT 
    'Tous les profils' as étape,
    id,
    user_id,
    first_name,
    last_name,
    email,
    is_admin,
    created_at,
    updated_at,
    CASE 
        WHEN is_admin = true THEN '✅ Admin'
        ELSE '❌ Non admin'
    END as status_admin
FROM profiles 
ORDER BY created_at DESC;

-- 4. Vérifier le profil spécifique de l'utilisateur
SELECT 
    'Profil utilisateur' as étape,
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.is_admin,
    p.created_at,
    p.updated_at,
    au.id as auth_user_id,
    au.email as auth_user_email,
    CASE 
        WHEN p.user_id = au.id THEN '✅ user_id correspond'
        ELSE '❌ user_id ne correspond pas'
    END as user_id_match,
    CASE 
        WHEN p.email = au.email THEN '✅ email correspond'
        ELSE '❌ email ne correspond pas'
    END as email_match
FROM profiles p
LEFT JOIN auth.users au ON p.user_id = au.id OR p.email = au.email
WHERE p.email = 'sciandrea42@gmail.com' 
   OR au.email = 'sciandrea42@gmail.com'
   OR p.user_id = (SELECT id FROM auth.users WHERE email = 'sciandrea42@gmail.com');

-- 5. Vérifier les politiques RLS sur profiles
SELECT 
    'Politiques RLS profiles' as étape,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;

-- 6. Test de requête avec les politiques RLS
-- Simuler une requête en tant qu'utilisateur connecté
SELECT 
    'Test RLS - Profils visibles' as étape,
    COUNT(*) as total_profiles_visible,
    COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_profiles_visible
FROM profiles;

-- 7. Vérifier les sessions actives
SELECT 
    'Sessions actives' as étape,
    COUNT(*) as active_sessions,
    MAX(created_at) as last_session_created
FROM auth.sessions 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 8. Vérifier les permissions de l'utilisateur
SELECT 
    'Permissions utilisateur' as étape,
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND grantee IN ('authenticated', 'anon');

-- 9. Résumé du diagnostic
SELECT 
    'Résumé diagnostic' as étape,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = 'sciandrea42@gmail.com' AND email_confirmed_at IS NOT NULL
        ) THEN '✅ Utilisateur existe et email confirmé'
        ELSE '❌ Utilisateur inexistant ou email non confirmé'
    END as status_user,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles 
            WHERE email = 'sciandrea42@gmail.com' AND is_admin = true
        ) THEN '✅ Profil admin trouvé par email'
        ELSE '❌ Profil admin non trouvé par email'
    END as status_profile_email,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles p
            JOIN auth.users au ON p.user_id = au.id
            WHERE au.email = 'sciandrea42@gmail.com' AND p.is_admin = true
        ) THEN '✅ Profil admin trouvé par user_id'
        ELSE '❌ Profil admin non trouvé par user_id'
    END as status_profile_user_id,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'profiles' AND policyname LIKE '%admin%'
        ) THEN '✅ Politiques admin existent'
        ELSE '❌ Politiques admin manquantes'
    END as status_policies; 
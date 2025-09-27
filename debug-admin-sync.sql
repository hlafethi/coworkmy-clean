-- Script de diagnostic pour identifier le problème de synchronisation admin
-- Basé sur les logs qui montrent une incohérence entre useAuth et AdminRoute

-- 1. Vérifier l'état exact de l'utilisateur et du profil
SELECT 
    'État exact utilisateur et profil' as étape,
    au.id as auth_user_id,
    au.email as auth_user_email,
    au.email_confirmed_at,
    au.last_sign_in_at,
    p.id as profile_id,
    p.user_id as profile_user_id,
    p.email as profile_email,
    p.is_admin,
    p.created_at as profile_created,
    p.updated_at as profile_updated,
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

-- 2. Vérifier les sessions actives
SELECT 
    'Sessions actives' as étape,
    COUNT(*) as total_sessions,
    MAX(created_at) as last_session_created,
    MIN(created_at) as first_session_created
FROM auth.sessions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'sciandrea42@gmail.com');

-- 3. Vérifier les politiques RLS qui pourraient bloquer l'accès
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

-- 4. Test de requête directe pour simuler ce que fait useAuth
SELECT 
    'Test requête directe' as étape,
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

-- 5. Vérifier les permissions de l'utilisateur authentifié
SELECT 
    'Permissions utilisateur' as étape,
    grantee,
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND grantee IN ('authenticated', 'anon', 'service_role');

-- 6. Vérifier les contraintes et index sur la table profiles
SELECT 
    'Structure table profiles' as étape,
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'profiles'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 7. Test de performance pour identifier les goulots d'étranglement
EXPLAIN (ANALYZE, BUFFERS) 
SELECT is_admin 
FROM profiles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'sciandrea42@gmail.com');

-- 8. Vérifier les logs d'audit si disponibles
SELECT 
    'Logs récents' as étape,
    'Vérifier les logs Supabase pour les erreurs récentes' as note;

-- 9. Résumé du diagnostic
SELECT 
    'Résumé diagnostic' as étape,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = 'sciandrea42@gmail.com' 
            AND email_confirmed_at IS NOT NULL
        ) THEN '✅ Utilisateur confirmé'
        ELSE '❌ Utilisateur non confirmé'
    END as user_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles 
            WHERE email = 'sciandrea42@gmail.com' 
            AND is_admin = true
        ) THEN '✅ Profil admin existe'
        ELSE '❌ Profil admin inexistant'
    END as profile_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles p
            JOIN auth.users au ON p.user_id = au.id
            WHERE au.email = 'sciandrea42@gmail.com' 
            AND p.is_admin = true
        ) THEN '✅ Relation user_id correcte'
        ELSE '❌ Relation user_id incorrecte'
    END as relation_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'profiles' 
            AND policyname LIKE '%admin%'
        ) THEN '✅ Politiques admin existent'
        ELSE '❌ Politiques admin manquantes'
    END as policies_status; 
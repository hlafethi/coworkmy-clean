-- Script pour corriger uniquement le statut admin
-- Ne touche pas aux politiques RLS existantes

-- 1. Vérifier l'utilisateur admin dans auth.users
SELECT 
    'Vérification auth.users' as étape,
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'admin@coworkmy.com';

-- 2. Vérifier le profil actuel
SELECT 
    'Vérification profil actuel' as étape,
    id,
    user_id,
    first_name,
    last_name,
    email,
    is_admin,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'admin@coworkmy.com';

-- 3. Créer ou mettre à jour le profil avec is_admin = true
-- Si le profil n'existe pas, le créer
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
WHERE au.email = 'admin@coworkmy.com'
AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.email = au.email
)
ON CONFLICT (email) DO UPDATE SET
    is_admin = true,
    updated_at = NOW();

-- 4. Vérifier le résultat après correction
SELECT 
    'Résultat après correction' as étape,
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.is_admin,
    p.created_at,
    p.updated_at
FROM profiles p
WHERE p.email = 'admin@coworkmy.com';

-- 5. Vérifier que l'utilisateur peut accéder aux données admin
-- Test de requête avec les politiques RLS existantes
SELECT 
    'Test d''accès admin' as étape,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_count,
    COUNT(CASE WHEN email = 'admin@coworkmy.com' THEN 1 END) as admin_user_exists
FROM profiles;

-- 6. Vérifier les sessions actives (structure correcte de Supabase)
SELECT 
    'Sessions actives' as étape,
    COUNT(*) as active_sessions
FROM auth.sessions 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 7. Vérifier la structure de la table sessions
SELECT 
    'Structure sessions' as étape,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'sessions'
ORDER BY ordinal_position;

-- 8. Résumé final
SELECT 
    'Résumé final' as étape,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles 
            WHERE email = 'admin@coworkmy.com' AND is_admin = true
        ) THEN '✅ Utilisateur admin configuré correctement'
        ELSE '❌ Problème avec la configuration admin'
    END as status_admin,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = 'admin@coworkmy.com' AND email_confirmed_at IS NOT NULL
        ) THEN '✅ Email confirmé'
        ELSE '⚠️ Email non confirmé'
    END as status_email; 
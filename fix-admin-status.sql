-- Script pour corriger le statut admin d'un utilisateur
-- Remplacez 'admin@coworkmy.com' par l'email de l'utilisateur admin

-- 1. Vérifier l'utilisateur dans auth.users
SELECT 
    id,
    email,
    created_at,
    updated_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'admin@coworkmy.com';

-- 2. Vérifier le profil actuel
SELECT 
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

-- 4. Vérifier le résultat
SELECT 
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
-- Test de requête avec les politiques RLS
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_count
FROM profiles;

-- 6. Nettoyer les sessions expirées (optionnel)
DELETE FROM auth.sessions 
WHERE expires_at < NOW(); 
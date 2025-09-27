-- Script pour vérifier et corriger le statut admin
-- Remplacez 'votre-email@example.com' par l'email de l'utilisateur admin

-- 1. Vérifier si l'utilisateur existe dans auth.users
SELECT 
    id,
    email,
    created_at,
    updated_at
FROM auth.users 
WHERE email = 'votre-email@example.com';

-- 2. Vérifier si le profil existe dans profiles
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
WHERE email = 'votre-email@example.com';

-- 3. Si le profil n'existe pas, le créer avec is_admin = true
-- (Décommentez et modifiez l'email si nécessaire)
/*
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
WHERE au.email = 'votre-email@example.com'
AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.email = au.email
);
*/

-- 4. Si le profil existe mais is_admin = false, le mettre à jour
-- (Décommentez et modifiez l'email si nécessaire)
/*
UPDATE profiles 
SET 
    is_admin = true,
    updated_at = NOW()
WHERE email = 'votre-email@example.com'
AND is_admin = false;
*/

-- 5. Vérifier le résultat final
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
WHERE p.email = 'votre-email@example.com'; 
-- Script de correction pour la récursion infinie dans les policies RLS de profiles
-- Exécuter ce script dans l'interface SQL de Supabase

-- 1. Supprimer toutes les policies existantes sur profiles
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON profiles;

-- 2. Vérifier la structure de la table profiles
DO $$
BEGIN
    -- Vérifier si la colonne user_id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'user_id'
    ) THEN
        -- Ajouter la colonne user_id si elle n'existe pas
        ALTER TABLE profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Colonne user_id ajoutée à la table profiles';
    END IF;
    
    -- Vérifier si la colonne is_admin existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_admin'
    ) THEN
        -- Ajouter la colonne is_admin si elle n'existe pas
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Colonne is_admin ajoutée à la table profiles';
    END IF;
END $$;

-- 3. Créer des policies RLS simples et non récursives
-- Policy de lecture : tout le monde peut lire les profiles
CREATE POLICY "profiles_read_policy" ON profiles
    FOR SELECT USING (true);

-- Policy d'insertion : l'utilisateur peut créer son propre profile
CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id OR auth.uid() = user_id
    );

-- Policy de mise à jour : l'utilisateur peut modifier son propre profile
CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (
        auth.uid() = id OR auth.uid() = user_id
    );

-- Policy de suppression : l'utilisateur peut supprimer son propre profile
CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE USING (
        auth.uid() = id OR auth.uid() = user_id
    );

-- 4. S'assurer que RLS est activé
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Corriger les profiles existants
-- Mettre à jour les profiles qui n'ont pas de user_id
UPDATE profiles 
SET user_id = id 
WHERE user_id IS NULL AND id IS NOT NULL;

-- 6. Créer un profile pour l'utilisateur admin s'il n'existe pas
INSERT INTO profiles (id, user_id, email, full_name, is_admin)
SELECT 
    au.id,
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Admin'),
    true
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL AND au.email = 'sciandrea42@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    is_admin = EXCLUDED.is_admin;

-- 7. Vérifier que tout fonctionne
DO $$
DECLARE
    profiles_count INTEGER;
    admin_count INTEGER;
BEGIN
    -- Vérifier le nombre total de profiles
    SELECT COUNT(*) INTO profiles_count FROM profiles;
    RAISE NOTICE 'Nombre total de profiles: %', profiles_count;
    
    -- Vérifier le nombre d'admins
    SELECT COUNT(*) INTO admin_count FROM profiles WHERE is_admin = true;
    RAISE NOTICE 'Nombre d''admins: %', admin_count;
    
    -- Vérifier l'admin spécifique
    IF EXISTS (SELECT 1 FROM profiles WHERE email = 'sciandrea42@gmail.com' AND is_admin = true) THEN
        RAISE NOTICE 'Admin sciandrea42@gmail.com trouvé et configuré';
    ELSE
        RAISE NOTICE 'Admin sciandrea42@gmail.com non trouvé ou non configuré';
    END IF;
    
    RAISE NOTICE 'Correction des policies profiles terminée !';
END $$; 
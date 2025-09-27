-- Script SQL sécurisé pour configurer les politiques RLS
-- Vérifie l'existence des politiques avant de les créer

-- 1. Activer RLS sur toutes les tables (sans erreur si déjà activé)
DO $$
BEGIN
    -- Activer RLS sur profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'profiles' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS activé sur la table profiles';
    ELSE
        RAISE NOTICE 'RLS déjà activé sur la table profiles';
    END IF;

    -- Activer RLS sur spaces
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'spaces' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS activé sur la table spaces';
    ELSE
        RAISE NOTICE 'RLS déjà activé sur la table spaces';
    END IF;

    -- Activer RLS sur bookings
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'bookings' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS activé sur la table bookings';
    ELSE
        RAISE NOTICE 'RLS déjà activé sur la table bookings';
    END IF;

    -- Activer RLS sur time_slots
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'time_slots' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS activé sur la table time_slots';
    ELSE
        RAISE NOTICE 'RLS déjà activé sur la table time_slots';
    END IF;
END $$;

-- 2. Créer les politiques pour profiles (seulement si elles n'existent pas)
DO $$
BEGIN
    -- Politique "Users can view own profile"
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" ON profiles
            FOR SELECT USING (auth.uid() = id);
        RAISE NOTICE 'Politique "Users can view own profile" créée';
    ELSE
        RAISE NOTICE 'Politique "Users can view own profile" existe déjà';
    END IF;

    -- Politique "Users can update own profile"
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON profiles
            FOR UPDATE USING (auth.uid() = id);
        RAISE NOTICE 'Politique "Users can update own profile" créée';
    ELSE
        RAISE NOTICE 'Politique "Users can update own profile" existe déjà';
    END IF;

    -- Politique "Admins can view all profiles"
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Admins can view all profiles'
    ) THEN
        CREATE POLICY "Admins can view all profiles" ON profiles
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND is_admin = true
                )
            );
        RAISE NOTICE 'Politique "Admins can view all profiles" créée';
    ELSE
        RAISE NOTICE 'Politique "Admins can view all profiles" existe déjà';
    END IF;

    -- Politique "Users can insert own profile"
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" ON profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
        RAISE NOTICE 'Politique "Users can insert own profile" créée';
    ELSE
        RAISE NOTICE 'Politique "Users can insert own profile" existe déjà';
    END IF;
END $$;

-- 3. Créer les politiques pour spaces (seulement si elles n'existent pas)
DO $$
BEGIN
    -- Politique "Anyone can view active spaces"
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'spaces' 
        AND policyname = 'Anyone can view active spaces'
    ) THEN
        CREATE POLICY "Anyone can view active spaces" ON spaces
            FOR SELECT USING (is_active = true);
        RAISE NOTICE 'Politique "Anyone can view active spaces" créée';
    ELSE
        RAISE NOTICE 'Politique "Anyone can view active spaces" existe déjà';
    END IF;

    -- Politique "Admins can manage spaces"
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'spaces' 
        AND policyname = 'Admins can manage spaces'
    ) THEN
        CREATE POLICY "Admins can manage spaces" ON spaces
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND is_admin = true
                )
            );
        RAISE NOTICE 'Politique "Admins can manage spaces" créée';
    ELSE
        RAISE NOTICE 'Politique "Admins can manage spaces" existe déjà';
    END IF;
END $$;

-- 4. Créer les politiques pour bookings (seulement si elles n'existent pas)
DO $$
BEGIN
    -- Politique "Users can view own bookings"
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'bookings' 
        AND policyname = 'Users can view own bookings'
    ) THEN
        CREATE POLICY "Users can view own bookings" ON bookings
            FOR SELECT USING (user_id = auth.uid());
        RAISE NOTICE 'Politique "Users can view own bookings" créée';
    ELSE
        RAISE NOTICE 'Politique "Users can view own bookings" existe déjà';
    END IF;

    -- Politique "Users can create own bookings"
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'bookings' 
        AND policyname = 'Users can create own bookings'
    ) THEN
        CREATE POLICY "Users can create own bookings" ON bookings
            FOR INSERT WITH CHECK (user_id = auth.uid());
        RAISE NOTICE 'Politique "Users can create own bookings" créée';
    ELSE
        RAISE NOTICE 'Politique "Users can create own bookings" existe déjà';
    END IF;

    -- Politique "Admins can view all bookings"
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'bookings' 
        AND policyname = 'Admins can view all bookings'
    ) THEN
        CREATE POLICY "Admins can view all bookings" ON bookings
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND is_admin = true
                )
            );
        RAISE NOTICE 'Politique "Admins can view all bookings" créée';
    ELSE
        RAISE NOTICE 'Politique "Admins can view all bookings" existe déjà';
    END IF;

    -- Politique "Admins can manage all bookings"
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'bookings' 
        AND policyname = 'Admins can manage all bookings'
    ) THEN
        CREATE POLICY "Admins can manage all bookings" ON bookings
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND is_admin = true
                )
            );
        RAISE NOTICE 'Politique "Admins can manage all bookings" créée';
    ELSE
        RAISE NOTICE 'Politique "Admins can manage all bookings" existe déjà';
    END IF;
END $$;

-- 5. Créer les politiques pour time_slots (seulement si elles n'existent pas)
DO $$
BEGIN
    -- Politique "Anyone can view time slots"
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'time_slots' 
        AND policyname = 'Anyone can view time slots'
    ) THEN
        CREATE POLICY "Anyone can view time slots" ON time_slots
            FOR SELECT USING (true);
        RAISE NOTICE 'Politique "Anyone can view time slots" créée';
    ELSE
        RAISE NOTICE 'Politique "Anyone can view time slots" existe déjà';
    END IF;

    -- Politique "Admins can manage time slots"
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'time_slots' 
        AND policyname = 'Admins can manage time slots'
    ) THEN
        CREATE POLICY "Admins can manage time slots" ON time_slots
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() AND is_admin = true
                )
            );
        RAISE NOTICE 'Politique "Admins can manage time slots" créée';
    ELSE
        RAISE NOTICE 'Politique "Admins can manage time slots" existe déjà';
    END IF;
END $$;

-- 6. Vérifier l'état des politiques
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
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'spaces', 'bookings', 'time_slots')
ORDER BY tablename, policyname;

-- 7. Vérifier que RLS est activé sur toutes les tables
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'spaces', 'bookings', 'time_slots')
ORDER BY tablename; 
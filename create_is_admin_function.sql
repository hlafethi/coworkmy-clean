-- Création de la fonction is_admin si elle n'existe pas

-- Vérifier si la fonction existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        -- Créer la fonction is_admin
        CREATE OR REPLACE FUNCTION public.is_admin()
        RETURNS BOOLEAN
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        BEGIN
            RETURN EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND is_admin = true
            );
        END;
        $$;
        RAISE NOTICE 'Fonction is_admin() créée';
    ELSE
        RAISE NOTICE 'Fonction is_admin() existe déjà';
    END IF;
END $$;

-- Vérifier que la fonction fonctionne
SELECT 'Test de la fonction is_admin:' as info;
SELECT public.is_admin() as is_current_user_admin;

-- Vérifier les profils admin
SELECT 'Profils admin:' as info;
SELECT id, full_name, is_admin FROM profiles WHERE is_admin = true; 
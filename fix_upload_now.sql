-- Solution immédiate pour faire fonctionner l'upload
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer TOUTES les politiques storage existantes
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
        RAISE NOTICE 'Politique % supprimée', pol.policyname;
    END LOOP;
END $$;

-- 2. Créer des politiques ultra-permissives pour les tests
-- AVATARS - Très permissif
CREATE POLICY "avatars_all_access" ON storage.objects
FOR ALL USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
)
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
);

-- DOCUMENTS - Très permissif
CREATE POLICY "documents_all_access" ON storage.objects
FOR ALL USING (
    bucket_id = 'documents' 
    AND auth.role() = 'authenticated'
)
WITH CHECK (
    bucket_id = 'documents' 
    AND auth.role() = 'authenticated'
);

-- 3. Vérifier que RLS est activé
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Vérification
SELECT 
    'NOUVELLES POLITIQUES:' as info,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;

-- 5. Test final
SELECT 
    'CONFIGURATION FINALE:' as section,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

SELECT 'UPLOAD DEVRAIT MAINTENANT FONCTIONNER!' as status; 
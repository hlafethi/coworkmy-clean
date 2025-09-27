-- Script pour corriger les politiques RLS avec la bonne structure
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;

-- 2. Créer les nouvelles politiques pour AVATARS
-- Structure: bucket/filename.ext (pas de sous-dossier)

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND name ~ ('^' || auth.uid()::text || '_')
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND name ~ ('^' || auth.uid()::text || '_')
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND name ~ ('^' || auth.uid()::text || '_')
);

-- La politique de lecture reste la même (public)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 3. Créer les nouvelles politiques pour DOCUMENTS
-- Structure: bucket/user_id/filename.ext

CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Vérifier les nouvelles politiques
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (policyname LIKE '%avatar%' OR policyname LIKE '%document%')
ORDER BY policyname;

-- 5. Test des structures de chemins
SELECT 
    'Test structure avatars:' as test,
    'user123_1234567890.jpg' as example_path,
    'user123_1234567890.jpg' ~ ('^user123_') as should_match;

SELECT 
    'Test structure documents:' as test,
    'user123/user123_1234567890_abc_document.pdf' as example_path,
    (storage.foldername('user123/user123_1234567890_abc_document.pdf'))[1] as extracted_user_id; 
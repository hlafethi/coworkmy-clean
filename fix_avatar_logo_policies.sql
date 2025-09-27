-- Script pour corriger les politiques RLS pour avatars et logos
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Logos are publicly viewable" ON storage.objects;

-- 2. Créer les nouvelles politiques pour AVATARS
-- Structure: bucket/userId_timestamp.ext
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

-- Lecture des avatars (public)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 3. Créer les nouvelles politiques pour LOGOS
-- Structure: bucket/userId_timestamp.ext
CREATE POLICY "Users can upload their own logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
  AND name ~ ('^' || auth.uid()::text || '_')
);

CREATE POLICY "Users can delete their own logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
  AND name ~ ('^' || auth.uid()::text || '_')
);

CREATE POLICY "Users can update their own logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
  AND name ~ ('^' || auth.uid()::text || '_')
);

-- Lecture des logos (public)
CREATE POLICY "Logos are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

-- 4. Vérification
SELECT 
    'POLITIQUES CRÉÉES:' as section,
    policyname,
    CASE 
        WHEN cmd LIKE '%avatars%' THEN 'AVATARS'
        WHEN cmd LIKE '%logos%' THEN 'LOGOS'
        ELSE 'AUTRE'
    END as bucket_type,
    CASE 
        WHEN cmd LIKE '%INSERT%' THEN 'UPLOAD'
        WHEN cmd LIKE '%SELECT%' THEN 'READ'
        WHEN cmd LIKE '%DELETE%' THEN 'DELETE'
        WHEN cmd LIKE '%UPDATE%' THEN 'UPDATE'
        ELSE 'AUTRE'
    END as operation
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (policyname LIKE '%avatar%' OR policyname LIKE '%logo%')
ORDER BY bucket_type, operation;

-- 5. Test des structures de noms de fichiers
SELECT 
    'TEST AVATARS:' as test,
    '173b9f52-9b83-48ea-aeac-67be38917acd_1749880148541.png' as example,
    '173b9f52-9b83-48ea-aeac-67be38917acd_1749880148541.png' ~ ('^173b9f52-9b83-48ea-aeac-67be38917acd_') as should_match;

SELECT 
    'TEST LOGOS:' as test,
    '173b9f52-9b83-48ea-aeac-67be38917acd_1749880148541.png' as example,
    '173b9f52-9b83-48ea-aeac-67be38917acd_1749880148541.png' ~ ('^173b9f52-9b83-48ea-aeac-67be38917acd_') as should_match;

-- 6. Vérifier les buckets
SELECT 
    'BUCKETS:' as section,
    id,
    name,
    public,
    file_size_limit / 1024 / 1024 as size_limit_mb
FROM storage.buckets 
WHERE id IN ('avatars', 'logos')
ORDER BY id;

SELECT 'CONFIGURATION AVATARS ET LOGOS TERMINÉE!' as message; 
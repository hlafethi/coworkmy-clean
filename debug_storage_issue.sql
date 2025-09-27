-- Script de diagnostic pour identifier le problème d'upload
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier les buckets existants
SELECT 
    'BUCKETS:' as section,
    id,
    name,
    public,
    file_size_limit / 1024 / 1024 as size_limit_mb,
    allowed_mime_types
FROM storage.buckets 
WHERE id IN ('avatars', 'documents')
ORDER BY id;

-- 2. Vérifier toutes les politiques storage
SELECT 
    'POLITIQUES ACTUELLES:' as section,
    policyname,
    CASE 
        WHEN cmd LIKE '%avatars%' THEN 'AVATARS'
        WHEN cmd LIKE '%documents%' THEN 'DOCUMENTS'
        ELSE 'AUTRE'
    END as bucket_type,
    CASE 
        WHEN cmd LIKE '%INSERT%' THEN 'UPLOAD'
        WHEN cmd LIKE '%SELECT%' THEN 'READ'
        WHEN cmd LIKE '%DELETE%' THEN 'DELETE'
        WHEN cmd LIKE '%UPDATE%' THEN 'UPDATE'
        ELSE 'AUTRE'
    END as operation,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;

-- 3. Test de la politique avatars avec votre user ID
-- Remplacez 'YOUR_USER_ID' par votre vrai user ID
SELECT 
    'TEST AVATARS:' as section,
    '173b9f52-9b83-48ea-aeac-67be38917acd_1749880326821.png' as filename,
    '173b9f52-9b83-48ea-aeac-67be38917acd_1749880326821.png' ~ ('^173b9f52-9b83-48ea-aeac-67be38917acd_') as regex_match,
    'avatars' as bucket_id;

-- 4. Test de la politique documents
SELECT 
    'TEST DOCUMENTS:' as section,
    '173b9f52-9b83-48ea-aeac-67be38917acd/file.pdf' as filepath,
    (storage.foldername('173b9f52-9b83-48ea-aeac-67be38917acd/file.pdf'))[1] as extracted_user_id,
    'documents' as bucket_id;

-- 5. Vérifier si RLS est activé
SELECT 
    'RLS STATUS:' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 6. Compter les politiques par bucket
SELECT 
    'RÉSUMÉ POLITIQUES:' as section,
    COUNT(*) as total_policies,
    COUNT(*) FILTER (WHERE policyname LIKE '%avatar%') as avatar_policies,
    COUNT(*) FILTER (WHERE policyname LIKE '%document%') as document_policies
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- 7. Vérifier les types MIME autorisés pour PNG
SELECT 
    'MIME TYPES:' as section,
    id as bucket,
    'image/png' = ANY(allowed_mime_types) as png_allowed,
    'image/jpeg' = ANY(allowed_mime_types) as jpeg_allowed,
    allowed_mime_types
FROM storage.buckets 
WHERE id IN ('avatars', 'documents');

-- 8. Solution temporaire : Désactiver RLS pour test
-- ATTENTION: Ceci désactive temporairement la sécurité !
-- Décommentez seulement pour tester, puis réactivez immédiatement

/*
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
SELECT 'RLS DÉSACTIVÉ TEMPORAIREMENT - TESTEZ L''UPLOAD MAINTENANT' as warning;
*/

-- 9. Pour réactiver RLS après test (IMPORTANT!)
/*
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
SELECT 'RLS RÉACTIVÉ - SÉCURITÉ RESTAURÉE' as info;
*/ 
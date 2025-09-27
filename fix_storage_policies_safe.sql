-- Script sécurisé pour corriger les politiques RLS
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Fonction pour supprimer une politique si elle existe
CREATE OR REPLACE FUNCTION drop_policy_if_exists(policy_name text, table_name text)
RETURNS void AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = table_name 
        AND policyname = policy_name
    ) THEN
        EXECUTE format('DROP POLICY %I ON storage.%I', policy_name, table_name);
        RAISE NOTICE 'Politique % supprimée', policy_name;
    ELSE
        RAISE NOTICE 'Politique % n''existe pas', policy_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Supprimer toutes les anciennes politiques
SELECT drop_policy_if_exists('Users can upload their own avatar', 'objects');
SELECT drop_policy_if_exists('Users can delete their own avatar', 'objects');
SELECT drop_policy_if_exists('Users can update their own avatar', 'objects');
SELECT drop_policy_if_exists('Anyone can view avatars', 'objects');
SELECT drop_policy_if_exists('Users can upload their own documents', 'objects');
SELECT drop_policy_if_exists('Users can view their own documents', 'objects');
SELECT drop_policy_if_exists('Users can delete their own documents', 'objects');
SELECT drop_policy_if_exists('Users can update their own documents', 'objects');

-- 3. Créer les nouvelles politiques pour AVATARS
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

-- Politique de lecture pour avatars (public)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 4. Créer les nouvelles politiques pour DOCUMENTS
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

-- 5. Nettoyer la fonction temporaire
DROP FUNCTION drop_policy_if_exists(text, text);

-- 6. Vérifier les nouvelles politiques
SELECT 
    policyname,
    CASE 
        WHEN cmd LIKE '%avatars%' THEN 'AVATARS'
        WHEN cmd LIKE '%documents%' THEN 'DOCUMENTS'
        ELSE 'OTHER'
    END as bucket_type,
    CASE 
        WHEN cmd LIKE '%INSERT%' THEN 'UPLOAD'
        WHEN cmd LIKE '%SELECT%' THEN 'READ'
        WHEN cmd LIKE '%DELETE%' THEN 'DELETE'
        WHEN cmd LIKE '%UPDATE%' THEN 'UPDATE'
        ELSE 'OTHER'
    END as operation
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (policyname LIKE '%avatar%' OR policyname LIKE '%document%')
ORDER BY bucket_type, operation;

-- 7. Test des structures de chemins
SELECT 
    'Test avatars - Nom de fichier valide:' as test,
    '173b9f52-9b83-48ea-aeac-67be38917acd_1749880148541.png' as example,
    '173b9f52-9b83-48ea-aeac-67be38917acd_1749880148541.png' ~ ('^173b9f52-9b83-48ea-aeac-67be38917acd_') as should_match;

SELECT 
    'Test documents - Structure de dossier:' as test,
    '173b9f52-9b83-48ea-aeac-67be38917acd/file.pdf' as example,
    (storage.foldername('173b9f52-9b83-48ea-aeac-67be38917acd/file.pdf'))[1] as extracted_user_id;

-- 8. Vérifier les buckets
SELECT 
    id as bucket_name,
    public,
    file_size_limit / 1024 / 1024 as size_limit_mb,
    array_length(allowed_mime_types, 1) as mime_types_count
FROM storage.buckets 
WHERE id IN ('avatars', 'documents')
ORDER BY id;

-- 9. Résumé final
SELECT 
    COUNT(*) as total_policies,
    COUNT(*) FILTER (WHERE policyname LIKE '%avatar%') as avatar_policies,
    COUNT(*) FILTER (WHERE policyname LIKE '%document%') as document_policies
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (policyname LIKE '%avatar%' OR policyname LIKE '%document%'); 
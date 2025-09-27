-- Script pour vérifier et corriger les politiques de storage
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier les politiques existantes
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
ORDER BY policyname;

-- 2. Vérifier les buckets existants
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id IN ('avatars', 'documents');

-- 3. Supprimer les politiques existantes si nécessaire (optionnel)
-- Décommentez ces lignes si vous voulez recommencer à zéro

/*
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
*/

-- 4. Créer les buckets s'ils n'existent pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  -- Bucket avatars (public)
  (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  ),
  -- Bucket documents (privé)
  (
    'documents',
    'documents',
    false,
    10485760, -- 10MB
    ARRAY[
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ]
  )
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 5. Créer les politiques seulement si elles n'existent pas
DO $$
BEGIN
    -- Politiques pour AVATARS
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' 
        AND policyname = 'Users can upload their own avatar'
    ) THEN
        CREATE POLICY "Users can upload their own avatar" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'avatars' 
            AND auth.uid()::text = (storage.foldername(name))[1]
            AND auth.role() = 'authenticated'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' 
        AND policyname = 'Anyone can view avatars'
    ) THEN
        CREATE POLICY "Anyone can view avatars" ON storage.objects
        FOR SELECT USING (bucket_id = 'avatars');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' 
        AND policyname = 'Users can delete their own avatar'
    ) THEN
        CREATE POLICY "Users can delete their own avatar" ON storage.objects
        FOR DELETE USING (
            bucket_id = 'avatars' 
            AND auth.uid()::text = (storage.foldername(name))[1]
            AND auth.role() = 'authenticated'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' 
        AND policyname = 'Users can update their own avatar'
    ) THEN
        CREATE POLICY "Users can update their own avatar" ON storage.objects
        FOR UPDATE USING (
            bucket_id = 'avatars' 
            AND auth.uid()::text = (storage.foldername(name))[1]
            AND auth.role() = 'authenticated'
        );
    END IF;

    -- Politiques pour DOCUMENTS
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' 
        AND policyname = 'Users can upload their own documents'
    ) THEN
        CREATE POLICY "Users can upload their own documents" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'documents' 
            AND auth.uid()::text = (storage.foldername(name))[2]
            AND auth.role() = 'authenticated'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' 
        AND policyname = 'Users can view their own documents'
    ) THEN
        CREATE POLICY "Users can view their own documents" ON storage.objects
        FOR SELECT USING (
            bucket_id = 'documents' 
            AND auth.uid()::text = (storage.foldername(name))[2]
            AND auth.role() = 'authenticated'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' 
        AND policyname = 'Users can delete their own documents'
    ) THEN
        CREATE POLICY "Users can delete their own documents" ON storage.objects
        FOR DELETE USING (
            bucket_id = 'documents' 
            AND auth.uid()::text = (storage.foldername(name))[2]
            AND auth.role() = 'authenticated'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' 
        AND policyname = 'Users can update their own documents'
    ) THEN
        CREATE POLICY "Users can update their own documents" ON storage.objects
        FOR UPDATE USING (
            bucket_id = 'documents' 
            AND auth.uid()::text = (storage.foldername(name))[2]
            AND auth.role() = 'authenticated'
        );
    END IF;

    RAISE NOTICE 'Configuration des buckets et politiques terminée';
END $$;

-- 6. Vérification finale
SELECT 
    'Buckets créés:' as info,
    COUNT(*) as count
FROM storage.buckets 
WHERE id IN ('avatars', 'documents');

SELECT 
    'Politiques créées:' as info,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%avatar%' OR policyname LIKE '%document%';

-- 7. Afficher le résumé final
SELECT 
    b.id as bucket_name,
    b.public,
    b.file_size_limit / 1024 / 1024 as size_limit_mb,
    array_length(b.allowed_mime_types, 1) as mime_types_count,
    COUNT(p.policyname) as policies_count
FROM storage.buckets b
LEFT JOIN pg_policies p ON (
    p.schemaname = 'storage' 
    AND p.tablename = 'objects' 
    AND (
        (b.id = 'avatars' AND p.policyname LIKE '%avatar%') OR
        (b.id = 'documents' AND p.policyname LIKE '%document%')
    )
)
WHERE b.id IN ('avatars', 'documents')
GROUP BY b.id, b.public, b.file_size_limit, b.allowed_mime_types
ORDER BY b.id; 
-- Script complet pour configurer toutes les politiques RLS
-- À exécuter dans l'éditeur SQL de Supabase

-- ========================================
-- 1. CRÉER TOUS LES BUCKETS
-- ========================================

-- Bucket avatars (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket documents (privé)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Privé
  10485760, -- 10MB
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Bucket homepage (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homepage',
  'homepage',
  true, -- Public
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 2. SUPPRIMER TOUTES LES ANCIENNES POLITIQUES
-- ========================================

-- Supprimer les politiques avatars
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

-- Supprimer les politiques documents
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;

-- Supprimer les politiques homepage
DROP POLICY IF EXISTS "Admins can upload homepage images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view homepage images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete homepage images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update homepage images" ON storage.objects;

-- ========================================
-- 3. CRÉER LES NOUVELLES POLITIQUES AVATARS
-- ========================================

-- Upload d'avatar (utilisateurs authentifiés)
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND name ~ ('^' || auth.uid()::text || '_')
);

-- Lecture des avatars (public)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Suppression d'avatar (utilisateurs authentifiés)
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND name ~ ('^' || auth.uid()::text || '_')
);

-- Mise à jour d'avatar (utilisateurs authentifiés)
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
  AND name ~ ('^' || auth.uid()::text || '_')
);

-- ========================================
-- 4. CRÉER LES NOUVELLES POLITIQUES DOCUMENTS
-- ========================================

-- Upload de documents (utilisateurs authentifiés)
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Lecture de documents (utilisateurs authentifiés)
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Suppression de documents (utilisateurs authentifiés)
CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Mise à jour de documents (utilisateurs authentifiés)
CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ========================================
-- 5. CRÉER LES NOUVELLES POLITIQUES HOMEPAGE
-- ========================================

-- Upload d'images homepage (admins seulement)
CREATE POLICY "Admins can upload homepage images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'homepage' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  )
);

-- Lecture d'images homepage (public)
CREATE POLICY "Anyone can view homepage images" ON storage.objects
FOR SELECT USING (bucket_id = 'homepage');

-- Suppression d'images homepage (admins seulement)
CREATE POLICY "Admins can delete homepage images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'homepage' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  )
);

-- Mise à jour d'images homepage (admins seulement)
CREATE POLICY "Admins can update homepage images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'homepage' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  )
);

-- ========================================
-- 6. VÉRIFICATIONS FINALES
-- ========================================

-- Vérifier tous les buckets
SELECT 
    'BUCKETS CRÉÉS:' as section,
    id,
    name,
    public,
    file_size_limit / 1024 / 1024 as size_limit_mb
FROM storage.buckets 
WHERE id IN ('avatars', 'documents', 'homepage')
ORDER BY id;

-- Vérifier toutes les politiques
SELECT 
    'POLITIQUES CRÉÉES:' as section,
    policyname,
    CASE 
        WHEN cmd LIKE '%avatars%' THEN 'AVATARS'
        WHEN cmd LIKE '%documents%' THEN 'DOCUMENTS'
        WHEN cmd LIKE '%homepage%' THEN 'HOMEPAGE'
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
ORDER BY policyname;

-- Compter les politiques par bucket
SELECT 
    'RÉSUMÉ POLITIQUES:' as section,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd LIKE '%avatars%' THEN 1 END) as avatars_policies,
    COUNT(CASE WHEN cmd LIKE '%documents%' THEN 1 END) as documents_policies,
    COUNT(CASE WHEN cmd LIKE '%homepage%' THEN 1 END) as homepage_policies
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

SELECT 'CONFIGURATION STORAGE TERMINÉE - TOUS LES BUCKETS ET POLITIQUES SONT PRÊTS !' as message; 
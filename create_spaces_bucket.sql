-- Script pour créer le bucket spaces pour les images d'espaces
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer le bucket pour les images d'espaces (public pour affichage facile)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'spaces',
  'spaces',
  true, -- Public pour faciliter l'affichage
  5242880, -- 5MB max
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ]
) ON CONFLICT (id) DO NOTHING;

-- 2. Supprimer les anciennes politiques spaces si elles existent
DROP POLICY IF EXISTS "Admins can upload space images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view space images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete space images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update space images" ON storage.objects;

-- 3. Politique pour l'upload (admins seulement)
CREATE POLICY "Admins can upload space images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'spaces' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- 4. Politique pour la lecture (public)
CREATE POLICY "Anyone can view space images" ON storage.objects
FOR SELECT USING (bucket_id = 'spaces');

-- 5. Politique pour la suppression (admins seulement)
CREATE POLICY "Admins can delete space images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'spaces' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- 6. Politique pour la mise à jour (admins seulement)
CREATE POLICY "Admins can update space images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'spaces' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- 7. Vérifier que le bucket a été créé
SELECT 
    'BUCKET SPACES CRÉÉ:' as section,
    id,
    name,
    public,
    file_size_limit / 1024 / 1024 as size_limit_mb,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'spaces';

-- 8. Vérifier les politiques créées
SELECT 
    'POLITIQUES SPACES CRÉÉES:' as section,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%space%'
ORDER BY policyname; 
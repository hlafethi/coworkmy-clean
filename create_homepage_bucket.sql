-- Script pour créer le bucket homepage pour les images du site
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer le bucket homepage (public pour affichage facile)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homepage',
  'homepage',
  true, -- Public pour faciliter l'affichage
  10485760, -- 10MB max
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ]
) ON CONFLICT (id) DO NOTHING;

-- 2. Supprimer les anciennes politiques homepage si elles existent
DROP POLICY IF EXISTS "Admins can upload homepage images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view homepage images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete homepage images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update homepage images" ON storage.objects;

-- 3. Politique pour l'upload (admins seulement)
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

-- 4. Politique pour la lecture (public)
CREATE POLICY "Anyone can view homepage images" ON storage.objects
FOR SELECT USING (bucket_id = 'homepage');

-- 5. Politique pour la suppression (admins seulement)
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

-- 6. Politique pour la mise à jour (admins seulement)
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

-- 7. Vérifier que le bucket a été créé
SELECT 
    'BUCKET CRÉÉ:' as status,
    id,
    name,
    public,
    file_size_limit / 1024 / 1024 as size_limit_mb,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'homepage';

-- 8. Vérifier les politiques créées
SELECT 
    'POLITIQUES CRÉÉES:' as status,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%homepage%'
ORDER BY policyname; 
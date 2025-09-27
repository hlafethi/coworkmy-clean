-- Script pour créer le bucket homepage (public)
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer le bucket pour les images de la homepage (public pour affichage facile)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'homepage',
  'homepage',
  true, -- Public pour faciliter l'affichage
  5242880, -- 5MB max
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ]
) ON CONFLICT (id) DO NOTHING;

-- 2. Politique pour l'upload (admins peuvent uploader des images homepage)
CREATE POLICY "Admins can upload homepage images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'homepage' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

-- 3. Politique pour la lecture (tout le monde peut voir les images homepage car bucket public)
CREATE POLICY "Anyone can view homepage images" ON storage.objects
FOR SELECT USING (bucket_id = 'homepage');

-- 4. Politique pour la suppression (admins peuvent supprimer les images homepage)
CREATE POLICY "Admins can delete homepage images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'homepage' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

-- 5. Politique pour la mise à jour (admins peuvent mettre à jour les images homepage)
CREATE POLICY "Admins can update homepage images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'homepage' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);

-- 6. Vérifier que le bucket a été créé
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'homepage'; 
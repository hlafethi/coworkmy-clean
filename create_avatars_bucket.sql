-- Script pour créer le bucket avatars (public)
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer le bucket pour les avatars (public pour affichage facile)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public pour faciliter l'affichage
  5242880, -- 5MB max
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ]
) ON CONFLICT (id) DO NOTHING;

-- 2. Politique pour l'upload (utilisateurs authentifiés peuvent uploader leurs propres avatars)
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- 3. Politique pour la lecture (tout le monde peut voir les avatars car bucket public)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 4. Politique pour la suppression (utilisateurs peuvent supprimer leurs propres avatars)
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- 5. Politique pour la mise à jour (utilisateurs peuvent mettre à jour leurs propres avatars)
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- 6. Vérifier que le bucket a été créé
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'avatars'; 
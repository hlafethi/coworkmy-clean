-- Création du bucket kb-articles pour les images de la base de connaissances
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kb-articles',
  'kb-articles',
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Policy pour permettre l'upload d'images par les admins
CREATE POLICY "Admins can upload KB images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'kb-articles' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid()::uuid 
    AND profiles.is_admin = true
  )
);

-- Policy pour permettre la lecture publique des images KB
CREATE POLICY "Public can view KB images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'kb-articles'
);

-- Policy pour permettre la suppression d'images par les admins
CREATE POLICY "Admins can delete KB images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'kb-articles' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid()::uuid 
    AND profiles.is_admin = true
  )
);

-- Policy pour permettre la mise à jour d'images par les admins
CREATE POLICY "Admins can update KB images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'kb-articles' AND 
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid()::uuid 
    AND profiles.is_admin = true
  )
); 
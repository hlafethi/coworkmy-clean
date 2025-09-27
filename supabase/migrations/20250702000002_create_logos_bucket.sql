-- Création du bucket pour les logos d'entreprise
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Policy pour permettre aux utilisateurs authentifiés d'uploader leur logo
CREATE POLICY "Users can upload their own logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour permettre aux utilisateurs de voir tous les logos (public)
CREATE POLICY "Logos are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

-- Policy pour permettre aux utilisateurs de mettre à jour leur logo
CREATE POLICY "Users can update their own logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour permettre aux utilisateurs de supprimer leur logo
CREATE POLICY "Users can delete their own logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'logos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy pour permettre aux admins de gérer tous les logos
CREATE POLICY "Admins can manage all logos" ON storage.objects
FOR ALL USING (
  bucket_id = 'logos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

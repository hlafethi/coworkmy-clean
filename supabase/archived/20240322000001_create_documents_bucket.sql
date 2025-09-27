-- Créer le bucket pour les documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false, -- Fichiers privés
  10485760, -- 10MB max
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
);

-- Politique de sécurité pour l'upload (utilisateurs authentifiés seulement)
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND auth.role() = 'authenticated'
);

-- Politique pour la lecture (utilisateurs peuvent lire leurs propres documents)
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND auth.role() = 'authenticated'
);

-- Politique pour la suppression (utilisateurs peuvent supprimer leurs propres documents)
CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND auth.role() = 'authenticated'
);

-- Politique pour la mise à jour (utilisateurs peuvent mettre à jour leurs propres documents)
CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND auth.role() = 'authenticated'
);

-- Activer RLS sur storage.objects si ce n'est pas déjà fait
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 
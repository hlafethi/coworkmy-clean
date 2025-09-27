-- Ajouter les colonnes manquantes à profile_documents
ALTER TABLE profile_documents ADD COLUMN IF NOT EXISTS document_url text;
ALTER TABLE profile_documents ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE profile_documents ADD COLUMN IF NOT EXISTS file_size integer;
ALTER TABLE profile_documents ADD COLUMN IF NOT EXISTS file_type text;

-- Vérifier la structure après modification
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profile_documents'
ORDER BY ordinal_position;

-- Mettre à jour les enregistrements existants avec des valeurs par défaut
UPDATE profile_documents 
SET 
  document_url = '',
  file_name = CONCAT('Document ', document_type),
  file_size = 0,
  file_type = 'application/octet-stream'
WHERE document_url IS NULL OR file_name IS NULL OR file_size IS NULL OR file_type IS NULL; 
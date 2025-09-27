-- Ajouter la colonne file_name à profile_documents
ALTER TABLE profile_documents ADD COLUMN IF NOT EXISTS file_name text;

-- Mettre à jour les enregistrements existants avec un nom de fichier basé sur l'URL
UPDATE profile_documents 
SET file_name = CASE 
  WHEN document_url IS NOT NULL AND document_url != '' 
  THEN SPLIT_PART(document_url, '/', -1)
  ELSE 'Document'
END
WHERE file_name IS NULL OR file_name = ''; 
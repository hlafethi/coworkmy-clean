-- Vérifier si la contrainte de clé étrangère existe
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'profile_documents'
  AND ccu.table_name = 'profiles';

-- Si la contrainte n'existe pas, la créer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profile_documents_profile_id_fkey'
  ) THEN
    ALTER TABLE profile_documents 
    ADD CONSTRAINT profile_documents_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES profiles(id);
  END IF;
END $$;

-- Vérifier les données
SELECT 
  p.user_id,
  p.full_name,
  COUNT(pd.id) as document_count
FROM profiles p
LEFT JOIN profile_documents pd ON p.id = pd.profile_id
GROUP BY p.id, p.user_id, p.full_name
ORDER BY document_count DESC;

-- Afficher quelques exemples de documents
SELECT 
  pd.id,
  pd.document_type,
  pd.document_url,
  pd.file_name,
  pd.file_size,
  pd.file_type,
  pd.verified,
  pd.created_at,
  p.user_id,
  p.full_name
FROM profile_documents pd
JOIN profiles p ON pd.profile_id = p.id
LIMIT 5; 
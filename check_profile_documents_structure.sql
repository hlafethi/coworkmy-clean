-- Vérification de la structure complète de profile_documents
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profile_documents'
ORDER BY ordinal_position;

-- Vérifier s'il y a des données
SELECT COUNT(*) as total_documents FROM profile_documents;

-- Afficher quelques exemples avec les nouvelles colonnes
SELECT 
  id,
  document_type,
  document_url,
  file_size,
  file_type,
  verified,
  created_at
FROM profile_documents 
LIMIT 5;

-- Vérifier les documents par utilisateur avec jointure
SELECT 
  p.user_id,
  p.full_name,
  COUNT(pd.id) as document_count
FROM profiles p
LEFT JOIN profile_documents pd ON p.id = pd.profile_id
GROUP BY p.id, p.user_id, p.full_name
ORDER BY document_count DESC; 
-- Vérification de l'existence de la table profile_documents
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profile_documents'
) as table_exists;

-- Si la table existe, afficher sa structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profile_documents'
ORDER BY ordinal_position;

-- Afficher quelques exemples de données
SELECT * FROM profile_documents LIMIT 5;

-- Compter le nombre total de documents
SELECT COUNT(*) as total_documents FROM profile_documents;

-- Vérifier les documents par utilisateur
SELECT user_id, COUNT(*) as document_count 
FROM profile_documents 
GROUP BY user_id 
ORDER BY document_count DESC; 
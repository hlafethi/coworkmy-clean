-- Vérifier la structure réelle de la table profile_documents
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

-- Afficher quelques exemples de données
SELECT * FROM profile_documents LIMIT 5;

-- Vérifier les noms de colonnes possibles pour l'URL
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profile_documents'
AND column_name LIKE '%url%' OR column_name LIKE '%file%' OR column_name LIKE '%path%'; 
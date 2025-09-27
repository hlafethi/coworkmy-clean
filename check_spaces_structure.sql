-- Vérifier la structure complète de la table spaces
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'spaces'
ORDER BY ordinal_position;

-- Chercher les colonnes qui pourraient contenir des images
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'spaces' 
  AND (column_name LIKE '%image%' 
       OR column_name LIKE '%photo%' 
       OR column_name LIKE '%avatar%' 
       OR column_name LIKE '%url%')
ORDER BY column_name; 
-- Vérifier la structure de la table spaces
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'spaces'
ORDER BY ordinal_position;

-- Vérifier les données d'un espace spécifique pour voir les champs image
SELECT 
  id,
  name,
  image_url,
  image,
  images,
  photo_url,
  photo,
  avatar_url,
  avatar
FROM spaces 
LIMIT 3; 
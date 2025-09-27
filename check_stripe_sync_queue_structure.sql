-- Vérifier la structure de la table stripe_sync_queue
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'stripe_sync_queue'
ORDER BY ordinal_position;

-- Vérifier si la colonne processed_at existe
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'stripe_sync_queue' 
  AND column_name = 'processed_at';

-- Vérifier si la colonne error_message existe
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'stripe_sync_queue' 
  AND column_name = 'error_message'; 
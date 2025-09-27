-- Vérifier l'état actuel de la file d'attente
SELECT 
  id,
  space_id,
  event_type,
  payload,
  created_at,
  processed_at,
  error_message
FROM stripe_sync_queue 
ORDER BY created_at DESC 
LIMIT 10;

-- Compter les jobs par statut
SELECT 
  CASE 
    WHEN processed_at IS NULL THEN 'En attente'
    WHEN error_message IS NOT NULL THEN 'Erreur'
    ELSE 'Traité'
  END as status,
  COUNT(*) as count
FROM stripe_sync_queue 
GROUP BY 
  CASE 
    WHEN processed_at IS NULL THEN 'En attente'
    WHEN error_message IS NOT NULL THEN 'Erreur'
    ELSE 'Traité'
  END;

-- Identifier les jobs avec des payloads incomplets
SELECT 
  id,
  space_id,
  payload,
  created_at
FROM stripe_sync_queue 
WHERE payload->>'name' IS NULL 
   OR payload->>'monthly_price' IS NULL
   OR payload->>'name' = 'undefined'
ORDER BY created_at DESC; 
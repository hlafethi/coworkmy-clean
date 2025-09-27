-- Vérifier l'état actuel de la file d'attente (version corrigée)
SELECT 
  id,
  space_id,
  event_type,
  payload,
  created_at
FROM stripe_sync_queue 
ORDER BY created_at DESC 
LIMIT 10;

-- Compter les jobs (version simplifiée)
SELECT 
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN payload->>'name' IS NULL THEN 1 END) as jobs_sans_nom,
  COUNT(CASE WHEN payload->>'monthly_price' IS NULL THEN 1 END) as jobs_sans_prix
FROM stripe_sync_queue;

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
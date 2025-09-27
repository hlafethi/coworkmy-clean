-- 1. Nettoyer complètement la file d'attente
DELETE FROM stripe_sync_queue;

-- 2. Vérifier que la table est vide
SELECT COUNT(*) as remaining_jobs FROM stripe_sync_queue;

-- 3. Corriger le trigger (exécuter fix_trigger_payload.sql d'abord)
-- Puis déclencher une mise à jour pour tous les espaces actifs
UPDATE spaces 
SET last_stripe_sync = last_stripe_sync
WHERE is_active = true;

-- 4. Vérifier les nouveaux jobs créés avec le bon payload
SELECT 
  space_id,
  payload->>'name' as space_name,
  payload->>'pricing_type' as pricing_type,
  payload->>'monthly_price' as monthly_price,
  payload->>'hourly_price' as hourly_price,
  created_at
FROM stripe_sync_queue 
ORDER BY created_at DESC
LIMIT 5; 
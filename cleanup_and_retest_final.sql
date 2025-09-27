-- 1. Nettoyer tous les jobs en erreur ou en attente
DELETE FROM stripe_sync_queue 
WHERE status IN ('error', 'pending') 
   OR payload->>'name' IS NULL 
   OR payload->>'monthly_price' IS NULL;

-- 2. Vérifier que la table est vide
SELECT COUNT(*) as remaining_jobs FROM stripe_sync_queue;

-- 3. Déclencher une mise à jour pour tous les espaces actifs (déclenchera le trigger corrigé)
UPDATE spaces 
SET last_stripe_sync = last_stripe_sync
WHERE is_active = true;

-- 4. Vérifier les nouveaux jobs créés avec le bon format
SELECT 
  space_id,
  payload->>'name' as space_name,
  payload->>'pricing_type' as pricing_type,
  payload->>'monthly_price' as monthly_price,
  payload->>'hourly_price' as hourly_price,
  created_at
FROM stripe_sync_queue 
ORDER BY created_at DESC
LIMIT 10;

-- 5. Compter les jobs par format
SELECT 
  CASE 
    WHEN payload->>'name' IS NOT NULL THEN 'Nouveau format'
    WHEN payload->>'space_name' IS NOT NULL THEN 'Ancien format'
    ELSE 'Format inconnu'
  END as format_type,
  COUNT(*) as count
FROM stripe_sync_queue 
GROUP BY 
  CASE 
    WHEN payload->>'name' IS NOT NULL THEN 'Nouveau format'
    WHEN payload->>'space_name' IS NOT NULL THEN 'Ancien format'
    ELSE 'Format inconnu'
  END; 
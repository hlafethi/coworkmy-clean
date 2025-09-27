-- Vérifier le mode Stripe actuel
SELECT 
  key,
  value->>'mode' as current_mode,
  value as full_config
FROM admin_settings 
WHERE key = 'stripe';

-- Forcer le mode live si nécessaire
UPDATE admin_settings 
SET value = jsonb_set(value, '{mode}', '"live"')
WHERE key = 'stripe' AND (value->>'mode' IS NULL OR value->>'mode' != 'live');

-- Vérifier après mise à jour
SELECT 
  key,
  value->>'mode' as updated_mode,
  CASE 
    WHEN value->>'mode' = 'live' THEN '✅ Mode Production'
    WHEN value->>'mode' = 'test' THEN '⚠️ Mode Test'
    ELSE '❌ Mode non défini'
  END as status
FROM admin_settings 
WHERE key = 'stripe'; 
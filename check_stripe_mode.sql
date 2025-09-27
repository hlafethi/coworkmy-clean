-- Script pour vérifier et corriger le mode Stripe
-- Vérifier la configuration actuelle
SELECT 
  key,
  value->>'mode' as current_mode,
  CASE 
    WHEN value->>'mode' = 'live' THEN '✅ Mode Production'
    WHEN value->>'mode' = 'test' THEN '⚠️ Mode Test'
    ELSE '❌ Mode non défini'
  END as status,
  CASE 
    WHEN value->>'live_secret_key' IS NOT NULL AND value->>'live_secret_key' != '' THEN '✅ Clé live présente'
    ELSE '❌ Clé live manquante'
  END as live_key_status,
  CASE 
    WHEN value->>'test_secret_key' IS NOT NULL AND value->>'test_secret_key' != '' THEN '✅ Clé test présente'
    ELSE '❌ Clé test manquante'
  END as test_key_status
FROM admin_settings 
WHERE key = 'stripe';

-- Vérifier la configuration Stripe actuelle
SELECT 
  key,
  value->>'mode' as current_mode,
  value->>'live_publishable_key' as live_pk,
  value->>'live_secret_key' as live_sk,
  value->>'test_publishable_key' as test_pk,
  value->>'test_secret_key' as test_sk,
  value as full_config
FROM admin_settings 
WHERE key = 'stripe';

-- Forcer le mode live si les clés live sont présentes
UPDATE admin_settings 
SET value = jsonb_set(value, '{mode}', '"live"')
WHERE key = 'stripe' 
  AND value->>'live_secret_key' IS NOT NULL 
  AND value->>'live_secret_key' != ''
  AND (value->>'mode' IS NULL OR value->>'mode' != 'live');

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
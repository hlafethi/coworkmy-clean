-- Script pour vérifier l'état actuel de la configuration Stripe
-- Exécuter dans la console SQL Supabase

-- 1. Vérifier si la configuration existe
SELECT 
  COUNT(*) as config_count
FROM admin_settings 
WHERE key = 'stripe';

-- 2. Afficher la configuration brute
SELECT 
  key,
  value,
  LENGTH(value::text) as length,
  typeof(value) as value_type
FROM admin_settings 
WHERE key = 'stripe';

-- 3. Tester si c'est un JSON valide
SELECT 
  key,
  CASE 
    WHEN value IS NULL THEN 'NULL'
    WHEN value = '' THEN 'VIDE'
    WHEN value::text = 'null' THEN 'NULL_STRING'
    WHEN value::json IS NOT NULL THEN 'JSON_VALIDE'
    ELSE 'JSON_INVALIDE'
  END as json_status
FROM admin_settings 
WHERE key = 'stripe';

-- 4. Si JSON valide, afficher la structure
SELECT 
  key,
  (value::json)->>'mode' as mode,
  CASE 
    WHEN (value::json)->>'test_secret_key' IS NOT NULL AND (value::json)->>'test_secret_key' != '' THEN 'TEST_KEY_PRESENTE'
    ELSE 'TEST_KEY_MANQUANTE'
  END as test_key_status,
  CASE 
    WHEN (value::json)->>'live_secret_key' IS NOT NULL AND (value::json)->>'live_secret_key' != '' THEN 'LIVE_KEY_PRESENTE'
    ELSE 'LIVE_KEY_MANQUANTE'
  END as live_key_status
FROM admin_settings 
WHERE key = 'stripe' AND value::json IS NOT NULL; 
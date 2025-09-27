-- Script pour vérifier et corriger la configuration Stripe
-- Exécuter dans la console SQL Supabase

-- 1. Vérifier la configuration actuelle
SELECT 
  key,
  value,
  CASE 
    WHEN value IS NULL THEN 'NULL'
    WHEN value = '' THEN 'VIDE'
    WHEN value::text = 'null' THEN 'NULL_STRING'
    ELSE 'VALEUR'
  END as status,
  LENGTH(value::text) as length
FROM admin_settings 
WHERE key = 'stripe';

-- 2. Vérifier si la configuration est un JSON valide
SELECT 
  key,
  value,
  CASE 
    WHEN value IS NULL THEN 'NULL'
    WHEN value = '' THEN 'VIDE'
    WHEN value::text = 'null' THEN 'NULL_STRING'
    WHEN value::json IS NOT NULL THEN 'JSON_VALIDE'
    ELSE 'JSON_INVALIDE'
  END as json_status
FROM admin_settings 
WHERE key = 'stripe';

-- 3. Afficher la structure de la configuration si elle existe
SELECT 
  key,
  value::json as config_json,
  (value::json)->>'mode' as mode,
  (value::json)->>'test_secret_key' as test_key_exists,
  (value::json)->>'live_secret_key' as live_key_exists,
  CASE 
    WHEN (value::json)->>'test_secret_key' IS NOT NULL AND (value::json)->>'test_secret_key' != '' THEN 'TEST_KEY_OK'
    WHEN (value::json)->>'live_secret_key' IS NOT NULL AND (value::json)->>'live_secret_key' != '' THEN 'LIVE_KEY_OK'
    ELSE 'AUCUNE_CLE'
  END as key_status
FROM admin_settings 
WHERE key = 'stripe' AND value::json IS NOT NULL; 
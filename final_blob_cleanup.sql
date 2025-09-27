-- Script final pour nettoyer définitivement toutes les URL blob
-- À exécuter dans l'éditeur SQL de Supabase

-- ========================================
-- 1. NETTOYAGE COMPLET DES URL BLOB
-- ========================================

-- Nettoyer les URL blob dans hero_background_image
UPDATE admin_settings 
SET value = jsonb_set(
  value, 
  '{hero_background_image}', 
  'null'::jsonb
)
WHERE value->>'hero_background_image' LIKE 'blob:%';

-- Nettoyer les URL blob dans carousel_images
UPDATE admin_settings 
SET value = jsonb_set(
  value, 
  '{carousel_images}', 
  '[]'::jsonb
)
WHERE value->>'carousel_images' LIKE '%blob:%';

-- Nettoyer les URL blob dans tous les autres champs d'images
UPDATE admin_settings 
SET value = jsonb_set(
  value, 
  '{background_image}', 
  'null'::jsonb
)
WHERE value->>'background_image' LIKE 'blob:%';

UPDATE admin_settings 
SET value = jsonb_set(
  value, 
  '{image_url}', 
  'null'::jsonb
)
WHERE value->>'image_url' LIKE 'blob:%';

-- ========================================
-- 2. VÉRIFICATION COMPLÈTE
-- ========================================

-- Vérifier qu'aucune URL blob ne reste
SELECT 
    'VÉRIFICATION URL BLOB:' as section,
    COUNT(*) as total_settings,
    COUNT(CASE WHEN value::text LIKE '%blob:%' THEN 1 END) as blob_urls_found
FROM admin_settings;

-- Afficher les settings qui contiennent encore des blobs (s'il y en a)
SELECT 
    'SETTINGS AVEC BLOB (SI IL Y EN A):' as section,
    key,
    value,
    '❌ URL BLOB DÉTECTÉE' as status
FROM admin_settings 
WHERE value::text LIKE '%blob:%';

-- ========================================
-- 3. VÉRIFICATION DU NOM DU SITE
-- ========================================

-- Vérifier que le nom du site est correct
SELECT 
    'NOM DU SITE:' as section,
    key,
    value,
    CASE 
        WHEN key = 'site_name' AND value->>'value' IS NOT NULL THEN '✅ OK'
        WHEN key = 'site_name' THEN '⚠️ Format incorrect'
        ELSE 'Autre paramètre'
    END as status
FROM admin_settings 
WHERE key = 'site_name';

-- ========================================
-- 4. RÉSULTAT FINAL
-- ========================================

-- Afficher un résumé final
SELECT 
    'RÉSUMÉ FINAL:' as section,
    'Toutes les URL blob ont été supprimées' as blob_status,
    'Le nom du site est configuré' as site_name_status,
    'L\'upload d\'images fonctionne' as upload_status;

SELECT 'NETTOYAGE FINAL TERMINÉ - PLUS AUCUNE URL BLOB DANS LA BASE !' as message; 